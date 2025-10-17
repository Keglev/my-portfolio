const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

describe('translation cache md5 key', () => {
  const MEDIA_TMP = path.join(__dirname, 'tmp_media_md5');
  beforeAll(()=>{
    process.env.TRANSLATE_MEDIA_ROOT = MEDIA_TMP;
    try { if (fs.existsSync(MEDIA_TMP)) fs.rmSync(MEDIA_TMP, { recursive: true, force: true }); } catch(e) {}
  });
  afterAll(()=>{
    try { if (fs.existsSync(MEDIA_TMP)) fs.rmSync(MEDIA_TMP, { recursive: true, force: true }); } catch(e) {}
    delete process.env.TRANSLATE_MEDIA_ROOT;
  });

  test('translateWithCache writes md5 keyed entry into meta.json', async () => {
    jest.resetModules();
    process.env.DEEPL_KEY = 'dummy';
    const tmod = require('../lib/translation');
    // stub network-heavy translate call
    tmod.translateToGermanDetailed = async (s) => ({ text: 'hallo-md5', status: 200 });
    const repo = 'md5repo';
    const text = 'unique test string for md5';
    const res = await tmod.translateWithCache(repo, text);
    expect(res && res.text).toBe('hallo-md5');
    // read meta and assert cache key exists and contains value
    const metaPath = path.join(MEDIA_TMP, repo, 'meta.json');
    expect(fs.existsSync(metaPath)).toBe(true);
    const meta = JSON.parse(fs.readFileSync(metaPath,'utf8'));
    expect(meta.translation && meta.translation.cache).toBeTruthy();
    const md5 = crypto.createHash('md5').update(String(text||'')).digest('hex');
    expect(meta.translation.cache[md5]).toBe('hallo-md5');
    delete process.env.DEEPL_KEY;
  }, 10000);
});
