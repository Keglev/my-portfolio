// Verifies postprocessProjects: normalizeTech token splitting and cleaning,
// tryGithubIo GitHub Pages probing, docsLink/docsTitle backfill and bad-title
// replacement, technology deduplication, and all branches in main().
jest.mock('fs');
jest.mock('axios');

const fs = require('fs');
const axios = require('axios');

// Prevent the require.main guard from running and block file-system reads at
// module load time by stubbing existsSync before the module is required.
fs.existsSync.mockReturnValue(true);
fs.readFileSync.mockReturnValue('[]');
fs.writeFileSync.mockImplementation(() => {});

const { tryGithubIo, normalizeTech, main } = require('../../../scripts/postprocessProjects');

// ── normalizeTech ────────────────────────────────────────────────────────────

describe('normalizeTech', () => {
  test('returns null for null / undefined / empty', () => {
    expect(normalizeTech(null)).toBeNull();
    expect(normalizeTech(undefined)).toBeNull();
    expect(normalizeTech('')).toBeNull();
  });

  test('returns a single-element array for a plain token', () => {
    expect(normalizeTech('React')).toEqual(['React']);
  });

  test('strips markdown bold markers', () => {
    expect(normalizeTech('**Node.js**')).toEqual(['Node.js']);
  });

  test('removes trailing "for ..." descriptor', () => {
    expect(normalizeTech('Jest for testing')).toEqual(['Jest']);
  });

  test('removes inline parenthetical content', () => {
    expect(normalizeTech('TypeScript (v5)')).toEqual(['TypeScript']);
  });

  test('splits "React + TypeScript" into two tokens', () => {
    expect(normalizeTech('React + TypeScript')).toEqual(['React', 'TypeScript']);
  });

  test('splits on comma', () => {
    expect(normalizeTech('React, Vue')).toEqual(['React', 'Vue']);
  });

  test('splits on " and "', () => {
    expect(normalizeTech('React and Redux')).toEqual(['React', 'Redux']);
  });

  test('splits on " with "', () => {
    expect(normalizeTech('Webpack with Babel')).toEqual(['Webpack', 'Babel']);
  });

  test('strips leading/trailing punctuation from each part', () => {
    const result = normalizeTech('-React-');
    expect(result).toEqual(['React']);
  });

  test('returns null when nothing meaningful remains after cleaning', () => {
    expect(normalizeTech('---')).toBeNull();
  });
});

// ── tryGithubIo ──────────────────────────────────────────────────────────────

describe('tryGithubIo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.DEBUG_FETCH;
  });

  test('returns null for null href', async () => {
    expect(await tryGithubIo({ name: 'repo' }, null)).toBeNull();
  });

  test('returns null when href does not match raw.githubusercontent docs pattern', async () => {
    const href = 'https://example.com/not-a-raw-url';
    expect(await tryGithubIo({ name: 'repo' }, href)).toBeNull();
  });

  test('returns github.io URL when probe returns 200 HTML', async () => {
    axios.head = jest.fn(async () => ({
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    }));
    const href = 'https://raw.githubusercontent.com/keglev/repo/main/docs/index.html';
    const result = await tryGithubIo({ name: 'repo' }, href);
    expect(result).toMatch(/keglev\.github\.io\/repo/);
  });

  test('returns null when probe returns non-200 status', async () => {
    axios.head = jest.fn(async () => ({
      status: 404,
      headers: { 'content-type': 'text/html' },
    }));
    const href = 'https://raw.githubusercontent.com/keglev/repo/main/docs/guide.html';
    const result = await tryGithubIo({ name: 'repo' }, href);
    expect(result).toBeNull();
  });

  test('returns null when probe returns X-Frame-Options: deny', async () => {
    axios.head = jest.fn(async () => ({
      status: 200,
      headers: { 'content-type': 'text/html', 'x-frame-options': 'DENY' },
    }));
    const href = 'https://raw.githubusercontent.com/keglev/repo/main/docs/api.html';
    const result = await tryGithubIo({ name: 'repo' }, href);
    expect(result).toBeNull();
  });

  test('returns null when all probes throw (network error)', async () => {
    axios.head = jest.fn(async () => { throw new Error('ECONNREFUSED'); });
    const href = 'https://raw.githubusercontent.com/keglev/repo/main/docs/index.html';
    const result = await tryGithubIo({ name: 'repo' }, href);
    expect(result).toBeNull();
  });

  test('prepends bare root candidate when afterDocs is empty (index.html stripped)', async () => {
    axios.head = jest.fn(async (url) => {
      // Only the bare root candidate succeeds
      if (url === 'https://keglev.github.io/repo/') {
        return { status: 200, headers: { 'content-type': 'text/html' } };
      }
      return { status: 404, headers: {} };
    });
    const href = 'https://raw.githubusercontent.com/keglev/repo/main/docs/index.html';
    const result = await tryGithubIo({ name: 'repo' }, href);
    expect(result).toBe('https://keglev.github.io/repo/');
  });
});

