// Verifies scanNodes: doc-link detection by label and href, localhost/docker filtering,
// relative-path expansion, first-match stopping, pre-existing field preservation,
// and resilience when a node property accessor throws.
const { scanNodes } = require('../../../scripts/applyFallbackDocScan');

// Identity normalizer — keeps label text as-is for easy assertions
const identity = (s) => s;

describe('applyFallbackDocScan – scanNodes', () => {
  test('returns the same array reference it receives', () => {
    const nodes = [];
    expect(scanNodes(nodes, identity)).toBe(nodes);
  });

  // ── skipping ──────────────────────────────────────────────────────────────

  test('skips nodes that already have repoDocs', () => {
    const node = {
      name: 'repo',
      repoDocs: { apiDocumentation: { link: 'https://existing.example.com', title: 'Existing' } },
      object: { text: '[API Docs](https://new.example.com)' },
    };
    scanNodes([node], identity);
    expect(node.repoDocs.apiDocumentation.link).toBe('https://existing.example.com');
  });

  test('skips nodes with no README text', () => {
    const node = { name: 'repo' };
    scanNodes([node], identity);
    expect(node.repoDocs).toBeUndefined();
    expect(node.docsLink).toBeUndefined();
  });

  // ── detection ─────────────────────────────────────────────────────────────

  test('sets repoDocs and docsLink when README contains a doc-like link', () => {
    const node = {
      name: 'repo',
      object: { text: 'See [API Documentation](https://api.example.com/docs) for details.' },
    };
    scanNodes([node], identity);
    expect(node.repoDocs).toBeDefined();
    expect(node.repoDocs.apiDocumentation.link).toBe('https://api.example.com/docs');
    expect(node.docsLink).toBe('https://api.example.com/docs');
    expect(node.docsTitle).toBe('API Documentation');
  });

  test('detects link with "docs" in href', () => {
    const node = {
      name: 'repo',
      object: { text: 'Read the [guide](https://example.com/docs/guide.html).' },
    };
    scanNodes([node], identity);
    expect(node.repoDocs).toBeDefined();
  });

  test('detects link with "swagger" in href', () => {
    const node = {
      name: 'repo',
      object: { text: '[Swagger UI](https://example.com/swagger/index.html)' },
    };
    scanNodes([node], identity);
    expect(node.repoDocs).toBeDefined();
  });

  test('detects link with "openapi" in href', () => {
    const node = {
      name: 'repo',
      object: { text: '[Spec](https://example.com/openapi.json)' },
    };
    scanNodes([node], identity);
    expect(node.repoDocs).toBeDefined();
  });

  // ── filtering ─────────────────────────────────────────────────────────────

  test('skips links containing localhost', () => {
    const node = {
      name: 'repo',
      object: { text: '[API docs](http://localhost:3000/swagger)' },
    };
    scanNodes([node], identity);
    expect(node.repoDocs).toBeUndefined();
  });

  test('skips links containing 127.0.0.1', () => {
    const node = {
      name: 'repo',
      object: { text: '[API docs](http://127.0.0.1:8080/api)' },
    };
    scanNodes([node], identity);
    expect(node.repoDocs).toBeUndefined();
  });

  test('does not set repoDocs when no link label or href is doc-like', () => {
    const node = {
      name: 'repo',
      object: { text: 'See [the project](https://github.com/user/repo) for more.' },
    };
    scanNodes([node], identity);
    expect(node.repoDocs).toBeUndefined();
  });

  // ── relative path conversion ──────────────────────────────────────────────

  test('converts relative ./docs path to raw.githubusercontent absolute URL', () => {
    const node = {
      name: 'my-repo',
      object: { text: '[API docs](./docs/api.md)' },
    };
    scanNodes([node], identity);
    expect(node.docsLink).toBe('https://raw.githubusercontent.com/keglev/my-repo/main/docs/api.md');
  });

  test('converts root-relative /docs path to raw.githubusercontent absolute URL', () => {
    const node = {
      name: 'my-repo',
      object: { text: '[Documentation](/docs/index.md)' },
    };
    scanNodes([node], identity);
    expect(node.docsLink).toBe('https://raw.githubusercontent.com/keglev/my-repo/main/docs/index.md');
  });

  // ── stops after first match ───────────────────────────────────────────────

  test('uses only the first doc-like match and stops scanning', () => {
    const node = {
      name: 'repo',
      object: {
        text: '[API docs](https://first.example.com/api) and [Redoc](https://second.example.com/redoc)',
      },
    };
    scanNodes([node], identity);
    expect(node.repoDocs.apiDocumentation.link).toBe('https://first.example.com/api');
    expect(node.docsLink).toBe('https://first.example.com/api');
  });

  // ── does not overwrite existing docsLink / docsTitle ─────────────────────

  test('does not overwrite pre-existing docsLink', () => {
    const node = {
      name: 'repo',
      docsLink: 'https://pre-existing.example.com',
      object: { text: '[API docs](https://new.example.com/api)' },
    };
    scanNodes([node], identity);
    expect(node.docsLink).toBe('https://pre-existing.example.com');
  });

  // ── normalizeTitle integration ────────────────────────────────────────────

  test('passes label through the provided normalizeTitle function', () => {
    const normalizeMock = jest.fn((s) => s.toUpperCase());
    const node = {
      name: 'repo',
      object: { text: '[api docs](https://example.com/api)' },
    };
    scanNodes([node], normalizeMock);
    expect(normalizeMock).toHaveBeenCalledWith('api docs');
    expect(node.docsTitle).toBe('API DOCS');
  });

  // ── resilience ────────────────────────────────────────────────────────────

  test('continues scanning other nodes when one node throws', () => {
    const badNode = {
      name: 'bad',
      get object() { throw new Error('boom'); },
    };
    const goodNode = {
      name: 'good',
      object: { text: '[API docs](https://example.com/api)' },
    };
    expect(() => scanNodes([badNode, goodNode], identity)).not.toThrow();
    expect(goodNode.repoDocs).toBeDefined();
  });

  // ── docker hostname filter ────────────────────────────────────────────────

  test('skips links containing a docker hostname', () => {
    const node = {
      name: 'repo',
      object: { text: '[API docs](http://docker:8080/swagger)' },
    };
    scanNodes([node], identity);
    expect(node.repoDocs).toBeUndefined();
  });

  // ── docsTitle fallback to "Documentation" ─────────────────────────────────

  test('uses "Documentation" when normalizeTitle returns an empty string', () => {
    const node = {
      name: 'repo',
      object: { text: '[API docs](https://example.com/api)' },
    };
    scanNodes([node], () => '');
    expect(node.docsTitle).toBe('Documentation');
  });

  test('uses "Documentation" when normalizeTitle returns null', () => {
    const node = {
      name: 'repo',
      object: { text: '[API docs](https://example.com/api)' },
    };
    scanNodes([node], () => null);
    expect(node.docsTitle).toBe('Documentation');
  });

  // ── pre-existing docsTitle is not overwritten ─────────────────────────────

  test('does not overwrite a pre-existing docsTitle', () => {
    const node = {
      name: 'repo',
      docsTitle: 'Pre-existing Title',
      object: { text: '[API docs](https://new.example.com/api)' },
    };
    scanNodes([node], identity);
    expect(node.docsTitle).toBe('Pre-existing Title');
  });
});
