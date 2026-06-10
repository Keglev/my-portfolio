/*
 * Tests for parseReadme/helpers.js
 * Covers: flattenNodeText, extractTextFromListItem, extractLinkFromParagraphNode,
 * extractLinkFromListNode, extractSectionWithRegex, and findSectionText.
 */
const {
  flattenNodeText,
  extractTextFromListItem,
  extractLinkFromParagraphNode,
  extractLinkFromListNode,
  extractSectionWithRegex,
  findSectionText,
} = require('../../../../scripts/lib/parseReadme/helpers');

// ── flattenNodeText ──────────────────────────────────────────────────────────

describe('flattenNodeText', () => {
  test('returns empty string for null', () => {
    expect(flattenNodeText(null)).toBe('');
  });

  test('returns value for a text node', () => {
    expect(flattenNodeText({ type: 'text', value: 'hello' })).toBe('hello');
  });

  test('recursively concatenates children', () => {
    const node = {
      type: 'paragraph',
      children: [
        { type: 'text', value: 'Hello ' },
        { type: 'text', value: 'world' },
      ],
    };
    expect(flattenNodeText(node)).toBe('Hello world');
  });

  test('returns node.value fallback when no children and not text type', () => {
    expect(flattenNodeText({ type: 'unknown', value: 'fallback' })).toBe('fallback');
  });

  test('returns empty string for node with no value and no children', () => {
    expect(flattenNodeText({ type: 'unknown' })).toBe('');
  });
});

// ── extractTextFromListItem ──────────────────────────────────────────────────

describe('extractTextFromListItem', () => {
  test('returns empty string for null', () => {
    expect(extractTextFromListItem(null)).toBe('');
  });

  test('extracts text from a paragraph list item', () => {
    const li = {
      type: 'listItem',
      children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Item text' }] }],
    };
    expect(extractTextFromListItem(li)).toBe('Item text');
  });

  test('extracts text from nested children without paragraph', () => {
    const li = {
      type: 'listItem',
      children: [{ type: 'text', value: 'Direct text' }],
    };
    expect(extractTextFromListItem(li)).toContain('Direct text');
  });

  test('strips leading bullet characters from result', () => {
    const li = {
      type: 'listItem',
      children: [{ type: 'paragraph', children: [{ type: 'text', value: '- Item text' }] }],
    };
    const result = extractTextFromListItem(li);
    expect(result).not.toMatch(/^[-\s]+/);
  });
});

// ── extractLinkFromParagraphNode ─────────────────────────────────────────────

describe('extractLinkFromParagraphNode', () => {
  test('returns null when node has no children', () => {
    expect(extractLinkFromParagraphNode(null)).toBeNull();
    expect(extractLinkFromParagraphNode({})).toBeNull();
  });

  test('returns null when no link child exists', () => {
    const node = { children: [{ type: 'text', value: 'no link' }] };
    expect(extractLinkFromParagraphNode(node)).toBeNull();
  });

  test('returns link, title and description when link child found', () => {
    const node = {
      children: [
        { type: 'link', url: 'https://example.com', children: [{ type: 'text', value: 'Title' }] },
        { type: 'text', value: 'Description text' },
      ],
    };
    const result = extractLinkFromParagraphNode(node);
    expect(result.link).toBe('https://example.com');
    expect(result.title).toBe('Title');
    expect(result.description).toBe('Description text');
  });

  test('returns null title when link has no children', () => {
    const node = {
      children: [{ type: 'link', url: 'https://example.com', children: [] }],
    };
    const result = extractLinkFromParagraphNode(node);
    expect(result.title).toBeNull();
  });
});

// ── extractLinkFromListNode ──────────────────────────────────────────────────

describe('extractLinkFromListNode', () => {
  test('returns null for null input', () => {
    expect(extractLinkFromListNode(null)).toBeNull();
  });

  test('extracts link from nested AST link child', () => {
    const li = {
      type: 'listItem',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'link', url: 'https://example.com', children: [{ type: 'text', value: 'Link Label' }] },
          ],
        },
      ],
    };
    const result = extractLinkFromListNode(li);
    expect(result.link).toBe('https://example.com');
    expect(result.title).toBe('Link Label');
  });

  test('falls back to regex extraction from flat text when no AST link', () => {
    const li = {
      type: 'listItem',
      children: [
        { type: 'paragraph', children: [{ type: 'text', value: '[Docs](https://docs.example.com)' }] },
      ],
    };
    const result = extractLinkFromListNode(li);
    expect(result.link).toBe('https://docs.example.com');
    expect(result.title).toBe('Docs');
  });

  test('returns null when flat text has no markdown link', () => {
    const li = {
      type: 'listItem',
      children: [{ type: 'paragraph', children: [{ type: 'text', value: 'plain text only' }] }],
    };
    expect(extractLinkFromListNode(li)).toBeNull();
  });
});

// ── extractSectionWithRegex ──────────────────────────────────────────────────

