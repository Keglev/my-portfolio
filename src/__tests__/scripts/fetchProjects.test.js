/*
 * Tests for fetchProjects.js re-exports
 * Covers: parseReadme helper re-exports and silent omission of extractRepoDocsDetailed
 * when lib/docs is unavailable.
 *
 * Note: mock factories use plain functions (not jest.fn(impl)) because CRA's Jest
 * silently drops implementations inside jest.mock() factories.
 */

jest.mock('../../../scripts/lib/fetchPinned', () => ({
  fetchPinned: () => Promise.resolve(),
}));

jest.mock('../../../scripts/lib/parseReadme', () => ({
  parseMarkdown: () => ({ type: 'root', children: [] }),
  extractSectionWithRegex: () => null,
  normalizeTitle: t => String(t || '').trim(),
  normalizeSummary: t => String(t || '').trim(),
  findImageCandidateFromAst: () => null,
  isBadgeLike: () => false,
  extractTechnologiesFromAst: () => [],
  extractDocsFromAst: () => null,
}));

jest.mock('../../../scripts/lib/docs', () => ({
  extractRepoDocsDetailed: () => Promise.resolve({}),
}));

// ── happy-path: all helpers available ────────────────────────────────────────

describe('fetchProjects re-exports (lib/docs available)', () => {
  const mod = require('../../../scripts/fetchProjects');

  test('exports parseMarkdown and it delegates to parseReadme', () => {
    expect(typeof mod.parseMarkdown).toBe('function');
    expect(mod.parseMarkdown('# Hello')).toEqual({ type: 'root', children: [] });
  });

  test('exports extractSectionWithRegex', () => {
    expect(typeof mod.extractSectionWithRegex).toBe('function');
    expect(mod.extractSectionWithRegex('text', [])).toBeNull();
  });

  test('exports normalizeTitle', () => {
    expect(typeof mod.normalizeTitle).toBe('function');
    expect(mod.normalizeTitle('  My Title  ')).toBe('My Title');
  });

  test('exports normalizeSummary', () => {
    expect(typeof mod.normalizeSummary).toBe('function');
    expect(mod.normalizeSummary('A summary.')).toBe('A summary.');
  });

  test('exports findImageCandidateFromAst', () => {
    expect(typeof mod.findImageCandidateFromAst).toBe('function');
    expect(mod.findImageCandidateFromAst({ children: [] })).toBeNull();
  });

  test('exports isBadgeLike', () => {
    expect(typeof mod.isBadgeLike).toBe('function');
    expect(mod.isBadgeLike('plain text')).toBe(false);
  });

  test('exports extractTechnologiesFromAst', () => {
    expect(typeof mod.extractTechnologiesFromAst).toBe('function');
    expect(mod.extractTechnologiesFromAst({ children: [] })).toEqual([]);
  });

  test('exports extractDocsFromAst', () => {
    expect(typeof mod.extractDocsFromAst).toBe('function');
    expect(mod.extractDocsFromAst({ children: [] })).toBeNull();
  });

  test('exports extractRepoDocsDetailed when lib/docs is available', () => {
    expect(typeof mod.extractRepoDocsDetailed).toBe('function');
  });
});

// ── error path: lib/docs is unavailable ──────────────────────────────────────
// Tests the try/catch at the bottom of fetchProjects.js where requiring
// lib/docs is wrapped in a silent catch so the module can still be imported
// in environments without the optional dependency.

describe('fetchProjects re-exports (lib/docs unavailable)', () => {
  let modFresh;

  beforeAll(() => {
    jest.resetModules();
    // Override the docs mock with a factory that throws, simulating an
    // environment where the optional lib/docs module is absent.
    jest.doMock('../../../scripts/lib/docs', () => {
      throw new Error('Cannot find module lib/docs');
    });
    jest.doMock('../../../scripts/lib/fetchPinned', () => ({
      fetchPinned: () => Promise.resolve(),
    }));
    jest.doMock('../../../scripts/lib/parseReadme', () => ({
      parseMarkdown: () => ({ type: 'root', children: [] }),
      extractSectionWithRegex: () => null,
      normalizeTitle: t => String(t || '').trim(),
      normalizeSummary: t => String(t || '').trim(),
      findImageCandidateFromAst: () => null,
      isBadgeLike: () => false,
      extractTechnologiesFromAst: () => [],
      extractDocsFromAst: () => null,
    }));
    modFresh = require('../../../scripts/fetchProjects');
  });

  afterAll(() => {
    jest.resetModules();
  });

  test('omits extractRepoDocsDetailed silently when lib/docs throws', () => {
    expect(modFresh.extractRepoDocsDetailed).toBeUndefined();
  });

  test('still exports all parseReadme helpers when lib/docs is unavailable', () => {
    expect(typeof modFresh.parseMarkdown).toBe('function');
    expect(typeof modFresh.normalizeTitle).toBe('function');
    expect(typeof modFresh.extractTechnologiesFromAst).toBe('function');
  });
});
