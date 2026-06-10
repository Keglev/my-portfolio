/*
 * Tests for fetchProjects helpers
 * Covers: normalizeTitle, normalizeSummary, extractSectionWithRegex, isBadgeLike,
 * and null/empty/edge-case behaviours.
 */
const { normalizeTitle, normalizeSummary, extractSectionWithRegex, isBadgeLike } = require('../../../scripts/fetchProjects');

describe('fetchProjects helpers', () => {
  test('normalizeTitle strips markdown and emojis and truncates', () => {
    const input = "[Doc Title](http://example.com) :smile: `code` **bold** Some extra text that should be truncated if too long";
    const out = normalizeTitle(input, 40);
    expect(out).toBeTruthy();
    expect(out).not.toMatch(/\[|\]|\(|\)|:smile:|`|\*\*/);
    expect(out.length).toBeLessThanOrEqual(41); // allows the ellipsis
  });

  test('normalizeSummary removes code blocks and links and truncates', () => {
    const input = "This is a summary.\n\n```\ncode block\n```\nMore text [link](http://x.com) and emoji 😊";
    const out = normalizeSummary(input, 60);
    expect(out).toContain('This is a summary');
    expect(out).not.toContain('```');
    expect(out).not.toContain('http');
  });

  test('extractSectionWithRegex finds About section', () => {
    const md = "# Title\n\n## About\n\nThis is about the project.\n\n## Other\n\nx";
    const res = extractSectionWithRegex(md, [/\babout\b/i]);
    expect(res).toContain('This is about the project');
  });

  test('isBadgeLike detects badge URLs and svgs', () => {
    expect(isBadgeLike('https://img.shields.io/badge/test-green.svg')).toBe(true);
    expect(isBadgeLike('https://example.com/image.png')).toBe(false);
    expect(isBadgeLike('https://github.com/actions/workflows/ci.yml/badge.svg')).toBe(true);
  });

  // ── AST helper re-exports ────────────────────────────────────────────────

  test('exports all expected AST helper functions', () => {
    const mod = require('../../../scripts/fetchProjects');
    for (const name of ['extractRepoDocsDetailed', 'findImageCandidateFromAst', 'extractDocsFromAst', 'extractTechnologiesFromAst']) {
      expect(typeof mod[name]).toBe('function');
    }
  });

  // ── normalizeSummary edge cases ───────────────────────────────────────────

  test('normalizeSummary returns empty string for blank input', () => {
    expect(normalizeSummary('')).toBe('');
    expect(normalizeSummary('   ')).toBe('');
  });

  test('normalizeSummary strips emoji characters', () => {
    const out = normalizeSummary('Hello 😊 world', 60);
    expect(out).not.toContain('😊');
    expect(out).toContain('Hello');
  });

  // ── normalizeTitle edge cases ─────────────────────────────────────────────

  test('normalizeTitle returns null for null/undefined/empty input', () => {
    expect(normalizeTitle(null)).toBeNull();
    expect(normalizeTitle(undefined)).toBeNull();
    expect(normalizeTitle('')).toBeNull();
  });

  test('normalizeTitle strips backtick code spans', () => {
    const out = normalizeTitle('`const foo`');
    expect(out).not.toContain('`');
  });

  // ── extractSectionWithRegex edge cases ────────────────────────────────────

  test('extractSectionWithRegex returns null when no section matches', () => {
    const md = '# Title\n\n## Intro\n\nSome intro text.\n\n## Other\n\nOther text.';
    const result = extractSectionWithRegex(md, [/\bnonsense\b/i]);
    expect(result).toBeNull();
  });

  test('extractSectionWithRegex returns null for empty markdown', () => {
    expect(extractSectionWithRegex('', [/about/i])).toBeNull();
  });
});
