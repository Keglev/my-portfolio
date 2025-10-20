const { processNode } = require('../../../../scripts/lib/pipeline/nodeProcessor');

describe('nodeProcessor', () => {
  test('processNode is a function and returns node', async () => {
    const dummyNode = { name: 'sample-repo', __typename: 'Repository', object: { text: '# Title\n\nSome description.' } };
    const services = {
      getAxios: () => null,
      MEDIA_ROOT: 'public/projects_media',
      parseReadme: require('../../../../scripts/lib/parseReadme'),
      translateWithCache: async () => ({ text: null }),
      shouldTranslateUI: () => false,
      DEBUG_FETCH: false,
    };
    const processed = await processNode(dummyNode, services);
    expect(processed).toBeDefined();
    expect(processed.name).toBe('sample-repo');
    expect(typeof processed.summary).toBe('string');
  });
});
