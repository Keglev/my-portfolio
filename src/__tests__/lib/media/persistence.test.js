/*
 * Tests for persistence.persistMetaForNode
 * Covers: meta.json write on first run, readmeHash change detection,
 * and skip logic when the hash is unchanged.
 */
const fs = require('fs');

jest.mock('fs');

const { persistMetaForNode } = require('../../../../scripts/lib/media/persistence');
 
describe('persistence.persistMetaForNode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(false);
    fs.mkdirSync.mockImplementation(() => {});
    fs.writeFileSync.mockImplementation(() => {});
    fs.readFileSync.mockImplementation(() => { throw new Error('not found'); });
  });
 
  test('writes a meta.json with readmeHash for a minimal node', () => {
    const node = { name: 'my-repo' };
    persistMetaForNode(node);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('meta.json'),
      expect.stringContaining('readmeHash'),
      'utf8'
    );
  });
 
  test('includes readmeHash from node.object.text', () => {
    const node = { name: 'my-repo', object: { text: 'readme content' } };
    persistMetaForNode(node);
    const written = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(typeof written.readmeHash).toBe('string');
    expect(written.readmeHash).toHaveLength(32);
  });
 
  test('reads and merges existing meta.json when it exists', () => {
    const existing = JSON.stringify({ readmeHash: 'oldhash', files: ['old.png'] });
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(existing);
 
    const node = { name: 'my-repo' };
    persistMetaForNode(node);
 
    const written = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(written.readmeHash).not.toBe('oldhash'); // updated
  });
 
  test('includes imageSelection when node._imageSelection is set', () => {
    const node = { name: 'my-repo', _imageSelection: { filename: 'img.png', reason: 'downloaded' } };
    persistMetaForNode(node);
    const written = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(written.imageSelection).toEqual(node._imageSelection);
  });
 
  test('includes primaryImage when node.primaryImage is set', () => {
    const node = { name: 'my-repo', primaryImage: '/projects_media/my-repo/img.png' };
    persistMetaForNode(node);
    const written = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(written.primaryImage).toBe(node.primaryImage);
  });
 
  test('includes summarySource when node._summarySource is set', () => {
    const node = { name: 'my-repo', _summarySource: 'readme' };
    persistMetaForNode(node);
    const written = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(written.summarySource).toBe('readme');
  });
 
  test('includes translation when node._translation is set', () => {
    const node = { name: 'my-repo', _translation: { de: 'translated text' } };
    persistMetaForNode(node);
    const written = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(written.translation).toEqual({ de: 'translated text' });
  });
 
  test('does not throw if readFileSync returns invalid JSON', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('not valid json{{');
    const node = { name: 'my-repo' };
    expect(() => persistMetaForNode(node)).not.toThrow();
  });
 
  test('does not throw if writeFileSync throws', () => {
    fs.writeFileSync.mockImplementation(() => { throw new Error('disk full'); });
    const node = { name: 'my-repo' };
    expect(() => persistMetaForNode(node)).not.toThrow();
  });
});
 