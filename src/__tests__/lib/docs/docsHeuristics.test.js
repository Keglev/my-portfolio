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
});
