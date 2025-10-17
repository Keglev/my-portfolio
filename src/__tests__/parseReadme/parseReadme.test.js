const parseReadme = require('../../../scripts/lib/parseReadme');
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
