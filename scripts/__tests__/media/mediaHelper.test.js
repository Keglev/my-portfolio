const mediaHelper = require('../../lib/media');

// Mock mediaDownloader with deterministic behavior
const mockMediaDownloader = {
  ensureDir: jest.fn(),
  downloadIfNeeded: jest.fn(async (repo, url, opts) => {
    const safe = Buffer.from(url).toString('base64').slice(0,8);
    return `img-${repo}-${safe}.png`;
  }),
  md5: jest.fn(s => require('crypto').createHash('md5').update(s||'').digest('hex'))
};

const mockAxios = () => ({
  head: jest.fn(async (u, opts) => {
    if (String(u).includes('/src/assets/imgs/project-image.png')) return { status: 404, headers: { 'content-type': 'text/plain' } };
    return { status: 200, headers: { 'content-type': 'image/png' } };
  })
});

const parseReadme = require('../../lib/parseReadme');

describe('mediaHelper.processNodeMedia', () => {
  it('downloads explicit project-image and updates node', async () => {
    const node = { name: 'testrepo', object: { text: 'img here: ![x](images/pic.png)' } };
    const mediaRoot = '/tmp/media';
    const fn = await mediaHelper.processNodeMedia(node, mediaRoot, mockAxios, { mediaDownloader: mockMediaDownloader, parseReadme, isBadgeLike: () => false });
    expect(fn).toMatch(/img-testrepo-/);
    expect(node.primaryImage).toBeTruthy();
    expect(node._imageSelection).toBeTruthy();
    expect(node.object.text).toMatch(/projects_media/);
  });
});
