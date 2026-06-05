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
const { extractRepoDocsDetailed } = require('../../../../scripts/lib/docs/extractReadmeDocs');

describe('extractReadmeDocs', () => {
  let originalGithubToken;
  let originalGhProjectsToken;

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-apply flattenNodeText after clearAllMocks() — CRA's Jest runner strips
    // factory-provided implementations, so we set it explicitly every time.
    getParseReadme().flattenNodeText.mockImplementation((node) => {
      if (typeof node === 'string') return node;
      if (node && Array.isArray(node.children)) {
        return node.children.map((child) => child.value || '').join(' ');
      }
      return '';
    });
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

  // ── Architecture: list item paths ───────────────────────────────────────────

  it('extracts architecture from list item via findLinksInListItem when it returns links', async () => {
    const pr = getParseReadme();
    pr.findLinksInListItem.mockReturnValue([{ label: 'Index', url: 'docs/arch.html' }]);
    pr.parseMarkdown.mockReturnValue({
      children: [
        { type: 'heading', children: [{ value: 'Architecture Overview' }] },
        { type: 'list', children: [{ type: 'listItem', children: [] }] },
      ],
    });
    const result = await extractRepoDocsDetailed('no readme text', 'my-repo');
    expect(result.architectureOverview.title).toBe('Index');
    expect(result.architectureOverview.link).toBe('https://keglev.github.io/my-repo/docs/arch.html');
  });

  it('falls back to flattenNodeText regex for arch list item when findLinksInListItem returns null', async () => {
    const pr = getParseReadme();
    pr.findLinksInListItem.mockReturnValue(null);
    pr.parseMarkdown.mockReturnValue({
      children: [
        { type: 'heading', children: [{ value: 'Architecture Overview' }] },
        {
          type: 'list',
          children: [{ type: 'listItem', children: [{ value: '[Index docs](docs/arch.html)' }] }],
        },
      ],
    });
    const result = await extractRepoDocsDetailed('no readme text', 'my-repo');
    expect(result.architectureOverview.title).toBe('Index docs');
    expect(result.architectureOverview.link).toBe('https://keglev.github.io/my-repo/docs/arch.html');
  });

  it('falls back to flattenNodeText regex for arch list item when findLinksInListItem returns empty array', async () => {
    const pr = getParseReadme();
    pr.findLinksInListItem.mockReturnValue([]);
    pr.parseMarkdown.mockReturnValue({
      children: [
        { type: 'heading', children: [{ value: 'Architecture Overview' }] },
        {
          type: 'list',
          children: [{ type: 'listItem', children: [{ value: '[Index](docs/arch.md)' }] }],
        },
      ],
    });
    const result = await extractRepoDocsDetailed('no readme text', 'my-repo');
    expect(result.architectureOverview.title).toBe('Index');
    expect(result.architectureOverview.link).toBe('https://github.com/keglev/my-repo/blob/main/docs/arch.md');
  });

  it('handles null url from findLinksInListItem (toRawGithub null branch) and returns placeholder', async () => {
    const pr = getParseReadme();
    pr.findLinksInListItem.mockReturnValue([{ label: 'Index', url: null }]);
    pr.parseMarkdown.mockReturnValue({
      children: [
        { type: 'heading', children: [{ value: 'Architecture Overview' }] },
        { type: 'list', children: [{ type: 'listItem', children: [] }] },
      ],
    });
    const result = await extractRepoDocsDetailed('no readme text', 'my-repo');
    // toRawGithub(null) returns null → link = null → foundAny = false → placeholder
    expect(result.placeholder).toBeDefined();
  });

  // ── toRawGithub: blob URL variants ─────────────────────────────────────────

  it('converts github.com blob .html (safe path) to github pages URL', async () => {
    const pr = getParseReadme();
    pr.findLinksInListItem.mockReturnValue([
      { label: 'Index', url: 'https://github.com/keglev/my-repo/blob/main/docs/arch.html' },
    ]);
    pr.parseMarkdown.mockReturnValue({
      children: [
        { type: 'heading', children: [{ value: 'Architecture Overview' }] },
        { type: 'list', children: [{ type: 'listItem', children: [] }] },
      ],
    });
    const result = await extractRepoDocsDetailed('no readme text', 'my-repo');
    expect(result.architectureOverview.link).toBe('https://keglev.github.io/my-repo/docs/arch.html');
  });

  it('returns blob URL unchanged when path does not match safe docs pattern', async () => {
    const pr = getParseReadme();
    pr.findLinksInListItem.mockReturnValue([
      { label: 'Index', url: 'https://github.com/keglev/my-repo/blob/main/other/file.html' },
    ]);
    pr.parseMarkdown.mockReturnValue({
      children: [
        { type: 'heading', children: [{ value: 'Architecture Overview' }] },
        { type: 'list', children: [{ type: 'listItem', children: [] }] },
      ],
    });
    const result = await extractRepoDocsDetailed('no readme text', 'my-repo');
    expect(result.architectureOverview.link).toBe('https://github.com/keglev/my-repo/blob/main/other/file.html');
  });

  it('returns absolute URL unchanged when GITHUB_TOKEN is present (token bypasses conversion)', async () => {
    process.env.GITHUB_TOKEN = 'token';
    const pr = getParseReadme();
    pr.findLinksInListItem.mockReturnValue([
      { label: 'Index', url: 'https://raw.githubusercontent.com/keglev/my-repo/main/docs/arch.md' },
    ]);
    pr.parseMarkdown.mockReturnValue({
      children: [
        { type: 'heading', children: [{ value: 'Architecture Overview' }] },
        { type: 'list', children: [{ type: 'listItem', children: [] }] },
      ],
    });
    const result = await extractRepoDocsDetailed('no readme text', 'my-repo');
    // !(GITHUB_TOKEN) is false → skip conversion block → return href unchanged
    expect(result.architectureOverview.link).toBe('https://raw.githubusercontent.com/keglev/my-repo/main/docs/arch.md');
  });

  it('returns normalized relative path when repoName is null', async () => {
    const pr = getParseReadme();
    pr.findLinksInListItem.mockReturnValue([{ label: 'Index', url: './docs/arch.html' }]);
    pr.parseMarkdown.mockReturnValue({
      children: [
        { type: 'heading', children: [{ value: 'Architecture Overview' }] },
        { type: 'list', children: [{ type: 'listItem', children: [] }] },
      ],
    });
    const result = await extractRepoDocsDetailed('no readme text', null);
    // toRawGithub: !repoName → return normalized path
    expect(result.architectureOverview.link).toBe('docs/arch.html');
  });

  it('returns normalized path for relative URL outside safe docs pattern', async () => {
    const pr = getParseReadme();
    pr.findLinksInListItem.mockReturnValue([{ label: 'Index', url: './README.md' }]);
    pr.parseMarkdown.mockReturnValue({
      children: [
        { type: 'heading', children: [{ value: 'Architecture Overview' }] },
        { type: 'list', children: [{ type: 'listItem', children: [] }] },
      ],
    });
    const result = await extractRepoDocsDetailed('no readme text', 'my-repo');
    // toRawGithub: no token, safeDocsPattern fails → return p
    expect(result.architectureOverview.link).toBe('README.md');
  });

  // ── API: list item and fallback paths ──────────────────────────────────────

  it('extracts API from list item via extractTextFromListItem', async () => {
    const pr = getParseReadme();
    pr.extractTextFromListItem.mockReturnValue('[Complete API Reference](./docs/api.md)');
    pr.parseMarkdown.mockReturnValue({
      children: [
        { type: 'list', children: [{ type: 'listItem', children: [] }] },
      ],
    });
    const result = await extractRepoDocsDetailed('no readme text', 'my-repo');
    expect(result.apiDocumentation.title).toBe('Complete API Reference');
    expect(result.apiDocumentation.link).toBe('https://github.com/keglev/my-repo/blob/main/docs/api.md');
  });

  it('extracts API via plain-text fallback when AST returns empty children', async () => {
    getParseReadme().parseMarkdown.mockReturnValue({ children: [] });
    const result = await extractRepoDocsDetailed(
      'Some text\n[Complete API](./docs/api.md)\nMore text',
      'my-repo'
    );
    expect(result.apiDocumentation).toBeDefined();
    expect(result.apiDocumentation.link).toBe('https://github.com/keglev/my-repo/blob/main/docs/api.md');
  });

  it('extracts API via final scan when label contains "api"', async () => {
    getParseReadme().parseMarkdown.mockReturnValue({ children: [] });
    const result = await extractRepoDocsDetailed(
      'Check the [API Reference](./docs/api-reference.html) here',
      'my-repo'
    );
    expect(result.apiDocumentation).toBeDefined();
    expect(result.apiDocumentation.link).toBe('https://keglev.github.io/my-repo/docs/api-reference.html');
  });

  it('extracts API via final scan when URL ends with api.html', async () => {
    getParseReadme().parseMarkdown.mockReturnValue({ children: [] });
    const result = await extractRepoDocsDetailed(
      'See [Documentation](./docs/api.html) for details',
      'my-repo'
    );
    expect(result.apiDocumentation).toBeDefined();
    expect(result.apiDocumentation.link).toBe('https://keglev.github.io/my-repo/docs/api.html');
  });

  it('extracts API via raw URL scan when a bare raw.githubusercontent URL with "api" appears', async () => {
    getParseReadme().parseMarkdown.mockReturnValue({ children: [] });
    const readme = 'See https://raw.githubusercontent.com/keglev/my-repo/main/src/docs/api-reference.md for info';
    const result = await extractRepoDocsDetailed(readme, 'my-repo');
    expect(result.apiDocumentation).toBeDefined();
    expect(result.apiDocumentation.link).toBe('https://github.com/keglev/my-repo/blob/main/src/docs/api-reference.md');
  });

  // ── Testing coverage: paragraph, list and plain-text paths ─────────────────

  it('extracts testing coverage from paragraph with description and translates it', async () => {
    getParseReadme().parseMarkdown.mockReturnValue({
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'Frontend coverage report ' },
            { type: 'link', url: 'https://example.com/coverage.html', children: [{ value: 'Test Coverage Frontend' }] },
          ],
        },
      ],
    });
    const translateWithCache = jest.fn(async (_, text) => ({ text: `de:${text}` }));
    const result = await extractRepoDocsDetailed('no text', 'repo-cov', translateWithCache);
    expect(result.testing.coverage[0].description).toBe('Frontend coverage report');
    expect(result.testing.coverage[0].description_de).toBe('de:Frontend coverage report');
  });

  it('extracts testing coverage from list item via matchAll regex', async () => {
    getParseReadme().parseMarkdown.mockReturnValue({
      children: [
        {
          type: 'list',
          children: [
            { type: 'listItem', children: [{ value: '[Test Coverage Frontend](https://example.com/cov.html)' }] },
          ],
        },
      ],
    });
    const result = await extractRepoDocsDetailed('no text', 'repo-cov');
    expect(result.testing.coverage[0].title).toBe('Test Coverage Frontend');
    expect(result.testing.coverage[0].link).toBe('https://example.com/cov.html');
  });

  it('extracts testing coverage via plain-text fallback when AST finds none', async () => {
    getParseReadme().parseMarkdown.mockReturnValue({ children: [] });
    const result = await extractRepoDocsDetailed(
      '[Test Coverage Report](https://example.com/cov.html)',
      'repo-cov'
    );
    expect(result.testing.coverage[0].link).toBe('https://example.com/cov.html');
  });

  // ── Production URL: list item, paraHasProduction, plain-text paths ─────────

  it('extracts production URL from list item when flattened text contains "Production URL"', async () => {
    getParseReadme().parseMarkdown.mockReturnValue({
      children: [
        {
          type: 'list',
          children: [
            { type: 'listItem', children: [{ value: '[Production URL](https://my-app.example.com/)' }] },
          ],
        },
      ],
    });
    const result = await extractRepoDocsDetailed('no text', 'my-repo');
    expect(result.productionUrl.title).toBe('Production URL');
    expect(result.productionUrl.link).toBe('https://my-app.example.com/');
  });

  it('extracts production URL when "Production URL" appears as paragraph text (not link label)', async () => {
    getParseReadme().parseMarkdown.mockReturnValue({
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'Production URL: ' },
            { type: 'link', url: 'https://live.example.com', children: [{ value: 'Live App' }] },
          ],
        },
      ],
    });
    const result = await extractRepoDocsDetailed('no text', 'my-repo');
    expect(result.productionUrl.title).toBe('Live App');
    expect(result.productionUrl.link).toBe('https://live.example.com');
  });

  it('extracts production URL via plain-text fallback when AST returns empty', async () => {
    getParseReadme().parseMarkdown.mockReturnValue({ children: [] });
    const result = await extractRepoDocsDetailed(
      '[Production URL](https://live.example.com)',
      'my-repo'
    );
    expect(result.productionUrl.link).toBe('https://live.example.com');
  });

  // ── shouldTranslateUI and foundAny edge cases ──────────────────────────────

  it('does not set title_de when shouldTranslateUI returns false for a long title', async () => {
    const pr = getParseReadme();
    const longTitle = 'Index ' + 'x'.repeat(300);
    pr.findLinksInListItem.mockReturnValue([{ label: longTitle, url: 'docs/arch.html' }]);
    pr.parseMarkdown.mockReturnValue({
      children: [
        { type: 'heading', children: [{ value: 'Architecture Overview' }] },
        { type: 'list', children: [{ type: 'listItem', children: [] }] },
      ],
    });
    const translateWithCache = jest.fn(async (_, text) => ({ text: `de:${text}` }));
    const result = await extractRepoDocsDetailed('no readme text', 'my-repo', translateWithCache);
    expect(result.architectureOverview.title).toBe(longTitle);
    // shouldTranslateUI returns false for title > 300 chars → title_de not set
    expect(result.architectureOverview.title_de).toBeUndefined();
  });

  it('returns out (not placeholder) when only productionUrl is found', async () => {
    getParseReadme().parseMarkdown.mockReturnValue({ children: [] });
    const result = await extractRepoDocsDetailed(
      '[Production URL](https://my-app.example.com)',
      'my-repo'
    );
    expect(result.productionUrl).toBeDefined();
    expect(result.placeholder).toBeUndefined();
  });
});