describe('extractSectionWithRegex', () => {
  test('returns null for null/empty text', () => {
    expect(extractSectionWithRegex(null, [/overview/i])).toBeNull();
    expect(extractSectionWithRegex('', [/overview/i])).toBeNull();
  });

  test('returns section content after a matching heading', () => {
    const text = '# Title\n\n## Overview\n\nThis is the overview text.\nMore detail here.\n\n## Installation\n\nRun npm install.';
    const result = extractSectionWithRegex(text, [/overview/i]);
    expect(result).toContain('overview text');
    expect(result).not.toContain('npm install');
  });

  test('returns null when heading matches but section is empty', () => {
    const text = '## Overview\n\n## Next Section';
    const result = extractSectionWithRegex(text, [/overview/i]);
    expect(result).toBeNull();
  });

  test('returns null when no heading matches any regex', () => {
    const text = '## Installation\n\nRun npm install.\n\n## Usage\n\nSee docs.';
    const result = extractSectionWithRegex(text, [/overview/i, /summary/i]);
    expect(result).toBeNull();
  });

  test('stops collecting at the next heading marker', () => {
    const text = '## Summary\n\nLine one.\nLine two.\n\n## Other\n\nShould not appear.';
    const result = extractSectionWithRegex(text, [/summary/i]);
    expect(result).toContain('Line one');
    expect(result).not.toContain('Should not appear');
  });

  test('matches using the first matching regex in the array', () => {
    const text = '## About\n\nAbout section content that is long enough.';
    const result = extractSectionWithRegex(text, [/summary/i, /about/i]);
    expect(result).toContain('About section content');
  });
});

// ── findSectionText ──────────────────────────────────────────────────────────

describe('findSectionText', () => {
  test('returns null for null ast', () => {
    expect(findSectionText(null, [/overview/i])).toBeNull();
  });

  test('returns null when ast has no children', () => {
    expect(findSectionText({ type: 'root' }, [/overview/i])).toBeNull();
  });

  test('returns null when no heading matches', () => {
    const ast = {
      type: 'root',
      children: [
        { type: 'heading', depth: 2, children: [{ type: 'text', value: 'Installation' }] },
        { type: 'paragraph', children: [{ type: 'text', value: 'Run npm install.' }] },
      ],
    };
    expect(findSectionText(ast, [/overview/i])).toBeNull();
  });

  test('extracts text from paragraph nodes under matching heading', () => {
    const ast = {
      type: 'root',
      children: [
        { type: 'heading', depth: 2, children: [{ type: 'text', value: 'Overview' }] },
        { type: 'paragraph', children: [{ type: 'text', value: 'This is the overview.' }] },
      ],
    };
    const result = findSectionText(ast, [/overview/i]);
    expect(result).toContain('overview');
  });

  test('stops at next heading with equal depth', () => {
    const ast = {
      type: 'root',
      children: [
        { type: 'heading', depth: 2, children: [{ type: 'text', value: 'Overview' }] },
        { type: 'paragraph', children: [{ type: 'text', value: 'Section content.' }] },
        { type: 'heading', depth: 2, children: [{ type: 'text', value: 'Installation' }] },
        { type: 'paragraph', children: [{ type: 'text', value: 'Should not appear.' }] },
      ],
    };
    const result = findSectionText(ast, [/overview/i]);
    expect(result).toContain('Section content');
    expect(result).not.toContain('Should not appear');
  });

  test('does not stop at a deeper heading', () => {
    const ast = {
      type: 'root',
      children: [
        { type: 'heading', depth: 2, children: [{ type: 'text', value: 'Overview' }] },
        { type: 'heading', depth: 3, children: [{ type: 'text', value: 'Sub-section' }] },
        { type: 'paragraph', children: [{ type: 'text', value: 'Sub-section content.' }] },
      ],
    };
    const result = findSectionText(ast, [/overview/i]);
    expect(result).toContain('Sub-section content');
  });

  test('collects text from list nodes inside the section', () => {
    const ast = {
      type: 'root',
      children: [
        { type: 'heading', depth: 2, children: [{ type: 'text', value: 'Summary' }] },
        {
          type: 'list',
          children: [
            {
              type: 'listItem',
              children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Item one' }] }],
            },
            {
              type: 'listItem',
              children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Item two' }] }],
            },
          ],
        },
      ],
    };
    const result = findSectionText(ast, [/summary/i]);
    expect(result).toContain('Item one');
    expect(result).toContain('Item two');
  });

  test('collects text from html nodes inside the section', () => {
    const ast = {
      type: 'root',
      children: [
        { type: 'heading', depth: 2, children: [{ type: 'text', value: 'About' }] },
        { type: 'html', value: '<p>HTML content here</p>' },
      ],
    };
    const result = findSectionText(ast, [/about/i]);
    expect(result).toContain('HTML content here');
  });

  test('returns null when matching section contains only empty nodes', () => {
    const ast = {
      type: 'root',
      children: [
        { type: 'heading', depth: 2, children: [{ type: 'text', value: 'Overview' }] },
        { type: 'paragraph', children: [{ type: 'text', value: '' }] },
      ],
    };
    const result = findSectionText(ast, [/overview/i]);
    expect(result).toBeNull();
  });

  test('returns null on internal error (resilience)', () => {
    const badAst = {
      children: [
        {
          get type() { throw new Error('bad node'); },
        },
      ],
    };
    expect(findSectionText(badAst, [/overview/i])).toBeNull();
  });
});
