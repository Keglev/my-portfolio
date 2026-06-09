// Verifies processNodeMedia: service injection via downloader/parseReadme stubs,
// explicit project-image path preference over AST candidate, and badge/SVG
// image-ref rewriting.
const { processNodeMedia } = require('../../../../scripts/lib/media/mediaHelper');
 
const makeMediaDownloader = (overrides = {}) => ({
  ensureDir: jest.fn(),
  downloadIfNeeded: jest.fn().mockResolvedValue(null),
  ...overrides,
});
 
const makeParseReadme = (overrides = {}) => ({
  parseMarkdown: jest.fn().mockReturnValue({}),
  findImageCandidateFromAst: jest.fn().mockReturnValue(null),
  ...overrides,
});
 
describe('mediaHelper.processNodeMedia', () => {
  test('returns null when no candidate found and no readme', async () => {
    const node = { name: 'repo' };
    const result = await processNodeMedia(node, '/media', () => null, {
      parseReadme: makeParseReadme(),
      mediaDownloader: makeMediaDownloader(),
    });
    expect(result).toBeNull();
  });
 
  test('returns null when getAxios returns null (no explicit image probe)', async () => {
    const node = { name: 'repo' };
    const result = await processNodeMedia(node, '/media', () => null, {
      parseReadme: makeParseReadme(),
      mediaDownloader: makeMediaDownloader(),
      readme: '',
    });
    expect(result).toBeNull();
  });
 
  test('uses explicit project-image when HEAD returns 200 image/png', async () => {
    const node = { name: 'repo' };
    const mockAx = {
      head: jest.fn().mockResolvedValue({
        status: 200,
        headers: { 'content-type': 'image/png' },
      }),
    };
    const downloader = makeMediaDownloader({
      downloadIfNeeded: jest.fn().mockResolvedValue('project-image.png'),
    });
 
    const result = await processNodeMedia(node, '/media', () => mockAx, {
      parseReadme: makeParseReadme(),
      mediaDownloader: downloader,
    });
 
    expect(result).toBe('project-image.png');
    expect(node.primaryImage).toBe('/projects_media/repo/project-image.png');
    expect(node._imageSelection.reason).toBe('explicit-project-image');
  });
 
  test('falls back to findImageCandidateFromAst when HEAD fails', async () => {
    const node = { name: 'repo' };
    const mockAx = { head: jest.fn().mockRejectedValue(new Error('404')) };
    const downloader = makeMediaDownloader({
      downloadIfNeeded: jest.fn().mockResolvedValue('ast-image.png'),
    });
    const parseReadme = makeParseReadme({
      findImageCandidateFromAst: jest.fn().mockReturnValue('https://example.com/ast-image.png'),
    });
 
    const result = await processNodeMedia(node, '/media', () => mockAx, {
      parseReadme,
      mediaDownloader: downloader,
    });
 
    expect(result).toBe('ast-image.png');
  });
 
  test('falls back to inline markdown image when AST returns null', async () => {
    const node = { name: 'repo', object: { text: '# Title\n![alt](https://example.com/inline.png)' } };
    const mockAx = { head: jest.fn().mockRejectedValue(new Error('404')) };
    const downloader = makeMediaDownloader({
      downloadIfNeeded: jest.fn().mockResolvedValue('inline.png'),
    });
 
    const result = await processNodeMedia(node, '/media', () => mockAx, {
      parseReadme: makeParseReadme({ findImageCandidateFromAst: jest.fn().mockReturnValue(null) }),
      mediaDownloader: downloader,
    });
 
    expect(result).toBe('inline.png');
  });
 
  test('sanitizes candidate with space (title attribute)', async () => {
    const node = { name: 'repo', object: { text: '![alt](image.png "title")' } };
    const mockAx = { head: jest.fn().mockRejectedValue(new Error('404')) };
    const downloader = makeMediaDownloader({
      downloadIfNeeded: jest.fn().mockResolvedValue('image.png'),
    });
 
    const result = await processNodeMedia(node, '/media', () => mockAx, {
      parseReadme: makeParseReadme({ findImageCandidateFromAst: jest.fn().mockReturnValue(null) }),
      mediaDownloader: downloader,
    });
 
    expect(result).toBe('image.png');
    // downloadIfNeeded should have been called with sanitized path, no space
    const calledUrl = downloader.downloadIfNeeded.mock.calls[0][1];
    expect(calledUrl).not.toContain('"title"');
  });
 
  test('sanitizes candidate wrapped in angle brackets', async () => {
    const node = { name: 'repo' };
    const mockAx = { head: jest.fn().mockRejectedValue(new Error('404')) };
    const downloader = makeMediaDownloader({
      downloadIfNeeded: jest.fn().mockResolvedValue('image.png'),
    });
    const parseReadme = makeParseReadme({
      findImageCandidateFromAst: jest.fn().mockReturnValue('<image.png>'),
    });
 
    const result = await processNodeMedia(node, '/media', () => mockAx, {
      parseReadme,
      mediaDownloader: downloader,
    });
 
    expect(result).toBe('image.png');
  });
 
  test('expands relative path to both main and master absolute URLs', async () => {
    const node = { name: 'repo' };
    const mockAx = { head: jest.fn().mockRejectedValue(new Error('404')) };
    const downloader = makeMediaDownloader({
      downloadIfNeeded: jest.fn()
        .mockResolvedValueOnce(null)   // main → fail
        .mockResolvedValueOnce('img.png'), // master → success
    });
    const parseReadme = makeParseReadme({
      findImageCandidateFromAst: jest.fn().mockReturnValue('assets/img.png'),
    });
 
    const result = await processNodeMedia(node, '/media', () => mockAx, {
      parseReadme,
      mediaDownloader: downloader,
    });
 
    expect(result).toBe('img.png');
    expect(downloader.downloadIfNeeded).toHaveBeenCalledTimes(2);
    expect(downloader.downloadIfNeeded.mock.calls[0][1]).toContain('/main/');
    expect(downloader.downloadIfNeeded.mock.calls[1][1]).toContain('/master/');
  });
 
  test('rewrites README text when file is downloaded', async () => {
    const readmeText = '# Title\n![alt](https://example.com/img.png)';
    const node = { name: 'repo', object: { text: readmeText } };
    const mockAx = { head: jest.fn().mockRejectedValue(new Error('404')) };
    const downloader = makeMediaDownloader({
      downloadIfNeeded: jest.fn().mockResolvedValue('img.png'),
    });
 
    await processNodeMedia(node, '/media', () => mockAx, {
      parseReadme: makeParseReadme({ findImageCandidateFromAst: jest.fn().mockReturnValue(null) }),
      mediaDownloader: downloader,
    });
 
    expect(node.object.text).toContain('/projects_media/repo/img.png');
  });
 
  test('applies isBadgeLike to rewrite badge images in README', async () => {
    const readmeText = '# Title\n![badge](https://shields.io/badge.svg)\n![img](https://example.com/img.png)';
    const node = { name: 'repo', object: { text: readmeText } };
    const mockAx = { head: jest.fn().mockRejectedValue(new Error('404')) };
    const downloader = makeMediaDownloader({
      downloadIfNeeded: jest.fn().mockResolvedValue('img.png'),
    });
 
    await processNodeMedia(node, '/media', () => mockAx, {
      parseReadme: makeParseReadme({ findImageCandidateFromAst: jest.fn().mockReturnValue(null) }),
      mediaDownloader: downloader,
      isBadgeLike: (u) => /shields\.io/.test(u),
    });
 
    expect(node.object.text).toContain('/projects_media/repo/img.png');
  });
 
  test('returns null when all downloadIfNeeded calls return null', async () => {
    const node = { name: 'repo' };
    const mockAx = { head: jest.fn().mockRejectedValue(new Error('404')) };
    const parseReadme = makeParseReadme({
      findImageCandidateFromAst: jest.fn().mockReturnValue('assets/img.png'),
    });
    const downloader = makeMediaDownloader({
      downloadIfNeeded: jest.fn().mockResolvedValue(null),
    });
 
    const result = await processNodeMedia(node, '/media', () => mockAx, {
      parseReadme,
      mediaDownloader: downloader,
    });
 
    expect(result).toBeNull();
  });
});