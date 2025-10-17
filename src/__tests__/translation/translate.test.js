const { translateToGermanDetailed } = require('../../../scripts/lib/translation/translate');

describe('translation translateToGermanDetailed', () => {
  test('returns no-key-or-text status when DeepL key missing', async () => {
    // Ensure env vars that may be present locally/CI are not interfering
    delete process.env.DEEPL_API_KEY; delete process.env.DEEPL_KEY; delete process.env.DEEPL_SECRET;
    const out = await translateToGermanDetailed('Hello world');
    // Implementation returns an object like { text: null, status: 'no-key-or-text' }
    expect(out).toBeTruthy();
    expect(out && out.status === 'no-key-or-text').toBeTruthy();
  });
});
