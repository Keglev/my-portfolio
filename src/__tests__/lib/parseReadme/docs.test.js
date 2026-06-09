// Verifies extractDocsFromAst: docs section detection by heading, link
// extraction, and legacy docsLink/docsTitle field backfill for older consumers.
const { extractDocsFromAst } = require('../../../../scripts/lib/parseReadme/docs');

// ── AST helpers ──────────────────────────────────────────────────────────────

function heading(text, depth = 2) {
  return { type: 'heading', depth, children: [{ type: 'text', value: text }] };
}

function paragraphWithLink(url, label, description = '') {
  const children = [{ type: 'link', url, children: [{ type: 'text', value: label }] }];
  if (description) children.push({ type: 'text', value: description });
  return { type: 'paragraph', children };
}

function paragraphTextOnly(text) {
  return { type: 'paragraph', children: [{ type: 'text', value: text }] };
}

function listWithDirectLink(url, label, description = '') {
  return {
    type: 'list',
    children: [
      {
        type: 'listItem',
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'link', url, children: [{ type: 'text', value: label }] },
              ...(description ? [{ type: 'text', value: description }] : []),
            ],
          },
        ],
      },
    ],
  };
}

function listWithTextLink(url, label) {
  // List item whose text contains a markdown link (flat text – extractLinkFromListNode regex path)
  return {
    type: 'list',
    children: [
      {
        type: 'listItem',
        children: [
          { type: 'paragraph', children: [{ type: 'text', value: `[${label}](${url})` }] },
        ],
      },
    ],
  };
}

function root(...children) {
  return { type: 'root', children };
}

// ── tests ────────────────────────────────────────────────────────────────────

