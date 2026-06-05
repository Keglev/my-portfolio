const { normalizeTitle, normalizeSummary } = require('../../../../scripts/lib/parseReadme/normalize');

describe('normalizeTitle', () => {
  test('returns null for falsy input', () => {
    expect(normalizeTitle(null)).toBeNull();
    expect(normalizeTitle(undefined)).toBeNull();
    expect(normalizeTitle('')).toBeNull();
  });

  test('strips markdown link syntax and keeps the label text', () => {
    expect(normalizeTitle('[API docs](https://example.com/api.md)')).toBe('API docs');
  });

  test('strips bare HTTP URLs from the string', () => {
    expect(normalizeTitle('See https://example.com for details')).toBe('See for details');
  });

  test('strips emoji shortcodes', () => {
    const result = normalizeTitle(':smile: Hello :wave:');
    expect(result).not.toContain(':smile:');
    expect(result).not.toContain(':wave:');
    expect(result).toContain('Hello');
  });

  test('strips markdown formatting characters', () => {
    const result = normalizeTitle('**Bold** and *italic* and `code`');
    expect(result).not.toMatch(/[*_`]/);
    expect(result).toContain('Bold');
    expect(result).toContain('italic');
    expect(result).toContain('code');
  });

  test('truncates to maxLen and appends ellipsis when too long', () => {
    const long = 'A'.repeat(150);
    const result = normalizeTitle(long, 120);
    expect(result.endsWith('…')).toBe(true);
    expect(result.slice(0, -1).length).toBe(120);
  });

  test('returns null when result is empty after all stripping', () => {
    expect(normalizeTitle('**`*_>#~`**')).toBeNull();
  });

  test('preserves normal title text as-is', () => {
    expect(normalizeTitle('My Portfolio Project')).toBe('My Portfolio Project');
  });
});

describe('normalizeSummary', () => {
  test('returns empty string for falsy input', () => {
    expect(normalizeSummary(null)).toBe('');
    expect(normalizeSummary(undefined)).toBe('');
    expect(normalizeSummary('')).toBe('');
  });

  test('strips fenced code blocks', () => {
    const s = 'Before\n```\nconst x = 1;\n```\nAfter';
    const result = normalizeSummary(s);
    expect(result).toContain('Before');
    expect(result).toContain('After');
    expect(result).not.toContain('const x');
  });

  test('strips inline code delimiters but keeps the content', () => {
    const result = normalizeSummary('Use `npm install` to get started');
    expect(result).toContain('npm install');
    expect(result).not.toContain('`');
  });

  test('strips markdown links but keeps the label', () => {
    const result = normalizeSummary('[GitHub](https://github.com)');
    expect(result).toContain('GitHub');
    expect(result).not.toContain('https://github.com');
  });

  test('strips HTML tags', () => {
    const result = normalizeSummary('Hello <strong>world</strong>!');
    expect(result).toContain('Hello');
    expect(result).toContain('world');
    expect(result).not.toContain('<strong>');
  });

  test('strips bare HTTP URLs', () => {
    const result = normalizeSummary('See https://example.com for details');
    expect(result).not.toContain('https://example.com');
    expect(result).toContain('See');
  });

  test('truncates to maxLen and appends ellipsis when too long', () => {
    const long = 'B'.repeat(450);
    const result = normalizeSummary(long, 400);
    expect(result.endsWith('…')).toBe(true);
  });

  test('preserves normal text as-is', () => {
    const text = 'A well-written summary of the project.';
    expect(normalizeSummary(text)).toBe(text);
  });
});
