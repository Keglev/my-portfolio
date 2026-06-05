jest.mock('fs', () => ({
  existsSync: jest.fn(() => false),
  readdirSync: jest.fn(() => []),
}));

// Mock sub-modules that would otherwise overwrite node properties we want to test
jest.mock('../../../../scripts/lib/readme/readmeHandler');
jest.mock('../../../../scripts/lib/docs', () => ({ extractRepoDocsDetailed: jest.fn() }));
jest.mock('../../../../scripts/lib/docs/docsHeuristics', () => ({
  backfillDocsFromText: jest.fn(),
  backfillFromAstHeading: jest.fn(),
  postProcessDocsLinkCandidates: jest.fn(),
}));
jest.mock('../../../../scripts/lib/media/persistence', () => ({
  persistMetaForNode: jest.fn(),
}));
jest.mock('../../../../scripts/lib/normalize/normalize', () => ({
  normalizeRepoDocsLinks: jest.fn(),
}));

const fs = require('fs');
const readmeHandler = require('../../../../scripts/lib/readme/readmeHandler');
const docsModule = require('../../../../scripts/lib/docs');
const docsHeuristics = require('../../../../scripts/lib/docs/docsHeuristics');
const mediaPersistence = require('../../../../scripts/lib/media/persistence');
const normalizeModule = require('../../../../scripts/lib/normalize/normalize');
const { processNode } = require('../../../../scripts/lib/pipeline/nodeProcessor');
const parseReadme = require('../../../../scripts/lib/parseReadme');

// Real modules (not mocked) — used for spying in specific tests
const summaryExtractor = require('../../../../scripts/lib/summary/summaryExtractor');
const translatorFacade = require('../../../../scripts/lib/translation/translatorFacade');
const githubIoPreferer = require('../../../../scripts/lib/normalize/githubIoPreferer');

function makeServices(overrides = {}) {
  return {
    getAxios: () => null,
    MEDIA_ROOT: '/tmp/media',
    parseReadme,
    translateWithCache: async () => ({ text: null }),
    shouldTranslateUI: () => false,
    DEBUG_FETCH: false,
    ...overrides,
  };
}

