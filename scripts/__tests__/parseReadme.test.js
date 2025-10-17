const fs = require('fs');
const path = require('path');
const parseReadme = require('../lib/parseReadme');

describe('parseReadme helpers', () => {
  test('parseMarkdown and findSectionText - simple README', () => {
    const txt = fs.readFileSync(path.join(__dirname, 'fixtures', 'simple-readme.md'), 'utf8');
    const ast = parseReadme.parseMarkdown(txt);
    expect(ast).toBeTruthy();
    const sec = parseReadme.findSectionText(ast, [/\babout\b/i]);
    expect(sec).toMatch(/This project demonstrates a simple example/);
  });

  test('extractTechnologiesFromAst - techs README', () => {
    const txt = fs.readFileSync(path.join(__dirname, 'fixtures', 'techs-readme.md'), 'utf8');
    const ast = parseReadme.parseMarkdown(txt);
    const techs = parseReadme.extractTechnologiesFromAst(ast);
    expect(Array.isArray(techs)).toBe(true);
    expect(techs).toEqual(expect.arrayContaining(['React', 'TypeScript', 'Jest, Testing Library']));
  });

  test('findImageCandidateFromAst - images README', () => {
    const txt = fs.readFileSync(path.join(__dirname, 'fixtures', 'images-readme.md'), 'utf8');
    const ast = parseReadme.parseMarkdown(txt);
    const img = parseReadme.findImageCandidateFromAst(ast);
    // should prefer project-image.png (relative path)
    expect(img).toMatch(/project-image.png|hero.png/);
  });

  test('extractDocsFromAst - simple README returns docs link normalized', () => {
    const txt = fs.readFileSync(path.join(__dirname, 'fixtures', 'simple-readme.md'), 'utf8');
    const ast = parseReadme.parseMarkdown(txt);
    const docs = parseReadme.extractDocsFromAst(ast, 'dummy-repo');
    expect(docs).toBeTruthy();
    expect(docs.legacy).toBeTruthy();
    expect(docs.legacy.docsLink).toMatch(/raw.githubusercontent.com|docs\/index.html/);
  });

  test('normalizeTitle & normalizeSummary', () => {
    const t = 'Hello [World](https://example.com) :smile: `code` **bold**';
    const n = parseReadme.normalizeTitle(t, 50);
    expect(n).toMatch(/Hello World/);
    const s = parseReadme.normalizeSummary('Some long `code` block with a link http://example.com and <b>HTML</b>');
    expect(s).toMatch(/Some long code block/);
  });
});
