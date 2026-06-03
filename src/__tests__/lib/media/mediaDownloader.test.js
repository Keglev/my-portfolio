const fs = require('fs');
 
jest.mock('fs');
jest.mock('axios');
 
const axios = require('axios');
const { ensureDir, md5, downloadIfNeeded } = require('../../../../scripts/lib/media/mediaDownloader');
 
describe('mediaDownloader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(false);
    fs.mkdirSync.mockImplementation(() => {});
    fs.writeFileSync.mockImplementation(() => {});
  });
 
  describe('ensureDir', () => {
    test('creates directory if it does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      ensureDir('/some/dir');
      expect(fs.mkdirSync).toHaveBeenCalledWith('/some/dir', { recursive: true });
    });
 
    test('does not create directory if it already exists', () => {
      fs.existsSync.mockReturnValue(true);
      ensureDir('/some/dir');
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });
 
  describe('md5', () => {
    test('returns a hex string for normal input', () => {
      const result = md5('hello');
      expect(typeof result).toBe('string');
      expect(result).toHaveLength(32);
    });
 
    test('handles empty string', () => {
      const result = md5('');
      expect(typeof result).toBe('string');
    });
 
    test('handles null input', () => {
      const result = md5(null);
      expect(typeof result).toBe('string');
    });
  });
 
  describe('downloadIfNeeded', () => {
    test('returns null if url is falsy', async () => {
      const result = await downloadIfNeeded('repo', null);
      expect(result).toBeNull();
    });
 
    test('returns filename immediately if file already exists', async () => {
      fs.existsSync.mockReturnValue(true);
      const result = await downloadIfNeeded('repo', 'https://example.com/image.png');
      expect(result).toMatch(/image.*\.png$/);
      expect(axios.get).not.toHaveBeenCalled();
    });
 
    test('returns null if axios is not available (simulated by clearing mock)', async () => {
      fs.existsSync.mockReturnValue(false);
      // Simulate axios failing to load by making the mock throw on get
      axios.get = undefined;
      const result = await downloadIfNeeded('repo', 'https://example.com/image.png');
      expect(result).toBeNull();
    });
 
    test('downloads and writes file for valid image response', async () => {
      fs.existsSync.mockReturnValue(false);
      const fakeBuffer = Buffer.alloc(100);
      axios.get = jest.fn().mockResolvedValue({
        data: fakeBuffer,
        headers: { 'content-type': 'image/png' },
      });
 
      const result = await downloadIfNeeded('repo', 'https://example.com/image.png');
      expect(result).toMatch(/image.*\.png$/);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
 
    test('returns null if response has no data', async () => {
      fs.existsSync.mockReturnValue(false);
      axios.get = jest.fn().mockResolvedValue({ data: null, headers: {} });
 
      const result = await downloadIfNeeded('repo', 'https://example.com/image.png');
      expect(result).toBeNull();
    });
 
    test('returns null if file exceeds 2MB', async () => {
      fs.existsSync.mockReturnValue(false);
      const bigBuffer = Buffer.alloc(3 * 1024 * 1024);
      axios.get = jest.fn().mockResolvedValue({
        data: bigBuffer,
        headers: { 'content-type': 'image/png' },
      });
 
      const result = await downloadIfNeeded('repo', 'https://example.com/image.png');
      expect(result).toBeNull();
    });
 
    test('returns null if content-type is not image and ext is not image', async () => {
      fs.existsSync.mockReturnValue(false);
      const fakeBuffer = Buffer.alloc(100);
      axios.get = jest.fn().mockResolvedValue({
        data: fakeBuffer,
        headers: { 'content-type': 'text/html' },
      });
 
      const result = await downloadIfNeeded('repo', 'https://example.com/file.html');
      expect(result).toBeNull();
    });
 
    test('defaults ext to .png when url has no extension', async () => {
      fs.existsSync.mockReturnValue(false);
      const fakeBuffer = Buffer.alloc(100);
      axios.get = jest.fn().mockResolvedValue({
        data: fakeBuffer,
        headers: { 'content-type': 'image/png' },
      });
 
      const result = await downloadIfNeeded('repo', 'https://example.com/image-no-ext');
      expect(result).toMatch(/\.png$/);
    });
 
    test('returns null if axios.get throws', async () => {
      fs.existsSync.mockReturnValue(false);
      axios.get = jest.fn().mockRejectedValue(new Error('network error'));
 
      const result = await downloadIfNeeded('repo', 'https://example.com/image.png');
      expect(result).toBeNull();
    });
 
    test('strips query string from url for filename derivation', async () => {
      fs.existsSync.mockReturnValue(false);
      const fakeBuffer = Buffer.alloc(100);
      axios.get = jest.fn().mockResolvedValue({
        data: fakeBuffer,
        headers: { 'content-type': 'image/jpeg' },
      });
 
      const result = await downloadIfNeeded('repo', 'https://example.com/photo.jpg?v=123');
      expect(result).toMatch(/\.jpg$/);
    });
  });
});