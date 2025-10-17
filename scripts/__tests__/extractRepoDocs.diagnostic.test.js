const { extractRepoDocsDetailed } = require('../lib/docs');

describe('extractRepoDocsDetailed diagnostic', () => {
  test('sanitizes embedded AST/JSON fragments from descriptions', async () => {
    const fakeAstFragment = '{"type":"paragraph","children":[{"type":"text","value":".[Index for Backend Documentation]"}]}';
    const readme = `# Project\n\n## Architecture Overview\n\n- . [Index for Backend Documentation](./docs/backend/README.md) ${fakeAstFragment}\n\nSome other text.`;
    const out = await extractRepoDocsDetailed(readme, 'some-repo');
    expect(out).toBeTruthy();
    expect(out.architectureOverview).toBeTruthy();
    // The raw JSON-like fragment should be removed from the description
    expect(out.architectureOverview.description).not.toMatch(/\{"type"\s*:\s*"paragraph"/);
    // description should be a readable short text or null
    expect(typeof out.architectureOverview.description === 'string' || out.architectureOverview.description === null).toBeTruthy();
  }, 10000);
});