describe('nodeProcessor – processNode', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    delete process.env.DEBUG_FETCH;
    // Restore default behaviours for the key mocked sub-modules
    readmeHandler.processNodeReadme.mockResolvedValue(undefined);
    docsModule.extractRepoDocsDetailed.mockResolvedValue(null);
    fs.existsSync.mockReturnValue(false);
    fs.readdirSync.mockReturnValue([]);
  });

  afterEach(() => {
    delete process.env.DEBUG_FETCH;
    jest.restoreAllMocks();
  });

  // ── basic contract ────────────────────────────────────────────────────────

  test('returns a defined node with correct name', async () => {
    const node = { name: 'sample-repo', object: { text: '# Title\n\nSome description.' } };
    const result = await processNode(node, makeServices());
    expect(result).toBeDefined();
    expect(result.name).toBe('sample-repo');
  });

  test('returns the same node reference', async () => {
    const node = { name: 'repo', object: { text: '# Hi\n\nContent.' } };
    const result = await processNode(node, makeServices());
    expect(result).toBe(node);
  });

  test('does not throw when node has no object property', async () => {
    const node = { name: 'no-readme' };
    const result = await processNode(node, makeServices());
    expect(result).toBeDefined();
    expect(result.name).toBe('no-readme');
  });

  test('calls readmeHandler.processNodeReadme', async () => {
    const node = { name: 'repo', object: { text: '# Hi\n\nContent.' } };
    await processNode(node, makeServices());
    expect(readmeHandler.processNodeReadme).toHaveBeenCalled();
  });

  // ── extractRepoDocsDetailed ───────────────────────────────────────────────

  test('assigns node.repoDocs when extractRepoDocsDetailed returns a non-null value', async () => {
    docsModule.extractRepoDocsDetailed.mockResolvedValue({
      apiDocumentation: { title: 'API Ref', link: 'https://example.com/api' },
    });
    const node = { name: 'repo', object: { text: '# Hi' } };
    const result = await processNode(node, makeServices());
    expect(result.repoDocs).toBeDefined();
    expect(result.repoDocs.apiDocumentation.title).toBe('API Ref');
  });

  test('does not assign node.repoDocs when extractRepoDocsDetailed returns null', async () => {
    docsModule.extractRepoDocsDetailed.mockResolvedValue(null);
    const node = { name: 'repo', object: { text: '# Hi' } };
    await processNode(node, makeServices());
    expect(node.repoDocs).toBeUndefined();
  });

  // ── DEBUG_FETCH via service flag ──────────────────────────────────────────

  test('logs and swallows readmeHandler error when DEBUG_FETCH=true', async () => {
    readmeHandler.processNodeReadme.mockRejectedValue(new Error('readme handler boom'));
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const node = { name: 'repo', object: { text: '# Hi\n\nContent.' } };
    const result = await processNode(node, makeServices({ DEBUG_FETCH: true }));
    expect(result).toBeDefined();
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('readmeHandler failed'),
      expect.any(String),
      expect.any(String)
    );
  });

  test('logs and swallows extractRepoDocsDetailed error when DEBUG_FETCH=true', async () => {
    docsModule.extractRepoDocsDetailed.mockRejectedValue(new Error('docs boom'));
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const node = { name: 'repo', object: { text: '# Hi' } };
    await processNode(node, makeServices({ DEBUG_FETCH: true }));
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('extractRepoDocsDetailed failed'),
      expect.any(String),
      expect.any(String)
    );
  });

  test('logs and swallows docsHeuristics.postProcessDocsLinkCandidates error when DEBUG_FETCH=true', async () => {
    docsHeuristics.postProcessDocsLinkCandidates.mockImplementation(() => { throw new Error('heuristics boom'); });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const node = { name: 'repo', object: { text: '# Hi' } };
    await processNode(node, makeServices({ DEBUG_FETCH: true }));
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('postProcessDocsLinkCandidates failed'),
      expect.any(String),
      expect.any(String)
    );
  });

  test('logs and swallows summaryExtractor error when DEBUG_FETCH=true', async () => {
    jest.spyOn(summaryExtractor, 'extractSummaryFromNode').mockImplementation(() => { throw new Error('summary boom'); });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const node = { name: 'repo', object: { text: '# Hi' } };
    await processNode(node, makeServices({ DEBUG_FETCH: true }));
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('summary extraction failed'),
      expect.any(String),
      expect.any(String)
    );
  });

  test('records _translation.error and logs when translateNode throws with DEBUG_FETCH=true', async () => {
    jest.spyOn(translatorFacade, 'translateNode').mockRejectedValue(new Error('translate boom'));
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const node = { name: 'repo', object: { text: '# Hi' } };
    await processNode(node, makeServices({ DEBUG_FETCH: true }));
    expect(node._translation.error).toBe('translate boom');
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('translation error'),
      expect.any(String)
    );
  });

  test('logs and swallows persistMetaForNode error when DEBUG_FETCH=true', async () => {
    mediaPersistence.persistMetaForNode.mockImplementation(() => { throw new Error('persist boom'); });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const node = { name: 'repo', object: { text: '# Hi' } };
    await processNode(node, makeServices({ DEBUG_FETCH: true }));
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('persistMetaForNode failed'),
      expect.any(String),
      expect.any(String)
    );
  });

  test('logs and swallows normalizeRepoDocsLinks error when DEBUG_FETCH=true', async () => {
    normalizeModule.normalizeRepoDocsLinks.mockImplementation(() => { throw new Error('normalize boom'); });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const node = { name: 'repo', object: { text: '# Hi' } };
    await processNode(node, makeServices({ DEBUG_FETCH: true }));
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('normalizeRepoDocsLinks failed'),
      expect.any(String),
      expect.any(String)
    );
  });

  test('logs when github.io prefer throws with DEBUG_FETCH=true', async () => {
    jest.spyOn(githubIoPreferer, 'tryGithubIo').mockRejectedValue(new Error('probe boom'));
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const rawUrl = 'https://raw.githubusercontent.com/keglev/repo/main/docs/index.html';
    const node = { name: 'repo', object: { text: '# Hi' }, docsLink: rawUrl };
    await processNode(node, makeServices({ DEBUG_FETCH: true }));
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('github.io prefer failed'),
      expect.any(String),
      expect.any(String)
    );
  });

  test('logs translation timing when DEBUG_FETCH=true and translation succeeds', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const node = { name: 'repo', object: { text: '# Hi' } };
    await processNode(node, makeServices({ DEBUG_FETCH: true }));
    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/translation took \d+ms for repo/));
  });

  // ── DEBUG_FETCH via process.env ───────────────────────────────────────────

  test('picks up DEBUG_FETCH from process.env when not in services', async () => {
    process.env.DEBUG_FETCH = '1';
    const node = { name: 'repo', object: { text: '# Hi\n\nContent.' } };
    const services = makeServices();
    delete services.DEBUG_FETCH;
    const result = await processNode(node, services);
    expect(result).toBeDefined();
  });

  // ── summary extraction ────────────────────────────────────────────────────

  test('sets node.summary from README heading', async () => {
    const readme = '# Project\n\n## Overview\n\nThis project does something quite useful indeed.\n\n## Other\n\nStuff.';
    const node = { name: 'repo', object: { text: readme } };
    const result = await processNode(node, makeServices());
    expect(typeof result.summary).toBe('string');
    expect(result.summary.length).toBeGreaterThan(0);
  });

  test('sets node.summary to empty string when README has no content', async () => {
    const node = { name: 'repo', object: { text: '' } };
    const result = await processNode(node, makeServices());
    expect(typeof result.summary).toBe('string');
  });

  // ── translation wiring ────────────────────────────────────────────────────

  test('populates _translation object', async () => {
    const node = { name: 'repo', object: { text: '# Hi\n\nContent.' } };
    const result = await processNode(node, makeServices({
      translateWithCache: async () => ({ text: 'Hallo' }),
      shouldTranslateUI: (s) => !!s,
    }));
    expect(result._translation).toBeDefined();
  });

  test('records _translation.error when translateNode throws', async () => {
    jest.spyOn(translatorFacade, 'translateNode').mockRejectedValue(new Error('translate fail'));
    const node = { name: 'repo', object: { text: '# Hi' } };
    const result = await processNode(node, makeServices());
    expect(result._translation.error).toBe('translate fail');
  });

  test('initializes _translation.summary and _translation.docsTitle to null stubs', async () => {
    const node = { name: 'repo', object: { text: '# Hi' } };
    const result = await processNode(node, makeServices());
    expect(result._translation.summary).toEqual({ text: null, status: null });
    expect(result._translation.docsTitle).toEqual({ text: null, status: null });
  });

  // ── raw.githubusercontent → tryGithubIo: docsLink ────────────────────────

  test('leaves docsLink unchanged when github.io probe returns 404', async () => {
    const rawUrl = 'https://raw.githubusercontent.com/keglev/repo/main/docs/guide.html';
    const node = { name: 'repo', object: { text: '# Hi' }, docsLink: rawUrl };
    const mockAxios = { head: jest.fn(async () => ({ status: 404, headers: {} })) };
    const result = await processNode(node, makeServices({ getAxios: () => mockAxios }));
    expect(result.docsLink).toBe(rawUrl);
  });

  test('replaces docsLink with github.io URL when probe returns 200 HTML', async () => {
    const rawUrl = 'https://raw.githubusercontent.com/keglev/repo/main/docs/guide.html';
    const node = { name: 'repo', object: { text: '# Hi' }, docsLink: rawUrl };
    const mockAxios = {
      head: jest.fn(async () => ({ status: 200, headers: { 'content-type': 'text/html' } })),
    };
    const result = await processNode(node, makeServices({ getAxios: () => mockAxios }));
    expect(result.docsLink).toMatch(/keglev\.github\.io\/repo/);
  });

  // ── raw.githubusercontent → tryGithubIo: repoDocs sub-paths ──────────────

  test('replaces repoDocs.apiDocumentation.link when it is a raw.githubusercontent URL', async () => {
    const rawUrl = 'https://raw.githubusercontent.com/keglev/repo/main/docs/api.html';
    const node = {
      name: 'repo',
      object: { text: '# Hi' },
      repoDocs: { apiDocumentation: { link: rawUrl, title: 'API' } },
    };
    const mockAxios = {
      head: jest.fn(async () => ({ status: 200, headers: { 'content-type': 'text/html' } })),
    };
    const result = await processNode(node, makeServices({ getAxios: () => mockAxios }));
    expect(result.repoDocs.apiDocumentation.link).toMatch(/keglev\.github\.io\/repo/);
  });

  test('replaces repoDocs.architectureOverview.link when it is a raw.githubusercontent URL', async () => {
    const rawUrl = 'https://raw.githubusercontent.com/keglev/repo/main/docs/arch.html';
    const node = {
      name: 'repo',
      object: { text: '# Hi' },
      repoDocs: { architectureOverview: { link: rawUrl, title: 'Arch' } },
    };
    const mockAxios = {
      head: jest.fn(async () => ({ status: 200, headers: { 'content-type': 'text/html' } })),
    };
    const result = await processNode(node, makeServices({ getAxios: () => mockAxios }));
    expect(result.repoDocs.architectureOverview.link).toMatch(/keglev\.github\.io\/repo/);
  });

  test('replaces repoDocs.testing.testingDocs.link when it is a raw.githubusercontent URL', async () => {
    const rawUrl = 'https://raw.githubusercontent.com/keglev/repo/main/docs/testing.html';
    const node = {
      name: 'repo',
      object: { text: '# Hi' },
      repoDocs: { testing: { testingDocs: { link: rawUrl, title: 'Tests' } } },
    };
    const mockAxios = {
      head: jest.fn(async () => ({ status: 200, headers: { 'content-type': 'text/html' } })),
    };
    const result = await processNode(node, makeServices({ getAxios: () => mockAxios }));
    expect(result.repoDocs.testing.testingDocs.link).toMatch(/keglev\.github\.io\/repo/);
  });

  // ── mediaDownloaded flag ──────────────────────────────────────────────────

  test('sets mediaDownloaded=false when media directory does not exist', async () => {
    fs.existsSync.mockReturnValue(false);
    const node = { name: 'repo', object: { text: '# Hi' } };
    const result = await processNode(node, makeServices());
    expect(result.mediaDownloaded).toBe(false);
  });

  test('sets mediaDownloaded=true when media dir has files besides meta.json', async () => {
    fs.existsSync.mockReturnValue(true);
    fs.readdirSync.mockReturnValue(['screenshot.png', 'meta.json']);
    const node = { name: 'repo', object: { text: '# Hi' } };
    const result = await processNode(node, makeServices());
    expect(result.mediaDownloaded).toBe(true);
  });

  test('sets mediaDownloaded=false when media dir exists but only has meta.json', async () => {
    fs.existsSync.mockReturnValue(true);
    fs.readdirSync.mockReturnValue(['meta.json']);
    const node = { name: 'repo', object: { text: '# Hi' } };
    const result = await processNode(node, makeServices());
    expect(result.mediaDownloaded).toBe(false);
  });

  test('sets mediaDownloaded=false when readdirSync throws', async () => {
    fs.existsSync.mockReturnValue(true);
    fs.readdirSync.mockImplementation(() => { throw new Error('EPERM'); });
    const node = { name: 'repo', object: { text: '# Hi' } };
    const result = await processNode(node, makeServices());
    expect(result.mediaDownloaded).toBe(false);
  });

  // ── outer catch ───────────────────────────────────────────────────────────

  test('does not propagate unexpected top-level errors', async () => {
    const node = { name: 'repo', object: { text: '# Hi\n\nContent.' } };
    const result = await processNode(node, makeServices({ parseReadme: null }));
    expect(result).toBeDefined();
  });
});