describe('parseReadme/docs – extractDocsFromAst', () => {
  test('returns empty docs when ast is null', () => {
    const result = extractDocsFromAst(null, 'repo');
    // early return before legacy is assigned, so legacy is absent
    expect(result.documentation).toBeNull();
    expect(result.apiDocumentation).toBeNull();
    expect(result.legacy).toBeUndefined();
  });

  test('returns empty docs when ast has no children array', () => {
    const result = extractDocsFromAst({ type: 'root' }, 'repo');
    // same early-return path — no legacy property
    expect(result.documentation).toBeNull();
    expect(result.apiDocumentation).toBeNull();
    expect(result.legacy).toBeUndefined();
  });

  test('returns empty docs when AST contains no matching headings', () => {
    const ast = root(heading('Installation'), paragraphWithLink('https://example.com', 'Link'));
    const result = extractDocsFromAst(ast, 'repo');
    expect(result.documentation).toBeNull();
    expect(result.apiDocumentation).toBeNull();
    expect(result.legacy.docsLink).toBeNull();
  });

  // ── Documentation heading → paragraph link ────────────────────────────────

  test('extracts documentation from paragraph link under Documentation heading', () => {
    const ast = root(
      heading('Documentation'),
      paragraphWithLink('https://example.com/docs', 'Read the Docs', 'Great docs')
    );
    const result = extractDocsFromAst(ast, 'repo');
    expect(result.documentation).toBeDefined();
    expect(result.documentation.link).toBe('https://example.com/docs');
    expect(result.documentation.title).toBe('Read the Docs');
    expect(result.legacy.docsLink).toBe('https://example.com/docs');
    expect(result.legacy.docsTitle).toBe('Read the Docs');
  });

  test('breaks inner loop when next heading depth <= current heading depth', () => {
    const ast = root(
      heading('Documentation', 2),
      heading('Other Section', 2), // same depth — should break without finding a link
      paragraphWithLink('https://example.com/docs', 'Should not be found')
    );
    const result = extractDocsFromAst(ast, 'repo');
    expect(result.documentation).toBeNull();
  });

  test('does not break when next heading is deeper than current', () => {
    const ast = root(
      heading('Documentation', 2),
      heading('Sub-section', 3), // deeper — should NOT break
      paragraphWithLink('https://example.com/docs', 'Sub Docs')
    );
    const result = extractDocsFromAst(ast, 'repo');
    expect(result.documentation).toBeDefined();
    expect(result.documentation.link).toBe('https://example.com/docs');
  });

  // ── Documentation heading → list with direct linkChild ───────────────────

  test('extracts documentation from list item with direct link child', () => {
    const ast = root(
      heading('Documentation'),
      listWithDirectLink('https://example.com/guide', 'User Guide')
    );
    const result = extractDocsFromAst(ast, 'repo');
    expect(result.documentation).toBeDefined();
    expect(result.documentation.link).toBe('https://example.com/guide');
    expect(result.documentation.title).toBe('User Guide');
  });

  // ── Documentation heading → list via extractLinkFromListNode regex ────────

  test('extracts documentation via extractLinkFromListNode regex fallback', () => {
    const ast = root(
      heading('Documentation'),
      listWithTextLink('https://example.com/docs-fallback', 'Docs Fallback')
    );
    const result = extractDocsFromAst(ast, 'repo');
    expect(result.documentation).toBeDefined();
    expect(result.documentation.link).toBeTruthy();
  });

  // ── Documentation heading → paragraph with no link ───────────────────────

  test('returns null documentation when paragraph under heading has no link', () => {
    const ast = root(
      heading('Documentation'),
      paragraphTextOnly('No links here.')
    );
    const result = extractDocsFromAst(ast, 'repo');
    expect(result.documentation).toBeNull();
  });

  // ── API Documentation heading → paragraph link ───────────────────────────

  test('extracts apiDocumentation from paragraph link under API Documentation heading', () => {
    const ast = root(
      heading('API Documentation'),
      paragraphWithLink('https://api.example.com', 'API Reference')
    );
    const result = extractDocsFromAst(ast, 'repo');
    expect(result.apiDocumentation).toBeDefined();
    expect(result.apiDocumentation.link).toBe('https://api.example.com');
    expect(result.apiDocumentation.title).toBe('API Reference');
    expect(result.legacy.docsLink).toBe('https://api.example.com');
  });

  test('extracts apiDocumentation from "API Docs" heading variant', () => {
    const ast = root(
      heading('API Docs'),
      paragraphWithLink('https://api.example.com/v2', 'v2 API')
    );
    const result = extractDocsFromAst(ast, 'repo');
    expect(result.apiDocumentation).toBeDefined();
  });

  // ── API Documentation heading → list with api/swagger/openapi URL ─────────

  test('extracts apiDocumentation from list item whose URL matches /api|openapi|swagger/', () => {
    const ast = root(
      heading('API Documentation'),
      listWithDirectLink('https://example.com/swagger/index.html', 'Swagger UI')
    );
    const result = extractDocsFromAst(ast, 'repo');
    expect(result.apiDocumentation).toBeDefined();
    expect(result.apiDocumentation.link).toBe('https://example.com/swagger/index.html');
  });

  test('extracts apiDocumentation from list item when flat text contains "api"', () => {
    const ast = root(
      heading('API Documentation'),
      {
        type: 'list',
        children: [
          {
            type: 'listItem',
            children: [
              {
                type: 'paragraph',
                children: [{ type: 'text', value: '[API Reference](https://example.com/reference)' }],
              },
            ],
          },
        ],
      }
    );
    const result = extractDocsFromAst(ast, 'repo');
    expect(result.apiDocumentation).toBeDefined();
  });

  // ── relative path → toRaw conversion ────────────────────────────────────

  test('converts relative documentation link to raw.githubusercontent URL', () => {
    const ast = root(
      heading('Documentation'),
      paragraphWithLink('./docs/guide.md', 'Guide')
    );
    const result = extractDocsFromAst(ast, 'my-repo');
    expect(result.documentation.link).toBe(
      'https://raw.githubusercontent.com/keglev/my-repo/main/docs/guide.md'
    );
  });

  test('leaves absolute https links unchanged in toRaw', () => {
    const ast = root(
      heading('Documentation'),
      paragraphWithLink('https://absolute.example.com/docs', 'Docs')
    );
    const result = extractDocsFromAst(ast, 'repo');
    expect(result.documentation.link).toBe('https://absolute.example.com/docs');
  });

  test('handles toRaw with null repo (no prefix added)', () => {
    const ast = root(
      heading('Documentation'),
      paragraphWithLink('./docs/guide.md', 'Guide')
    );
    const result = extractDocsFromAst(ast, null);
    // Without repo the relative path is returned as-is (no raw.githubusercontent prefix)
    expect(result.documentation.link).toBe('docs/guide.md');
  });

  // ── legacy fallback logic ────────────────────────────────────────────────

  test('prefers documentation over apiDocumentation for legacy fields', () => {
    const ast = root(
      heading('Documentation'),
      paragraphWithLink('https://docs.example.com', 'Docs'),
      heading('API Documentation'),
      paragraphWithLink('https://api.example.com', 'API')
    );
    const result = extractDocsFromAst(ast, 'repo');
    expect(result.legacy.docsLink).toBe('https://docs.example.com');
    expect(result.legacy.docsTitle).toBe('Docs');
  });

  test('uses apiDocumentation for legacy when documentation is absent', () => {
    const ast = root(
      heading('API Documentation'),
      paragraphWithLink('https://api.example.com', 'API Ref')
    );
    const result = extractDocsFromAst(ast, 'repo');
    expect(result.legacy.docsLink).toBe('https://api.example.com');
    expect(result.legacy.docsTitle).toBe('API Ref');
  });

  // ── does not double-extract (only first match wins) ──────────────────────

  test('does not overwrite documentation when a second Documentation heading is found', () => {
    const ast = root(
      heading('Documentation'),
      paragraphWithLink('https://first.example.com', 'First'),
      heading('Documentation'),
      paragraphWithLink('https://second.example.com', 'Second')
    );
    const result = extractDocsFromAst(ast, 'repo');
    expect(result.documentation.link).toBe('https://first.example.com');
  });

  // ── error handling ───────────────────────────────────────────────────────

  test('returns empty docs when ast.children throws during iteration', () => {
    const badAst = {
      get children() { throw new Error('bad ast'); },
    };
    const result = extractDocsFromAst(badAst, 'repo');
    expect(result).toEqual({
      documentation: null,
      apiDocumentation: null,
      legacy: { docsLink: null, docsTitle: null },
    });
  });
});
