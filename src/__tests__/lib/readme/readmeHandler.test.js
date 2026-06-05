jest.mock('fs');
jest.mock('../../../../scripts/lib/readme/readmeFallback');
jest.mock('../../../../scripts/lib/media');
jest.mock('../../../../scripts/lib/media/mediaDownloader');

const fs = require('fs');
const { fetchReadmeFromRaw } = require('../../../../scripts/lib/readme/readmeFallback');
const mediaHelper = require('../../../../scripts/lib/media');
const mediaDownloader = require('../../../../scripts/lib/media/mediaDownloader');

// Give mediaDownloader stub implementations used inside readmeHandler
mediaDownloader.ensureDir = jest.fn();
mediaDownloader.md5 = jest.fn(() => 'abc123');
mediaHelper.processNodeMedia = jest.fn(async () => {});

const { processNodeReadme } = require('../../../../scripts/lib/readme/readmeHandler');

const MEDIA_ROOT = '/tmp/media';
const getAxios = () => null;

describe('readmeHandler – processNodeReadme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mediaDownloader.ensureDir.mockClear();
    mediaDownloader.md5.mockReturnValue('abc123');
    mediaHelper.processNodeMedia.mockResolvedValue(undefined);
    fs.existsSync.mockReturnValue(false);
    fs.writeFileSync.mockImplementation(() => {});
  });

  test('exports processNodeReadme as a function', () => {
    expect(typeof processNodeReadme).toBe('function');
  });

  test('returns node when node.object.text is already present', async () => {
    const node = { name: 'repo', object: { text: '# Hello\n\nWorld.' } };
    const result = await processNodeReadme(node, MEDIA_ROOT, getAxios, {});
    expect(result).toBe(node);
    expect(fetchReadmeFromRaw).not.toHaveBeenCalled();
  });

  test('fetches README via fallback when node has no object.text', async () => {
    fetchReadmeFromRaw.mockResolvedValue('# Fallback\n\nFetched from raw.');
    const node = { name: 'repo' };
    await processNodeReadme(node, MEDIA_ROOT, getAxios, {});
    expect(fetchReadmeFromRaw).toHaveBeenCalledWith('keglev', 'repo');
    expect(node.object.text).toBe('# Fallback\n\nFetched from raw.');
  });

  test('returns node early when fallback fetch returns null (no readme)', async () => {
    fetchReadmeFromRaw.mockResolvedValue(null);
    const node = { name: 'repo' };
    const result = await processNodeReadme(node, MEDIA_ROOT, getAxios, {});
    expect(result).toBe(node);
    expect(mediaHelper.processNodeMedia).not.toHaveBeenCalled();
  });

  test('returns node early when readme is not a string', async () => {
    const node = { name: 'repo', object: { text: 42 } };
    const result = await processNodeReadme(node, MEDIA_ROOT, getAxios, {});
    expect(result).toBe(node);
    expect(mediaHelper.processNodeMedia).not.toHaveBeenCalled();
  });

  test('populates node.technologies from AST', async () => {
    const node = { name: 'repo', object: { text: '# Project\n\n## Technologies\n\n- React\n- Node.js' } };
    await processNodeReadme(node, MEDIA_ROOT, getAxios, {});
    expect(Array.isArray(node.technologies)).toBe(true);
  });

  test('writes meta.json with readmeHash', async () => {
    const node = { name: 'repo', object: { text: '# Hello\n\nContent.' } };
    await processNodeReadme(node, MEDIA_ROOT, getAxios, {});
    expect(fs.writeFileSync).toHaveBeenCalled();
    const written = fs.writeFileSync.mock.calls[0][1];
    const meta = JSON.parse(written);
    expect(meta.readmeHash).toBe('abc123');
  });

  test('reads and merges existing meta.json when it exists', async () => {
    const existingMeta = { readmeHash: 'old', files: ['img.png'], imageSelection: 'old.png' };
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(existingMeta));
    const node = { name: 'repo', object: { text: '# Hello\n\nContent.' } };
    await processNodeReadme(node, MEDIA_ROOT, getAxios, {});
    const written = fs.writeFileSync.mock.calls[0][1];
    const meta = JSON.parse(written);
    expect(meta.readmeHash).toBe('abc123');
    expect(meta.files).toEqual(['img.png']);
  });

  test('uses default meta when existing meta.json is invalid JSON', async () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('{broken json');
    const node = { name: 'repo', object: { text: '# Hello\n\nContent.' } };
    await processNodeReadme(node, MEDIA_ROOT, getAxios, {});
    const written = fs.writeFileSync.mock.calls[0][1];
    const meta = JSON.parse(written);
    expect(meta.readmeHash).toBe('abc123');
    expect(meta.files).toEqual([]);
  });

  test('copies _imageSelection, primaryImage, _summarySource, _translation into meta', async () => {
    const node = {
      name: 'repo',
      object: { text: '# Hello\n\nContent.' },
      _imageSelection: 'hero.png',
      primaryImage: 'hero.png',
      _summarySource: 'heading',
      _translation: { summary: { text: 'Hallo' } },
    };
    await processNodeReadme(node, MEDIA_ROOT, getAxios, {});
    const written = fs.writeFileSync.mock.calls[0][1];
    const meta = JSON.parse(written);
    expect(meta.imageSelection).toBe('hero.png');
    expect(meta.primaryImage).toBe('hero.png');
    expect(meta.summarySource).toBe('heading');
    expect(meta.translation).toEqual({ summary: { text: 'Hallo' } });
  });

  test('does not set optional meta fields when node properties are absent', async () => {
    const node = { name: 'repo', object: { text: '# Hello\n\nContent.' } };
    await processNodeReadme(node, MEDIA_ROOT, getAxios, {});
    const written = fs.writeFileSync.mock.calls[0][1];
    const meta = JSON.parse(written);
    expect(meta.imageSelection).toBeUndefined();
    expect(meta.primaryImage).toBeUndefined();
    expect(meta.summarySource).toBeUndefined();
    expect(meta.translation).toBeUndefined();
  });

  test('returns node and does not throw when fs.writeFileSync fails', async () => {
    fs.writeFileSync.mockImplementation(() => { throw new Error('disk full'); });
    const node = { name: 'repo', object: { text: '# Hello\n\nContent.' } };
    await expect(processNodeReadme(node, MEDIA_ROOT, getAxios, {})).resolves.toBe(node);
  });

  test('sets node.docs and node.docsLink from AST when Documentation heading present', async () => {
    const readme = '# Project\n\n## Documentation\n\n[Read the docs](https://example.com/docs)\n\n## Other\n\nStuff.';
    const node = { name: 'repo', object: { text: readme } };
    await processNodeReadme(node, MEDIA_ROOT, getAxios, {});
    expect(node.docsLink).toBeTruthy();
  });
});
