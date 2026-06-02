jest.mock('../../../../scripts/lib/parseReadme', () => ({
  parseMarkdown: jest.fn(),
  findLinksInListItem: jest.fn(),
  flattenNodeText: jest.fn((node) => {
    if (typeof node === 'string') return node;
    if (node && Array.isArray(node.children)) {
      return node.children.map((child) => child.value || '').join(' ');
    }
    return '';
  }),
  extractTextFromListItem: jest.fn(),
}));

const getParseReadme = () => require('../../../../scripts/lib/parseReadme');

describe('extractReadmeDocs', () => {
  let extractRepoDocsDetailed;
  let originalGithubToken;
  let originalGhProjectsToken;

  beforeEach(() => {
    jest.clearAllMocks();
    originalGithubToken = process.env.GITHUB_TOKEN;
    originalGhProjectsToken = process.env.GH_PROJECTS_TOKEN;
    delete process.env.GITHUB_TOKEN;
    delete process.env.GH_PROJECTS_TOKEN;
  });

  afterEach(() => {
    if (typeof originalGithubToken === 'undefined') {
      delete process.env.GITHUB_TOKEN;
    } else {
      process.env.GITHUB_TOKEN = originalGithubToken;
    }

    if (typeof originalGhProjectsToken === 'undefined') {
      delete process.env.GH_PROJECTS_TOKEN;
    } else {
      process.env.GH_PROJECTS_TOKEN = originalGhProjectsToken;
    }
  });

  ({ extractRepoDocsDetailed } = require('../../../../scripts/lib/docs/extractReadmeDocs'));

  it('returns null for empty README text', async () => {
    await expect(extractRepoDocsDetailed('', 'repo-a')).resolves.toBeNull();
  });

  it('extracts architecture, api, testing and production links from markdown ASTs', async () => {
    getParseReadme().parseMarkdown.mockReturnValue({ children: [] });

    const result = await extractRepoDocsDetailed([
      '# Architecture Overview',
      '[• Index](docs/arch.html) {"type":"paragraph"}',
      '# API',
      '[Complete API](./docs/api.md)',
      '# Testing',
      '[Test Coverage Frontend](https://example.com/coverage.html)',
      '[Test Coverage Backend](https://example.com/coverage-backend.html)',
      '# Production URL',
      '[Production URL](docs/index.html)',
    ].join('\n'), 'repo-a');

    expect(result.architectureOverview.title).toBe('• Index');
    expect(result.architectureOverview.link).toBe('https://keglev.github.io/repo-a/docs/arch.html');

    expect(result.apiDocumentation.title).toBe('Complete API');
    expect(result.apiDocumentation.link).toBe('https://github.com/keglev/repo-a/blob/main/docs/api.md');

    expect(result.testing.coverage).toHaveLength(2);
    expect(result.testing.coverage[0].link).toBe('https://example.com/coverage.html');
    expect(result.testing.coverage[1].link).toBe('https://example.com/coverage-backend.html');

    expect(result.productionUrl.title).toBe('Production URL');
    expect(result.productionUrl.link).toBe('https://keglev.github.io/repo-a/docs/index.html');
  });

  it('returns placeholder docs when no docs are found', async () => {
    getParseReadme().parseMarkdown.mockReturnValue({ children: [] });

    const result = await extractRepoDocsDetailed('No docs here', 'repo-b');

    expect(result.placeholder.title).toBe('Under Construction');
    expect(result.placeholder.title_de).toBe('Noch in Entwicklung');
  });

  it('uses raw github links when a token is present and exposes the helper predicate', async () => {
    process.env.GITHUB_TOKEN = 'token';

    getParseReadme().parseMarkdown.mockReturnValue({ children: [] });

    const result = await extractRepoDocsDetailed(['# API', '[Complete API](./docs/api.html)'].join('\n'), 'repo-c');

    expect(result.apiDocumentation.link).toBe('https://raw.githubusercontent.com/keglev/repo-c/main/docs/api.html');
    expect(require('../../../../scripts/lib/docs/extractReadmeDocs').shouldTranslateUI('short title')).toBe(true);
    expect(require('../../../../scripts/lib/docs/extractReadmeDocs').shouldTranslateUI('')).toBe('');
    expect(require('../../../../scripts/lib/docs/extractReadmeDocs').stripAstJsonFragments('Intro {"type":"paragraph"} text')).toBe('Intro text');

  });

  it('converts raw, blob and relative docs URLs through the fallback path', async () => {
    getParseReadme().parseMarkdown.mockReturnValue({ children: [] });

    const result = await extractRepoDocsDetailed([
      '# Architecture Overview',
      '[Index](https://raw.githubusercontent.com/keglev/repo-x/main/docs/arch.md)',
      '# API',
      '[Complete API](https://raw.githubusercontent.com/keglev/repo-x/main/docs/api.html)',
      '# Production URL',
      '[Production URL](https://github.com/keglev/repo-x/blob/main/docs/index.html)',
      '# Testing',
      '[Test Coverage Frontend](./docs/cov.md)',
    ].join('\n'), 'repo-x');

    expect(result.architectureOverview.link).toBe('https://github.com/keglev/repo-x/blob/main/docs/arch.md');
    expect(result.apiDocumentation.link).toBe('https://raw.githubusercontent.com/keglev/repo-x/main/docs/api.html');
    expect(result.productionUrl.link).toBe('https://github.com/keglev/repo-x/blob/main/docs/index.html');
    expect(result.testing.coverage[0].link).toBe('./docs/cov.md');
  });

  it('extracts AST descriptions and translates them', async () => {
    getParseReadme().parseMarkdown.mockReturnValue({
      children: [
        { type: 'heading', children: [{ value: 'Architecture Overview' }] },
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'Architecture intro ' },
            { type: 'link', url: './docs/arch.html', children: [{ value: 'Index' }] },
            { type: 'text', value: ' {"type":"paragraph"} ' },
          ],
        },
        { type: 'heading', children: [{ value: 'API' }] },
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'API intro ' },
            { type: 'link', url: './docs/api.md', children: [{ value: 'Complete API' }] },
          ],
        },
      ],
    });

    const translateWithCache = jest.fn(async (_repoName, text) => ({ text: `de:${text}` }));
    const result = await extractRepoDocsDetailed('README text', 'repo-ast-desc', translateWithCache);

    expect(result.architectureOverview.description).toBe('Architecture intro');
    expect(result.architectureOverview.description_de).toBe('de:Architecture intro');
    expect(result.apiDocumentation.description).toBe('API intro');
    expect(result.apiDocumentation.description_de).toBe('de:API intro');
  });
});