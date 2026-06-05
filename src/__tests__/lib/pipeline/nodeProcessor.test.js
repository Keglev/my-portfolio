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

const readmeHandler = require('../../../../scripts/lib/readme/readmeHandler');
const docsModule = require('../../../../scripts/lib/docs');
const { processNode } = require('../../../../scripts/lib/pipeline/nodeProcessor');
const parseReadme = require('../../../../scripts/lib/parseReadme');

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
    jest.clearAllMocks();
    delete process.env.DEBUG_FETCH;
    // Default: sub-modules are silent no-ops
    readmeHandler.processNodeReadme.mockResolvedValue(undefined);
    docsModule.extractRepoDocsDetailed.mockResolvedValue(null);
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
    consoleLogSpy.mockRestore();
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

  // ── raw.githubusercontent → tryGithubIo: docsLink ────────────────────────
  // readmeHandler is mocked so it will NOT overwrite docsLink.

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
  // extractRepoDocsDetailed is mocked to return null, so node.repoDocs is preserved.

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
    const node = { name: 'repo-that-does-not-exist', object: { text: '# Hi' } };
    const result = await processNode(node, makeServices());
    expect(result.mediaDownloaded).toBe(false);
  });

  // ── outer catch ───────────────────────────────────────────────────────────

  test('does not propagate unexpected top-level errors', async () => {
    // Passing a broken parseReadme triggers errors deep in the pipeline
    const node = { name: 'repo', object: { text: '# Hi\n\nContent.' } };
    const result = await processNode(node, makeServices({ parseReadme: null }));
    expect(result).toBeDefined();
  });
});
