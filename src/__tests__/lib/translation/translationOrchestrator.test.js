/*
 * Tests for translationOrchestrator.translateTitlesBatch
 * Covers: parallel title translation, null-text skipping, per-item error handling,
 * and DEBUG_FETCH logging.
 */
const { translateTitlesBatch } = require('../../../../scripts/lib/translation/translationOrchestrator');

const makeTranslate = (suffix = ' (de)') =>
  jest.fn(async (_repo, text) => ({ text: text + suffix }));

const alwaysTranslate = (s) => !!s && s.length > 0;
const neverTranslate = () => false;

describe('translationOrchestrator – translateTitlesBatch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.DEBUG_FETCH;
  });

  afterEach(() => {
    delete process.env.DEBUG_FETCH;
  });

  test('returns immediately when node is null', async () => {
    const translate = makeTranslate();
    await translateTitlesBatch(null, translate, alwaysTranslate);
    expect(translate).not.toHaveBeenCalled();
  });

  test('returns immediately when translateWithCache is missing', async () => {
    const node = { name: 'repo', summary: 'Hello' };
    await translateTitlesBatch(node, undefined, alwaysTranslate);
    expect(node.summary_de).toBeUndefined();
  });

  test('returns immediately when shouldTranslateUI is missing', async () => {
    const translate = makeTranslate();
    const node = { name: 'repo', summary: 'Hello' };
    await translateTitlesBatch(node, translate, undefined);
    expect(translate).not.toHaveBeenCalled();
  });

  test('sets summary_de when summary is a non-empty string', async () => {
    const translate = makeTranslate();
    const node = { name: 'repo', summary: 'Hello world' };
    await translateTitlesBatch(node, translate, alwaysTranslate);
    expect(node.summary_de).toBe('Hello world (de)');
  });

  test('sets docsTitle_de when docsTitle is a non-empty string', async () => {
    const translate = makeTranslate();
    const node = { name: 'repo', docsTitle: 'API Reference' };
    await translateTitlesBatch(node, translate, alwaysTranslate);
    expect(node.docsTitle_de).toBe('API Reference (de)');
  });

  test('sets repoDocs.apiDocumentation.title_de', async () => {
    const translate = makeTranslate();
    const node = {
      name: 'repo',
      repoDocs: { apiDocumentation: { title: 'API Docs' } },
    };
    await translateTitlesBatch(node, translate, alwaysTranslate);
    expect(node.repoDocs.apiDocumentation.title_de).toBe('API Docs (de)');
  });

  test('sets repoDocs.architectureOverview.title_de', async () => {
    const translate = makeTranslate();
    const node = {
      name: 'repo',
      repoDocs: { architectureOverview: { title: 'Architecture' } },
    };
    await translateTitlesBatch(node, translate, alwaysTranslate);
    expect(node.repoDocs.architectureOverview.title_de).toBe('Architecture (de)');
  });

  test('sets repoDocs.testing.testingDocs.title_de', async () => {
    const translate = makeTranslate();
    const node = {
      name: 'repo',
      repoDocs: { testing: { testingDocs: { title: 'Testing Guide' } } },
    };
    await translateTitlesBatch(node, translate, alwaysTranslate);
    expect(node.repoDocs.testing.testingDocs.title_de).toBe('Testing Guide (de)');
  });

  test('translates all fields in one Promise.all call', async () => {
    const translate = makeTranslate();
    const node = {
      name: 'repo',
      summary: 'Summary text',
      docsTitle: 'Docs',
      repoDocs: {
        apiDocumentation: { title: 'API' },
        architectureOverview: { title: 'Arch' },
        testing: { testingDocs: { title: 'Tests' } },
      },
    };
    await translateTitlesBatch(node, translate, alwaysTranslate);
    expect(translate).toHaveBeenCalledTimes(5);
    expect(node.summary_de).toBe('Summary text (de)');
    expect(node.docsTitle_de).toBe('Docs (de)');
    expect(node.repoDocs.apiDocumentation.title_de).toBe('API (de)');
    expect(node.repoDocs.architectureOverview.title_de).toBe('Arch (de)');
    expect(node.repoDocs.testing.testingDocs.title_de).toBe('Tests (de)');
  });

  test('skips fields when shouldTranslateUI returns false', async () => {
    const translate = makeTranslate();
    const node = { name: 'repo', summary: 'Hello' };
    await translateTitlesBatch(node, translate, neverTranslate);
    expect(translate).not.toHaveBeenCalled();
    expect(node.summary_de).toBeUndefined();
  });

  test('does not set _de field when translateWithCache returns null text', async () => {
    const translate = jest.fn(async () => ({ text: null }));
    const node = { name: 'repo', summary: 'Hello world' };
    await translateTitlesBatch(node, translate, alwaysTranslate);
    expect(node.summary_de).toBeUndefined();
  });

  test('swallows errors and does not throw (DEBUG_FETCH off)', async () => {
    const badTranslate = jest.fn(() => { throw new Error('network error'); });
    const node = { name: 'repo', summary: 'Hello' };
    await expect(
      translateTitlesBatch(node, badTranslate, alwaysTranslate)
    ).resolves.toBeUndefined();
  });

  test('logs error in catch block when DEBUG_FETCH=1', async () => {
    process.env.DEBUG_FETCH = '1';
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const badTranslate = jest.fn(() => { throw new Error('kaboom'); });
    const node = { name: 'repo', summary: 'Hello' };
    await translateTitlesBatch(node, badTranslate, alwaysTranslate);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('translateTitlesBatch error'),
      expect.stringContaining('kaboom')
    );
    consoleLogSpy.mockRestore();
  });

  test('node has empty summary string — skipped (shouldTranslateUI receives empty string)', async () => {
    const translate = makeTranslate();
    const node = { name: 'repo', summary: '' };
    await translateTitlesBatch(node, translate, alwaysTranslate);
    expect(translate).not.toHaveBeenCalled();
  });

  test('node.summary is not a string — treated as empty, skipped', async () => {
    const translate = makeTranslate();
    const node = { name: 'repo', summary: 42 };
    await translateTitlesBatch(node, translate, alwaysTranslate);
    // summaryForTranslation resolves to '' because 42 is not a string
    expect(translate).not.toHaveBeenCalled();
  });
});
