// Verifies docsHeuristics: backfillDocsFromText link/inline detection,
// backfillFromAstHeading heading scanning, and postProcessDocsLinkCandidates
// bad-link (issue/PR URL) filtering.
const docsHeur = require('../../../../scripts/lib/docs/docsHeuristics');

describe('docsHeuristics', () => {
  test('exports functions', () => {
    expect(typeof docsHeur.backfillDocsFromText).toBe('function');
    expect(typeof docsHeur.backfillFromAstHeading).toBe('function');
    expect(typeof docsHeur.postProcessDocsLinkCandidates).toBe('function');
  });

  test('backfills docs from text and AST headings', () => {
    const fromText = docsHeur.backfillDocsFromText({
      name: 'repo-a',
      object: { text: '[API docs](https://example.com/api.md)' },
    });
    expect(fromText.docsTitle).toBe('API docs');
    expect(fromText.docsLink).toBe('https://example.com/api.md');

    const fromLine = docsHeur.backfillDocsFromText({
      name: 'repo-b',
      object: { text: 'Documentation: https://example.com/docs.md' },
    });
    expect(fromLine.docsTitle).toBe('Documentation');
    expect(fromLine.docsLink).toBe('https://example.com/docs.md');

    const fromHeading = docsHeur.backfillFromAstHeading({
      name: 'repo-c',
      _ast: { children: [{ type: 'heading', children: [{ value: 'API docs' }] }] },
    });
    expect(fromHeading.docsTitle).toBe('API docs');
    expect(fromHeading.docsLink).toBe('https://github.com/keglev/repo-c/blob/main/README.md');
  });

  test('post processes docs link candidates from repoDocs, docs and markdown text', () => {
    const node = docsHeur.postProcessDocsLinkCandidates({
      name: 'repo-d',
      docsLink: 'https://github.com/keglev/repo-d/issues/1',
      repoDocs: {
        apiDocumentation: { title: 'API', link: 'https://example.com/api.md' },
      },
      docs: {
        documentation: { title: 'Docs', link: 'https://example.com/docs.md' },
      },
      object: {
        text: 'See [Architecture docs](https://example.com/arch.html)',
      },
    });

    expect(node.docsTitle).toBe('API');
    expect(node.docsLink).toBe('https://example.com/api.md');

    const relativeNode = docsHeur.postProcessDocsLinkCandidates({
      name: 'repo-e',
      docsLink: 'https://github.com/keglev/repo-e/issues/1',
      object: {
        text: 'See [Docs](./docs/guide.md)',
      },
    });

    expect(relativeNode.docsTitle).toBe('Docs');
    expect(relativeNode.docsLink).toBe('https://raw.githubusercontent.com/keglev/repo-e/main/docs/guide.md');
  });

  test('keeps the node unchanged when no doc fields are available', () => {
    const node = { name: 'repo-empty', object: {} };
    expect(docsHeur.backfillDocsFromText(node)).toBe(node);
    expect(docsHeur.backfillFromAstHeading(node)).toBe(node);
    expect(docsHeur.postProcessDocsLinkCandidates(node)).toBe(node);
  });

  test('prefers architectureOverview and docs.documentation fallbacks when api docs are unavailable', () => {
    const archNode = docsHeur.postProcessDocsLinkCandidates({
      name: 'repo-f',
      docsLink: 'https://github.com/keglev/repo-f/issues/1',
      repoDocs: {
        architectureOverview: { title: 'Architecture', link: 'https://example.com/arch.html' },
      },
    });
    expect(archNode.docsTitle).toBe('Architecture');
    expect(archNode.docsLink).toBe('https://example.com/arch.html');

    const docsNode = docsHeur.postProcessDocsLinkCandidates({
      name: 'repo-g',
      docsLink: 'https://github.com/keglev/repo-g/issues/1',
      docs: {
        documentation: { title: 'Docs title', link: 'https://example.com/docs.html' },
      },
    });
    expect(docsNode.docsTitle).toBe('Docs title');
    expect(docsNode.docsLink).toBe('https://example.com/docs.html');
  });

  // ── additional branch coverage ──────────────────────────────────────────────

  test('backfillDocsFromText skips search when node already has both docsLink and docsTitle', () => {
    const node = {
      name: 'repo-h',
      docsLink: 'https://existing.com/docs',
      docsTitle: 'Existing Docs',
      object: { text: '[Other docs](https://other.com/api.md)' },
    };
    const result = docsHeur.backfillDocsFromText(node);
    expect(result).toBe(node);
    expect(result.docsTitle).toBe('Existing Docs');
    expect(result.docsLink).toBe('https://existing.com/docs');
  });

  test('backfillFromAstHeading preserves existing docsTitle and docsLink when already set', () => {
    const node = {
      name: 'repo-i',
      docsTitle: 'Existing Title',
      docsLink: 'https://existing.com/docs',
      _ast: {
        children: [{
          type: 'heading',
          children: [{ value: 'API documentation' }],
        }],
      },
    };
    const result = docsHeur.backfillFromAstHeading(node);
    expect(result.docsTitle).toBe('Existing Title');
    expect(result.docsLink).toBe('https://existing.com/docs');
  });

  test('postProcessDocsLinkCandidates returns node unchanged when docsLink is a valid non-issue URL', () => {
    const node = {
      name: 'repo-j',
      docsLink: 'https://example.com/api-docs',
      docsTitle: 'API Docs',
    };
    const result = docsHeur.postProcessDocsLinkCandidates(node);
    expect(result).toBe(node);
    expect(result.docsLink).toBe('https://example.com/api-docs');
    expect(result.docsTitle).toBe('API Docs');
  });

  test('postProcessDocsLinkCandidates falls through api docs to architectureOverview when api link is also an issue', () => {
    const node = docsHeur.postProcessDocsLinkCandidates({
      name: 'repo-k',
      docsLink: 'https://github.com/keglev/repo-k/issues/1',
      repoDocs: {
        apiDocumentation: {
          title: 'Issue Link',
          link: 'https://github.com/keglev/repo-k/issues/5',
        },
        architectureOverview: {
          title: 'Architecture',
          link: 'https://example.com/arch.html',
        },
      },
    });
    expect(node.docsTitle).toBe('Architecture');
    expect(node.docsLink).toBe('https://example.com/arch.html');
  });

  test('postProcessDocsLinkCandidates picks absolute https link from text scan when no other candidates', () => {
    const node = docsHeur.postProcessDocsLinkCandidates({
      name: 'repo-l',
      docsLink: 'https://github.com/keglev/repo-l/issues/1',
      object: {
        text: 'See [API docs](https://example.com/api-docs/index.html) for more.',
      },
    });
    expect(node.docsTitle).toBe('API docs');
    expect(node.docsLink).toBe('https://example.com/api-docs/index.html');
  });

  test('postProcessDocsLinkCandidates resolves absolute-path /docs link from text scan', () => {
    const node = docsHeur.postProcessDocsLinkCandidates({
      name: 'repo-m',
      docsLink: 'https://github.com/keglev/repo-m/issues/1',
      object: {
        text: 'See [API docs](/docs/api.md) for more.',
      },
    });
    expect(node.docsTitle).toBe('API docs');
    expect(node.docsLink).toBe('https://raw.githubusercontent.com/keglev/repo-m/main/docs/api.md');
  });
});
