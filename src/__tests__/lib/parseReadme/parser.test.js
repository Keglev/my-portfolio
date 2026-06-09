// Verifies buildFallbackAst: synchronous heading/paragraph/list node parsing
// from plain markdown text without requiring the remark dependency at runtime.
const { buildFallbackAst } = require('../../../../scripts/lib/parseReadme/parser');

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
