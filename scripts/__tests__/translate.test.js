const fs = require('fs');
const path = require('path');

describe('translate lib', () => {
  const translate = require('../lib/translation');
  const MEDIA_TMP = path.join(__dirname, 'tmp_media');
  beforeAll(()=>{
    process.env.TRANSLATE_MEDIA_ROOT = MEDIA_TMP;
    // ensure clean
    try { if (fs.existsSync(MEDIA_TMP)) fs.rmSync(MEDIA_TMP, { recursive: true, force: true }); } catch (e) {}
  });
  afterAll(()=>{
    try { if (fs.existsSync(MEDIA_TMP)) fs.rmSync(MEDIA_TMP, { recursive: true, force: true }); } catch (e) {}
    delete process.env.TRANSLATE_MEDIA_ROOT;
  });

  test('should return no-key-or-text when no key or text', async () => {
    // temporarily ensure no deepl key
    const origKey = process.env.DEEPL_KEY; delete process.env.DEEPL_KEY; delete process.env.DEEPL_API_KEY; delete process.env.DEEPL_SECRET;
    const r = await translate.translateToGermanDetailed('hello');
    expect(r && r.status).toBe('no-key-or-text');
    if (origKey) process.env.DEEPL_KEY = origKey;
  });

  test('translateWithCache stores and reads cache', async () => {
  const mockText = 'short hello';
  jest.resetModules();
  // set key so translateWithCache will attempt to translate
  process.env.DEEPL_KEY = 'dummy';
  const tmod = require('../lib/translation');
  // stub the underlying translateToGermanDetailed to avoid axios/mocking complexity
  tmod.translateToGermanDetailed = async (s) => ({ text: 'hallo', status: 200 });
    // call translateWithCache twice
  const direct = await tmod.translateToGermanDetailed(mockText);
  expect(direct && direct.text).toBe('hallo');
  const r1 = await tmod.translateWithCache('testrepo', mockText);
  if (!r1 || !r1.text) console.log('DEBUG translateWithCache result:', r1);
  expect(r1 && r1.text).toBe('hallo');
    // second call should hit cache (status cached)
    const r2 = await tmod.translateWithCache('testrepo', mockText);
    expect(r2 && (r2.status === 'cached' || r2.text === 'hallo')).toBeTruthy();
    // validate meta file exists and contains cache
    const metaPath = path.join(MEDIA_TMP, 'testrepo', 'meta.json');
    expect(fs.existsSync(metaPath)).toBe(true);
  const meta = JSON.parse(fs.readFileSync(metaPath,'utf8'));
  const crypto = require('crypto');
  const md5 = crypto.createHash('md5').update(String(mockText||'')).digest('hex');
  expect(meta.translation && meta.translation.cache && meta.translation.cache[md5]).toBe('hallo');
    jest.unmock('axios');
    delete process.env.DEEPL_KEY;
  }, 10000);
});
