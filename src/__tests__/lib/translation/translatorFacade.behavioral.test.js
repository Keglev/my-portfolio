const translator = require('../../../../scripts/lib/translation/translatorFacade');

describe('translatorFacade behavioral', () => {
  test('translateNode uses translateWithCache to add translated fields', async () => {
    const node = { name: 'sample', summary: 'Hello world', repoDocs: { apiDocumentation: { title: 'API' } } };
    const fakeTranslate = jest.fn(async (repo, text) => ({ text: text + ' (de)' }));
    const shouldTranslateUI = (s) => !!s && s.length > 0;
    await translator.translateNode(node, fakeTranslate, shouldTranslateUI);
    expect(fakeTranslate).toHaveBeenCalled();
    // translations added as title_de or summary_de
    expect(node.summary_de || node.repoDocs.apiDocumentation.title_de).toBeDefined();
  });
});
