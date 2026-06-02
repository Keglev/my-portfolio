const { extractRepoDocsDetailed, shouldTranslateUI } = require('../../../../scripts/lib/docs/extractReadmeDocs');

describe('extractReadmeDocs AST paths', () => {
  let originalGithubToken;

  beforeEach(() => {
    originalGithubToken = process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_TOKEN;
    delete process.env.GH_PROJECTS_TOKEN;
  });

  afterEach(() => {
    process.env.GITHUB_TOKEN = originalGithubToken;
  });

  it('extracts docs from real markdown ASTs and translates descriptions and titles', async () => {
    const translateWithCache = jest.fn(async (_repoName, text) => ({ text: `de:${text}` }));
    const readmeText = [
      '# Architecture Overview',
      'Intro text [Index](https://raw.githubusercontent.com/keglev/repo-a/main/docs/arch.html) {"type":"paragraph"}',
      '# API',
      'API text [Complete API](https://github.com/keglev/repo-a/blob/main/docs/api.md)',
      '# Testing',
      '- [Test Coverage Frontend](https://example.com/coverage-frontend.html)',
      '- [Test Coverage Backend](https://example.com/coverage-backend.html)',
      '# Production URL',
      'Production text [Production URL](https://raw.githubusercontent.com/keglev/repo-a/main/docs/index.html)',
    ].join('\n');

    const result = await extractRepoDocsDetailed(readmeText, 'repo-a', translateWithCache);

    expect(result.architectureOverview).toMatchObject({
      title: 'Index',
      link: 'https://keglev.github.io/repo-a/docs/arch.html',
      description: 'Intro text',
      description_de: 'de:Intro text',
      title_de: 'de:Index',
    });

    expect(result.apiDocumentation).toMatchObject({
      title: 'Complete API',
      link: 'https://github.com/keglev/repo-a/blob/main/docs/api.md',
      description: 'API text',
      description_de: 'de:API text',
      title_de: 'de:Complete API',
    });

    expect(result.testing.coverage).toHaveLength(2);
    expect(result.testing.coverage[0]).toMatchObject({
      title: 'Test Coverage Frontend',
      link: 'https://example.com/coverage-frontend.html',
    });
    expect(result.testing.coverage[1]).toMatchObject({
      title: 'Test Coverage Backend',
      link: 'https://example.com/coverage-backend.html',
    });

    expect(result.productionUrl).toMatchObject({
      title: 'Production URL',
      link: 'https://raw.githubusercontent.com/keglev/repo-a/main/docs/index.html',
      description: 'Production text',
    });

    expect(translateWithCache).toHaveBeenCalled();
    expect(shouldTranslateUI('short title')).toBe(true);
    expect(shouldTranslateUI('')).toBe('');
  });

  it('uses raw github URLs when a token is present', async () => {
    process.env.GITHUB_TOKEN = 'token';

    const result = await extractRepoDocsDetailed(
      ['# API', '[Complete API](./docs/api.html)'].join('\n'),
      'repo-b',
      null
    );

    expect(result.apiDocumentation.link).toBe('https://raw.githubusercontent.com/keglev/repo-b/main/docs/api.html');
  });

  it('extracts docs from list items and relative links', async () => {
    const readmeText = [
      '# Architecture Overview',
      '- [Index](./docs/architecture.html)',
      '# API',
      '- [Complete API](./docs/api.md)',
      '# Testing',
      '- [Test Coverage Frontend](./docs/frontend.html)',
      '- [Test Coverage Backend](./docs/backend.html)',
      '# Production URL',
      '- [Production URL](./docs/index.html)',
    ].join('\n');

    const result = await extractRepoDocsDetailed(readmeText, 'repo-list', null);

    expect(result.architectureOverview.link).toBe('https://keglev.github.io/repo-list/docs/architecture.html');
    expect(result.apiDocumentation.link).toBe('https://github.com/keglev/repo-list/blob/main/docs/api.md');
    expect(result.testing.coverage).toHaveLength(2);
    expect(result.productionUrl.link).toBe('https://keglev.github.io/repo-list/docs/index.html');
  });

  it('converts absolute raw.githubusercontent.com links', async () => {
    const readmeText = [
      '# Architecture Overview',
      '[Index](https://raw.githubusercontent.com/keglev/repo-abs/main/docs/arch.md)',
      '# API',
      '[Complete API](https://raw.githubusercontent.com/keglev/repo-abs/main/docs/api.html)',
      '# Production URL',
      '[Production URL](https://raw.githubusercontent.com/keglev/repo-abs/main/docs/index.html)',
    ].join('\n');

    const result = await extractRepoDocsDetailed(readmeText, 'repo-abs', null);

    expect(result.architectureOverview.link).toBe('https://github.com/keglev/repo-abs/blob/main/docs/arch.md');
    expect(result.apiDocumentation.link).toBe('https://raw.githubusercontent.com/keglev/repo-abs/main/docs/api.html');
    expect(result.productionUrl.link).toBe('https://raw.githubusercontent.com/keglev/repo-abs/main/docs/index.html');
  });
});