const { findImageCandidateFromAst, extractTechnologiesFromAst, extractDocsFromAst, parseMarkdown } = require('../fetchProjects');

describe('more fetchProjects helpers', () => {
  test('findImageCandidateFromAst prefers project-image and raster images', () => {
    const md = '![badge](https://img.shields.io/badge/build-passing-brightgreen.svg)\n\n![screenshot](./assets/imgs/project-image.png)';
    const ast = parseMarkdown(md);
    const candidate = findImageCandidateFromAst(ast);
    expect(candidate).toMatch(/project-image\.png$/i);
  });

  test('extractTechnologiesFromAst extracts list items and comma separated', () => {
    const md = '## Tech Stack\n\n- Node.js\n- Express\n- PostgreSQL\n\nAlso: Redis, Docker, Kubernetes';
    const ast = parseMarkdown(md);
    const techs = extractTechnologiesFromAst(ast);
    expect(techs).toEqual(expect.arrayContaining(['Node.js','Express','PostgreSQL','Redis','Docker','Kubernetes']));
  });

  test('extractDocsFromAst finds Documentation link', () => {
    const md = '## Documentation\n\nPlease see [Docs](https://example.com/docs) for details.';
    const ast = parseMarkdown(md);
    const docs = extractDocsFromAst(ast, 'repo');
    expect(docs.legacy.docsLink).toBe('https://example.com/docs');
    expect(docs.legacy.docsTitle).toBe('Docs');
  });
});