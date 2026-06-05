const parseReadme = require('../../../scripts/lib/parseReadme');
const { buildFallbackAst } = require('../../../scripts/lib/parseReadme/parser');
const { extractTechnologiesFromAst } = require('../../../scripts/lib/parseReadme/techs');
const fs = require('fs');
const path = require('path');

describe('parseReadme helpers', () => {
  test('extracts technologies from fixture', async () => {
    const fixture = path.join(__dirname, '..', 'fixtures', 'techs-readme.md');
    const text = fs.readFileSync(fixture, 'utf8');
  const ast = parseReadme.parseMarkdown(text);
  expect(ast).toBeTruthy();
  const techs = parseReadme.extractTechnologiesFromAst(ast);
  expect(Array.isArray(techs)).toBeTruthy();
  });
});

// ── buildFallbackAst ──────────────────────────────────────────────────────────

describe('buildFallbackAst', () => {
  test('parses headings into heading nodes', () => {
    const ast = buildFallbackAst('# Title\n## Subtitle');
    const headings = ast.children.filter(c => c.type === 'heading');
    expect(headings).toHaveLength(2);
    expect(headings[0].depth).toBe(1);
    expect(headings[0].children[0].value).toBe('Title');
    expect(headings[1].depth).toBe(2);
  });

  test('parses markdown image syntax into image nodes', () => {
    const ast = buildFallbackAst('![Alt text](https://example.com/image.png)');
    const images = ast.children.filter(c => c.type === 'image');
    expect(images).toHaveLength(1);
    expect(images[0].url).toBe('https://example.com/image.png');
  });

  test('parses html img tag into html nodes', () => {
    const ast = buildFallbackAst('<img src="https://example.com/screenshot.png" alt="demo" />');
    const htmlNodes = ast.children.filter(c => c.type === 'html');
    expect(htmlNodes).toHaveLength(1);
    expect(htmlNodes[0].value).toContain('img');
  });

  test('parses list items into list nodes', () => {
    const ast = buildFallbackAst('- React\n- TypeScript\n- Jest');
    const lists = ast.children.filter(c => c.type === 'list');
    expect(lists).toHaveLength(1);
    expect(lists[0].children).toHaveLength(3);
  });

  test('parses paragraph with link into link nodes', () => {
    const ast = buildFallbackAst('Some text before [API docs](https://example.com/api.md) and after');
    const paragraphs = ast.children.filter(c => c.type === 'paragraph');
    expect(paragraphs.length).toBeGreaterThan(0);
    const linkNodes = paragraphs[0].children.filter(c => c.type === 'link');
    expect(linkNodes).toHaveLength(1);
    expect(linkNodes[0].url).toBe('https://example.com/api.md');
    // text node BEFORE the link should also be present
    const textNodes = paragraphs[0].children.filter(c => c.type === 'text');
    expect(textNodes.length).toBeGreaterThan(0);
  });

  test('flushes accumulated paragraph buffer on blank line', () => {
    const ast = buildFallbackAst('Line one\n\nLine two');
    const paragraphs = ast.children.filter(c => c.type === 'paragraph');
    expect(paragraphs).toHaveLength(2);
  });

  test('handles DEBUG_FETCH trace logging without throwing', () => {
    process.env.DEBUG_FETCH = '1';
    expect(() => buildFallbackAst('# Hello\n\nSome text')).not.toThrow();
    delete process.env.DEBUG_FETCH;
  });
});

// ── extractTechnologiesFromAst bold paths ─────────────────────────────────────

describe('extractTechnologiesFromAst', () => {
  test('returns [] for null/missing ast', () => {
    expect(extractTechnologiesFromAst(null)).toEqual([]);
    expect(extractTechnologiesFromAst({})).toEqual([]);
  });

  test('extracts bold tokens from list items (bold list path)', () => {
    const ast = {
      children: [
        {
          type: 'heading',
          depth: 2,
          children: [{ type: 'text', value: 'Technologies' }],
        },
        {
          type: 'list',
          children: [
            {
              type: 'listItem',
              children: [
                {
                  type: 'paragraph',
                  children: [{ type: 'text', value: '**React** and **TypeScript**' }],
                },
              ],
            },
          ],
        },
      ],
    };
    const result = extractTechnologiesFromAst(ast);
    expect(result).toContain('React');
    expect(result).toContain('TypeScript');
  });

  test('extracts bold tokens from paragraph nodes (bold paragraph path)', () => {
    const ast = {
      children: [
        {
          type: 'heading',
          depth: 2,
          children: [{ type: 'text', value: 'Tech Stack' }],
        },
        {
          type: 'paragraph',
          children: [{ type: 'text', value: '**Node.js** + **Express** for the backend' }],
        },
      ],
    };
    const result = extractTechnologiesFromAst(ast);
    expect(result).toContain('Node.js');
    expect(result).toContain('Express');
  });

  test('falls back to legacy plain-list extraction when no bold tokens found', () => {
    const ast = {
      children: [
        {
          type: 'heading',
          depth: 2,
          children: [{ type: 'text', value: 'Technologies' }],
        },
        {
          type: 'list',
          children: [
            {
              type: 'listItem',
              children: [
                {
                  type: 'paragraph',
                  children: [{ type: 'text', value: 'React' }],
                },
              ],
            },
            {
              type: 'listItem',
              children: [
                {
                  type: 'paragraph',
                  children: [{ type: 'text', value: 'Jest, Testing Library' }],
                },
              ],
            },
          ],
        },
      ],
    };
    const result = extractTechnologiesFromAst(ast);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toContain('React');
  });

  test('stops collecting at next heading of equal or higher depth', () => {
    const ast = {
      children: [
        {
          type: 'heading',
          depth: 2,
          children: [{ type: 'text', value: 'Technologies' }],
        },
        {
          type: 'list',
          children: [
            {
              type: 'listItem',
              children: [{ type: 'paragraph', children: [{ type: 'text', value: '**React**' }] }],
            },
          ],
        },
        {
          type: 'heading',
          depth: 2,
          children: [{ type: 'text', value: 'About' }],
        },
        {
          type: 'list',
          children: [
            {
              type: 'listItem',
              children: [{ type: 'paragraph', children: [{ type: 'text', value: '**ShouldNotAppear**' }] }],
            },
          ],
        },
      ],
    };
    const result = extractTechnologiesFromAst(ast);
    expect(result).toContain('React');
    expect(result).not.toContain('ShouldNotAppear');
  });
});
