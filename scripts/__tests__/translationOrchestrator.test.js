const orchestrator = require('../lib/translation').orchestrator || require('../lib/translation/translationOrchestrator');

describe('translationOrchestrator.translateTitlesBatch', () => {
  it('maps results back to node fields correctly', async () => {
    const node = {
      name: 'r',
      summary: 'Short summary',
      docsTitle: 'Docs',
      repoDocs: {
        apiDocumentation: { title: 'API Docs' },
        architectureOverview: { title: 'Architecture' },
        testing: { testingDocs: { title: 'Testing Docs' } }
      }
    };
    const translateWithCache = jest.fn(async (repo, text) => ({ text: `DE-${text}` }));
    const shouldTranslateUI = jest.fn(s => true);
    await orchestrator.translateTitlesBatch(node, translateWithCache, shouldTranslateUI);
    expect(node.summary_de).toBe('DE-Short summary');
    expect(node.docsTitle_de).toBe('DE-Docs');
    expect(node.repoDocs.apiDocumentation.title_de).toBe('DE-API Docs');
    expect(node.repoDocs.architectureOverview.title_de).toBe('DE-Architecture');
    expect(node.repoDocs.testing.testingDocs.title_de).toBe('DE-Testing Docs');
  });
});
