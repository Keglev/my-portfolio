const { toRawGithub, normalizeRepoDocsLinks } = require('../../../../scripts/lib/normalize/normalize');
 
describe('toRawGithub', () => {
  test('returns href unchanged if falsy', () => {
    expect(toRawGithub(null, 'repo')).toBeNull();
    expect(toRawGithub('', 'repo')).toBe('');
  });
 
  test('returns absolute URL unchanged', () => {
    const url = 'https://example.com/docs/index.html';
    expect(toRawGithub(url, 'repo')).toBe(url);
  });
 
  test('converts relative path to raw.githubusercontent URL', () => {
    const result = toRawGithub('docs/api.md', 'my-repo');
    expect(result).toBe('https://raw.githubusercontent.com/keglev/my-repo/main/docs/api.md');
  });
 
  test('strips leading ./ from relative path', () => {
    const result = toRawGithub('./docs/api.md', 'my-repo');
    expect(result).toBe('https://raw.githubusercontent.com/keglev/my-repo/main/docs/api.md');
  });
 
  test('strips leading / from relative path', () => {
    const result = toRawGithub('/docs/api.md', 'my-repo');
    expect(result).toBe('https://raw.githubusercontent.com/keglev/my-repo/main/docs/api.md');
  });
});
 
describe('normalizeRepoDocsLinks', () => {
  test('returns node unchanged if node is null', () => {
    expect(normalizeRepoDocsLinks(null)).toBeNull();
  });
 
  test('returns node unchanged if node has no repoDocs', () => {
    const node = { name: 'repo' };
    expect(normalizeRepoDocsLinks(node)).toBe(node);
  });
 
  test('normalizes architectureOverview link', () => {
    const node = {
      name: 'my-repo',
      repoDocs: { architectureOverview: { link: 'docs/architecture.md' } },
    };
    normalizeRepoDocsLinks(node);
    expect(node.repoDocs.architectureOverview.link).toBe(
      'https://raw.githubusercontent.com/keglev/my-repo/main/docs/architecture.md'
    );
  });
 
  test('normalizes apiDocumentation link', () => {
    const node = {
      name: 'my-repo',
      repoDocs: { apiDocumentation: { link: 'docs/api.md' } },
    };
    normalizeRepoDocsLinks(node);
    expect(node.repoDocs.apiDocumentation.link).toBe(
      'https://raw.githubusercontent.com/keglev/my-repo/main/docs/api.md'
    );
  });
 
  test('normalizes testing.testingDocs link', () => {
    const node = {
      name: 'my-repo',
      repoDocs: { testing: { testingDocs: { link: 'docs/testing.md' } } },
    };
    normalizeRepoDocsLinks(node);
    expect(node.repoDocs.testing.testingDocs.link).toBe(
      'https://raw.githubusercontent.com/keglev/my-repo/main/docs/testing.md'
    );
  });
 
  test('leaves absolute links untouched inside repoDocs', () => {
    const url = 'https://raw.githubusercontent.com/keglev/my-repo/main/docs/api.md';
    const node = {
      name: 'my-repo',
      repoDocs: { apiDocumentation: { link: url } },
    };
    normalizeRepoDocsLinks(node);
    expect(node.repoDocs.apiDocumentation.link).toBe(url);
  });
 
  test('normalizes all three links together', () => {
    const node = {
      name: 'my-repo',
      repoDocs: {
        architectureOverview: { link: 'docs/arch.md' },
        apiDocumentation: { link: 'docs/api.md' },
        testing: { testingDocs: { link: 'docs/test.md' } },
      },
    };
    normalizeRepoDocsLinks(node);
    expect(node.repoDocs.architectureOverview.link).toContain('raw.githubusercontent.com');
    expect(node.repoDocs.apiDocumentation.link).toContain('raw.githubusercontent.com');
    expect(node.repoDocs.testing.testingDocs.link).toContain('raw.githubusercontent.com');
  });
});
