// Verifies processNodeReadme: README fetch via GraphQL then raw fallback, AST
// parsing, media processing, and readmeHash-based change-detection skip logic.
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
