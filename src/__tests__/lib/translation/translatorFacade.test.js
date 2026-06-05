// Mock the orchestrator so we can control whether it throws per-test
jest.mock('../../../../scripts/lib/translation/translationOrchestrator');

const orchestrator = require('../../../../scripts/lib/translation/translationOrchestrator');
const { translateNode } = require('../../../../scripts/lib/translation/translatorFacade');

const noopTranslate = jest.fn(async () => ({ text: null }));
const alwaysTranslate = (s) => !!s;

describe('translatorFacade – translateNode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.DEBUG_FETCH;
    // Default: orchestrator succeeds and does nothing
    orchestrator.translateTitlesBatch.mockResolvedValue(undefined);
  });

  afterEach(() => {
    delete process.env.DEBUG_FETCH;
  });

  test('exports translateNode as a function', () => {
    expect(typeof translateNode).toBe('function');
  });

  test('returns the same node reference it receives', async () => {
    const node = { name: 'repo', summary: 'Hello world' };
    const result = await translateNode(node, noopTranslate, alwaysTranslate);
    expect(result).toBe(node);
  });

  test('returns null when node is null (guard branch)', async () => {
    const result = await translateNode(null, noopTranslate, alwaysTranslate);
    expect(result).toBeNull();
  });

  test('calls orchestrator.translateTitlesBatch with the node and services', async () => {
    const node = { name: 'repo', summary: 'Hello world' };
    await translateNode(node, noopTranslate, alwaysTranslate);
    expect(orchestrator.translateTitlesBatch).toHaveBeenCalledWith(
      node,
      noopTranslate,
      alwaysTranslate
    );
  });

  test('swallows orchestrator errors and returns node intact (DEBUG_FETCH off)', async () => {
    orchestrator.translateTitlesBatch.mockRejectedValue(new Error('orchestrator boom'));
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const node = { name: 'repo' };
    const result = await translateNode(node, noopTranslate, alwaysTranslate);
    expect(result).toBe(node);
    expect(consoleLogSpy).not.toHaveBeenCalled();
    consoleLogSpy.mockRestore();
  });

  test('logs error in catch block when DEBUG_FETCH=1', async () => {
    process.env.DEBUG_FETCH = '1';
    orchestrator.translateTitlesBatch.mockRejectedValue(new Error('translation kaboom'));
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const node = { name: 'repo' };
    const result = await translateNode(node, noopTranslate, alwaysTranslate);
    expect(result).toBe(node);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('translateNode error'),
      expect.stringContaining('translation kaboom')
    );
    consoleLogSpy.mockRestore();
  });

  test('logs error when DEBUG_FETCH=true (string "true")', async () => {
    process.env.DEBUG_FETCH = 'true';
    orchestrator.translateTitlesBatch.mockRejectedValue(new Error('true-flag kaboom'));
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const node = { name: 'repo' };
    await translateNode(node, noopTranslate, alwaysTranslate);
    expect(consoleLogSpy).toHaveBeenCalled();
    consoleLogSpy.mockRestore();
  });
});
