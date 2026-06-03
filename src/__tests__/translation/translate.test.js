jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}));
jest.mock('axios', () => ({
  post: jest.fn(),
  default: { post: jest.fn() },
}));
jest.mock('../../../scripts/lib/translation/translationOrchestrator', () => ({}));

const crypto = require('crypto');

// Load module and mocks once — resetModules would invalidate the axiosPost reference
const translate = require('../../../scripts/lib/translation/translate');
const axiosPost = require('axios').default.post; // getAxios() uses _a.default when present
const fsMock = require('fs');

function md5(s) {
  return crypto.createHash('md5').update(String(s || '')).digest('hex');
}

describe('translate', () => {
  beforeEach(() => {
    delete process.env.DEEPL_API_KEY;
    delete process.env.DEEPL_KEY;
    delete process.env.DEEPL_SECRET;
    jest.resetAllMocks();              // clears calls + implementations on jest.fn()s
    fsMock.existsSync.mockReturnValue(false); // safe default: no meta file
  });

  afterEach(() => {
    jest.restoreAllMocks();            // restores any jest.spyOn stubs
  });

  // ─── translateToGermanDetailed ────────────────────────────────────────────

  describe('translateToGermanDetailed', () => {
    test('returns no-key-or-text when no DeepL key is set', async () => {
      const result = await translate.translateToGermanDetailed('Hello');
      expect(result).toEqual({ text: null, status: 'no-key-or-text' });
    });

    test('returns no-key-or-text when text is empty', async () => {
      process.env.DEEPL_API_KEY = 'test-key';
      const result = await translate.translateToGermanDetailed('');
      expect(result).toEqual({ text: null, status: 'no-key-or-text' });
    });

    test('returns no-key-or-text when text is null', async () => {
      process.env.DEEPL_API_KEY = 'test-key';
      const result = await translate.translateToGermanDetailed(null);
      expect(result).toEqual({ text: null, status: 'no-key-or-text' });
    });

    test('returns translated text on successful DeepL response', async () => {
      process.env.DEEPL_API_KEY = 'test-key';
      axiosPost.mockResolvedValue({
        status: 200,
        data: { translations: [{ text: 'Hallo Welt' }] },
      });

      const result = await translate.translateToGermanDetailed('Hello World');

      expect(result.text).toBe('Hallo Welt');
      expect(result.status).toBe(200);
    });

    test('returns null text when translations array is empty', async () => {
      process.env.DEEPL_API_KEY = 'test-key';
      axiosPost.mockResolvedValue({ status: 200, data: { translations: [] } });

      const result = await translate.translateToGermanDetailed('Hello');

      expect(result.text).toBeNull();
      expect(result.status).toBe(200);
    });

    test('returns null text when response has no translations key', async () => {
      process.env.DEEPL_API_KEY = 'test-key';
      axiosPost.mockResolvedValue({ status: 200, data: {} });

      const result = await translate.translateToGermanDetailed('Hello');

      expect(result.text).toBeNull();
    });

    test('returns error status when axios throws', async () => {
      process.env.DEEPL_API_KEY = 'test-key';
      axiosPost.mockRejectedValue(new Error('network timeout'));

      const result = await translate.translateToGermanDetailed('Hello');

      expect(result.text).toBeNull();
      expect(result.status).toBe('error');
      expect(result.error).toBe('network timeout');
    });

    test('posts to the correct DeepL URL with correct headers', async () => {
      process.env.DEEPL_API_KEY = 'test-key';
      axiosPost.mockResolvedValue({
        status: 200,
        data: { translations: [{ text: 'Hallo' }] },
      });

      await translate.translateToGermanDetailed('Hello');

      expect(axiosPost).toHaveBeenCalledWith(
        'https://api-free.deepl.com/v2/translate',
        expect.any(String),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 10000,
        })
      );
    });

    test('encodes auth_key, text, and target_lang DE in the request body', async () => {
      process.env.DEEPL_API_KEY = 'my-secret-key';
      axiosPost.mockResolvedValue({
        status: 200,
        data: { translations: [{ text: 'Hallo' }] },
      });

      await translate.translateToGermanDetailed('Hello');

      const body = axiosPost.mock.calls[0][1];
      expect(body).toContain('auth_key=my-secret-key');
      expect(body).toContain('text=Hello');
      expect(body).toContain('target_lang=DE');
    });

    test('picks up DEEPL_KEY env var as fallback', async () => {
      process.env.DEEPL_KEY = 'fallback-key';
      axiosPost.mockResolvedValue({
        status: 200,
        data: { translations: [{ text: 'Hallo' }] },
      });

      const result = await translate.translateToGermanDetailed('Hello');

      expect(result.text).toBe('Hallo');
    });

    test('includes raw response data in result', async () => {
      process.env.DEEPL_API_KEY = 'test-key';
      const rawData = { translations: [{ text: 'Hallo', detected_source_language: 'EN' }] };
      axiosPost.mockResolvedValue({ status: 200, data: rawData });

      const result = await translate.translateToGermanDetailed('Hello');

      expect(result.raw).toEqual(rawData);
    });

    test('returns no-axios when axios cannot be loaded', async () => {
      // Must run after a test that warmed getAxios() cache on the top-level module,
      // so resetModules here only affects the fresh module loaded below.
      process.env.DEEPL_API_KEY = 'test-key';
      jest.resetModules();
      jest.doMock('axios', () => { throw new Error('not found'); });
      const { translateToGermanDetailed } = require('../../../scripts/lib/translation/translate');

      const result = await translateToGermanDetailed('Hello');

      expect(result).toEqual({ text: null, status: 'no-axios' });
      // No cleanup needed: top-level translate.js has getAxios() already cached,
      // so it never re-calls require('axios') in subsequent tests.
    });
  });

  // ─── shouldTranslateUI ────────────────────────────────────────────────────

  describe('shouldTranslateUI', () => {
    // JS short-circuit: `null && ...` → null (falsy but not false)
    test('returns falsy for null', () => {
      expect(translate.shouldTranslateUI(null)).toBeFalsy();
    });

    test('returns falsy for undefined', () => {
      expect(translate.shouldTranslateUI(undefined)).toBeFalsy();
    });

    test('returns false for a number', () => {
      expect(translate.shouldTranslateUI(42)).toBe(false);
    });

    test('returns falsy for empty string', () => {
      expect(translate.shouldTranslateUI('')).toBeFalsy();
    });

    test('returns false for whitespace-only string', () => {
      expect(translate.shouldTranslateUI('   ')).toBe(false);
    });

    test('returns true for a normal short string', () => {
      expect(translate.shouldTranslateUI('Hello World')).toBe(true);
    });

    test('returns true for a string exactly at the default 300-char limit', () => {
      expect(translate.shouldTranslateUI('a'.repeat(300))).toBe(true);
    });

    test('returns false for a string exceeding the default 300-char limit', () => {
      expect(translate.shouldTranslateUI('a'.repeat(301))).toBe(false);
    });

    test('respects a custom maxLen', () => {
      expect(translate.shouldTranslateUI('Hello', 3)).toBe(false);
      expect(translate.shouldTranslateUI('Hi', 3)).toBe(true);
    });
  });

  // ─── translateWithCache ───────────────────────────────────────────────────

  describe('translateWithCache', () => {
    test('returns no-text when text is falsy', async () => {
      const result = await translate.translateWithCache('my-repo', '');
      expect(result).toEqual({ text: null, status: 'no-text' });
    });

    test('returns no-text when text is null', async () => {
      const result = await translate.translateWithCache('my-repo', null);
      expect(result).toEqual({ text: null, status: 'no-text' });
    });

    test('calls translateToGermanDetailed on cache miss', async () => {
      jest.spyOn(translate, 'translateToGermanDetailed').mockResolvedValue({ text: 'Hallo', status: 200 });

      await translate.translateWithCache('my-repo', 'Hello');

      expect(translate.translateToGermanDetailed).toHaveBeenCalledWith('Hello');
    });

    test('returns translation result from translateToGermanDetailed on cache miss', async () => {
      jest.spyOn(translate, 'translateToGermanDetailed').mockResolvedValue({ text: 'Hallo', status: 200 });

      const result = await translate.translateWithCache('my-repo', 'Hello');

      expect(result.text).toBe('Hallo');
      expect(result.status).toBe(200);
    });

    test('writes translated text to meta cache when translation succeeds', async () => {
      jest.spyOn(translate, 'translateToGermanDetailed').mockResolvedValue({ text: 'Hallo', status: 200 });

      await translate.translateWithCache('my-repo', 'Hello');

      expect(fsMock.writeFileSync).toHaveBeenCalled();
      const written = JSON.parse(fsMock.writeFileSync.mock.calls[0][1]);
      const key = md5('Hello');
      expect(written.translation.cache[key]).toBe('Hallo');
    });

    test('does not write cache when translation returns no text', async () => {
      jest.spyOn(translate, 'translateToGermanDetailed').mockResolvedValue({ text: null, status: 'error' });

      await translate.translateWithCache('my-repo', 'Hello');

      expect(fsMock.writeFileSync).not.toHaveBeenCalled();
    });

    test('returns cached string value without calling translateToGermanDetailed', async () => {
      const text = 'Hello';
      const key = md5(text);
      fsMock.existsSync.mockReturnValue(true);
      fsMock.readFileSync.mockReturnValue(
        JSON.stringify({ translation: { cache: { [key]: 'Hallo (cached)' } } })
      );
      jest.spyOn(translate, 'translateToGermanDetailed');

      const result = await translate.translateWithCache('my-repo', text);

      expect(result).toEqual({ text: 'Hallo (cached)', status: 'cached' });
      expect(translate.translateToGermanDetailed).not.toHaveBeenCalled();
    });

    test('returns cached object value without calling translateToGermanDetailed', async () => {
      const text = 'Hello';
      const key = md5(text);
      fsMock.existsSync.mockReturnValue(true);
      fsMock.readFileSync.mockReturnValue(
        JSON.stringify({ translation: { cache: { [key]: { text: 'Hallo (obj)' } } } })
      );
      jest.spyOn(translate, 'translateToGermanDetailed');

      const result = await translate.translateWithCache('my-repo', text);

      expect(result).toEqual({ text: 'Hallo (obj)', status: 'cached' });
      expect(translate.translateToGermanDetailed).not.toHaveBeenCalled();
    });

    test('handles corrupt meta.json gracefully and still translates', async () => {
      fsMock.existsSync.mockReturnValue(true);
      fsMock.readFileSync.mockReturnValue('NOT VALID JSON{{{');
      jest.spyOn(translate, 'translateToGermanDetailed').mockResolvedValue({ text: 'Hallo', status: 200 });

      const result = await translate.translateWithCache('my-repo', 'Hello');

      expect(result.text).toBe('Hallo');
    });

    test('creates media dir via mkdirSync when it does not exist', async () => {
      // existsSync: false for meta file (beforeEach default), false for dir
      jest.spyOn(translate, 'translateToGermanDetailed').mockResolvedValue({ text: 'Hallo', status: 200 });

      await translate.translateWithCache('my-repo', 'Hello');

      expect(fsMock.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    });

    test('skips mkdirSync when media dir already exists', async () => {
      // First existsSync: meta file (false), second: dir (true)
      fsMock.existsSync
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);
      jest.spyOn(translate, 'translateToGermanDetailed').mockResolvedValue({ text: 'Hallo', status: 200 });

      await translate.translateWithCache('my-repo', 'Hello');

      expect(fsMock.mkdirSync).not.toHaveBeenCalled();
    });

    test('returns error status when translateToGermanDetailed throws unexpectedly', async () => {
      jest.spyOn(translate, 'translateToGermanDetailed').mockRejectedValue(new Error('boom'));

      const result = await translate.translateWithCache('my-repo', 'Hello');

      expect(result.text).toBeNull();
      expect(result.status).toBe('error');
      expect(result.error).toBe('boom');
    });
  });
});