// ── main (integration-level) ─────────────────────────────────────────────────

describe('main', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.writeFileSync.mockImplementation(() => {});
    axios.head = jest.fn(async () => ({ status: 404, headers: {} }));
  });

  test('writes processed nodes back to FILE', async () => {
    await main([{ name: 'repo' }]);
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
  });

  test('backfills docsLink from repoDocs.apiDocumentation when docsLink is null', async () => {
    const node = {
      name: 'repo',
      docsLink: null,
      repoDocs: { apiDocumentation: { link: 'https://api.example.com', title: 'API' } },
    };
    await main([node]);
    expect(node.docsLink).toBe('https://api.example.com');
    expect(node.docsTitle).toBe('API');
  });

  test('backfills docsLink from repoDocs.architectureOverview when apiDocumentation absent', async () => {
    const node = {
      name: 'repo',
      docsLink: null,
      repoDocs: { architectureOverview: { link: 'https://arch.example.com', title: 'Arch' } },
    };
    await main([node]);
    expect(node.docsLink).toBe('https://arch.example.com');
  });

  test('replaces bad docsTitle "open an issue" with apiDocumentation title', async () => {
    const node = {
      name: 'repo',
      docsTitle: 'Please open an issue',
      docsLink: 'https://example.com',
      repoDocs: { apiDocumentation: { title: 'API Reference', link: 'https://api.example.com' } },
    };
    await main([node]);
    expect(node.docsTitle).toBe('API Reference');
  });

  test('sets docsTitle to "Documentation" when docsTitle is bad but docsLink exists', async () => {
    const node = { name: 'repo', docsTitle: null, docsLink: 'https://example.com' };
    await main([node]);
    expect(node.docsTitle).toBe('Documentation');
  });

  test('normalizes technologies array', async () => {
    const node = { name: 'repo', technologies: ['**React**', 'TypeScript (v5)', 'Node.js and Express'] };
    await main([node]);
    expect(node.technologies).toContain('React');
    expect(node.technologies).toContain('TypeScript');
    expect(node.technologies).not.toContain('**React**');
  });

  test('deduplicates technology tokens', async () => {
    const node = { name: 'repo', technologies: ['React', 'React', 'TypeScript'] };
    await main([node]);
    expect(node.technologies.filter(t => t === 'React').length).toBe(1);
  });

  test('does not mutate technologies when it is not an array', async () => {
    const node = { name: 'repo', technologies: 'React' };
    await main([node]);
    expect(node.technologies).toBe('React');
  });

  // ── isBadTitle: node.docs fallback paths ─────────────────────────────────

  test('falls back to node.docs.apiDocumentation.title when repoDocs has no good title', async () => {
    const node = {
      name: 'repo',
      docsTitle: null,
      docsLink: 'https://example.com',
      docs: { apiDocumentation: { title: 'API Docs from docs', link: 'https://api.example.com' } },
    };
    await main([node]);
    expect(node.docsTitle).toBe('API Docs from docs');
  });

  test('falls back to node.docs.documentation.title when apiDocumentation is missing', async () => {
    const node = {
      name: 'repo',
      docsTitle: null,
      docsLink: 'https://example.com',
      docs: { documentation: { title: 'General Docs', link: 'https://docs.example.com' } },
    };
    await main([node]);
    expect(node.docsTitle).toBe('General Docs');
  });

  test('sets docsTitle to null when docsTitle is null and docsLink is also absent', async () => {
    const node = { name: 'repo', docsTitle: null, docsLink: null };
    await main([node]);
    expect(node.docsTitle).toBeNull();
  });

  // ── tryGithubIo for repoDocs.testing.testingDocs ──────────────────────────

  test('probes github.io for repoDocs.testing.testingDocs raw link', async () => {
    axios.head = jest.fn(async () => ({
      status: 200,
      headers: { 'content-type': 'text/html' },
    }));
    const node = {
      name: 'repo',
      repoDocs: {
        testing: {
          testingDocs: {
            link: 'https://raw.githubusercontent.com/keglev/repo/main/docs/testing.html',
          },
        },
      },
    };
    await main([node]);
    expect(node.repoDocs.testing.testingDocs.link).toMatch(/keglev\.github\.io\/repo/);
  });

  // ── github.io probe for node.docsLink ─────────────────────────────────────

  test('probes github.io for a raw node.docsLink and updates it when reachable', async () => {
    axios.head = jest.fn(async () => ({
      status: 200,
      headers: { 'content-type': 'text/html' },
    }));
    const node = {
      name: 'repo',
      docsLink: 'https://raw.githubusercontent.com/keglev/repo/main/docs/index.html',
    };
    await main([node]);
    expect(node.docsLink).toMatch(/keglev\.github\.io\/repo/);
  });

  test('does not mutate node.docsLink when probe returns non-200', async () => {
    axios.head = jest.fn(async () => ({ status: 404, headers: {} }));
    const node = {
      name: 'repo',
      docsLink: 'https://raw.githubusercontent.com/keglev/repo/main/docs/index.html',
    };
    const originalLink = node.docsLink;
    await main([node]);
    expect(node.docsLink).toBe(originalLink);
  });

  // ── github.io probe for repoDocs.apiDocumentation.link ────────────────────

  test('probes github.io for repoDocs.apiDocumentation.link when it is a raw URL', async () => {
    axios.head = jest.fn(async () => ({
      status: 200,
      headers: { 'content-type': 'text/html' },
    }));
    const node = {
      name: 'repo',
      repoDocs: {
        apiDocumentation: {
          link: 'https://raw.githubusercontent.com/keglev/repo/main/docs/api.html',
          title: 'API Reference',
        },
      },
    };
    await main([node]);
    expect(node.repoDocs.apiDocumentation.link).toMatch(/keglev\.github\.io\/repo/);
  });

  // ── github.io probe for repoDocs.architectureOverview.link ────────────────

  test('probes github.io for repoDocs.architectureOverview.link when it is a raw URL', async () => {
    axios.head = jest.fn(async () => ({
      status: 200,
      headers: { 'content-type': 'text/html' },
    }));
    const node = {
      name: 'repo',
      repoDocs: {
        architectureOverview: {
          link: 'https://raw.githubusercontent.com/keglev/repo/main/docs/arch.html',
          title: 'Architecture',
        },
      },
    };
    await main([node]);
    expect(node.repoDocs.architectureOverview.link).toMatch(/keglev\.github\.io\/repo/);
  });

  // ── null / undefined entries in technologies ──────────────────────────────

  test('silently skips null and undefined tokens in technologies array', async () => {
    const node = { name: 'repo', technologies: [null, undefined, 'React', ''] };
    await main([node]);
    expect(node.technologies).toEqual(['React']);
  });

  // ── repoDocs.documentation title fallback ─────────────────────────────────

  test('uses repoDocs.documentation.title as fallback when apiDocumentation is absent', async () => {
    const node = {
      name: 'repo',
      docsTitle: null,
      docsLink: 'https://example.com',
      repoDocs: { documentation: { title: 'Full Reference', link: 'https://docs.example.com' } },
    };
    await main([node]);
    expect(node.docsTitle).toBe('Full Reference');
  });

});
