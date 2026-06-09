// Verifies extractSummaryFromNode: description field priority, README section
// fallback, and the three-step extraction strategy (description → first para → null).
const { extractSummaryFromNode } = require('../../../../scripts/lib/summary/summaryExtractor');
const parseReadme = require('../../../../scripts/lib/parseReadme');

describe('summaryExtractor – extractSummaryFromNode', () => {
  test('exports extractSummaryFromNode as a function', () => {
    expect(typeof extractSummaryFromNode).toBe('function');
  });

  test('returns empty summary when node has no README text', () => {
    const node = { name: 'repo' };
    const result = extractSummaryFromNode(node, parseReadme);
    expect(result.summary).toBe('');
    expect(result.summarySource).toBeNull();
  });

  test('extracts summary from a matching heading section (summarySource = heading)', () => {
    const readme = '# My Project\n\n## Overview\n\nThis project does something really useful and interesting.\n\n## Installation\n\nRun npm install.';
    const node = { name: 'repo', object: { text: readme } };
    const result = extractSummaryFromNode(node, parseReadme);
    expect(result.summary).toContain('something really useful');
    expect(result.summarySource).toBe('heading');
  });

  test('uses first paragraph when no heading matches (summarySource = first-paragraph)', () => {
    const readme = 'This is a useful project that solves many problems.\n\n## Setup\n\nRun npm install.';
    const node = { name: 'repo', object: { text: readme } };
    const result = extractSummaryFromNode(node, parseReadme);
    expect(result.summary).toContain('useful project');
    expect(result.summarySource).toBe('first-paragraph');
  });

  test('falls through to first-paragraph when section text is too short (< 30 chars)', () => {
    const readme = '# My Project\n\n## Summary\n\nShort.\n\n## Details\n\nThis project does a lot of very useful things for developers.';
    const node = { name: 'repo', object: { text: readme } };
    const result = extractSummaryFromNode(node, parseReadme);
    // "Short." is less than 30 chars so it should fall through to first-paragraph
    expect(result.summarySource).toBe('first-paragraph');
  });

  test('uses pre-existing _ast on the node instead of re-parsing', () => {
    const ast = {
      type: 'root',
      children: [
        { type: 'heading', depth: 2, children: [{ type: 'text', value: 'About' }] },
        { type: 'paragraph', children: [{ type: 'text', value: 'This description comes from the pre-built AST and is long enough to pass the 30-char threshold.' }] },
      ],
    };
    const node = { name: 'repo', object: { text: '# ignored' }, _ast: ast };
    const parseReadmeSpy = Object.assign({}, parseReadme);
    const parseSpy = jest.spyOn(parseReadmeSpy, 'parseMarkdown');
    const result = extractSummaryFromNode(node, parseReadmeSpy);
    expect(parseSpy).not.toHaveBeenCalled();
    expect(result.summary).toContain('pre-built AST');
    expect(result.summarySource).toBe('heading');
  });

  test('truncates summary to 160 chars when first paragraph is very long', () => {
    const longLine = 'A'.repeat(300);
    const readme = longLine;
    const node = { name: 'repo', object: { text: readme } };
    const result = extractSummaryFromNode(node, parseReadme);
    expect(result.summary.length).toBeLessThanOrEqual(160);
  });

  test('uses raw-truncate path when readme contains only blank lines / whitespace', () => {
    // split(/\n\s*\n/).filter(Boolean) produces [] when all parts are empty after trim
    const readme = '  \n\n  \n\n  ';
    const node = { name: 'repo', object: { text: readme } };
    const result = extractSummaryFromNode(node, parseReadme);
    expect(result.summarySource).toBe('raw-truncate');
  });

  test('summaryRaw is capped at 800 chars', () => {
    const readme = 'B'.repeat(1000);
    const node = { name: 'repo', object: { text: readme } };
    const result = extractSummaryFromNode(node, parseReadme);
    expect(result.summaryRaw.length).toBeLessThanOrEqual(800);
  });

  test('swallows parseReadme errors and falls back to first-paragraph', () => {
    const readme = '# Overview\n\nSome text that is definitely longer than thirty characters here.\n\nSecond paragraph.';
    const node = { name: 'repo', object: { text: readme } };
    const brokenParseReadme = {
      parseMarkdown: () => { throw new Error('parse failed'); },
      findSectionText: () => { throw new Error('find failed'); },
      extractSectionWithRegex: () => { throw new Error('regex failed'); },
      normalizeSummary: (s) => s,
    };
    const result = extractSummaryFromNode(node, brokenParseReadme);
    // Should not throw; should fall back to raw first-paragraph text
    expect(result.summary).toBeTruthy();
    expect(typeof result.summary).toBe('string');
  });

  test('returns empty summary when node is null', () => {
    const result = extractSummaryFromNode(null, parseReadme);
    expect(result.summary).toBe('');
    expect(result.summarySource).toBeNull();
  });

  test('recognises "description" heading as a matching section', () => {
    const readme = '# Project\n\n## Description\n\nThis project provides a robust solution for handling complex tasks efficiently.\n\n## Usage\n\nSee docs.';
    const node = { name: 'repo', object: { text: readme } };
    const result = extractSummaryFromNode(node, parseReadme);
    expect(result.summarySource).toBe('heading');
    expect(result.summary).toContain('robust solution');
  });
});
