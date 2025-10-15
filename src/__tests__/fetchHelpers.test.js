const { normalizeTitle, normalizeSummary, extractSectionWithRegex, isBadgeLike } = require('../../scripts/fetchProjects');

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
});
