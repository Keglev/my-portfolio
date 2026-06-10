/*
 * Tests for fetchPinned.js
 * Covers: GraphQL query execution, Repository/Gist filtering, meta.json caching,
 * no-TOKEN local-dev fallback, error handling, and github.io link conversion.
 */
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(() => false),
  mkdirSync: jest.fn(),
}));
jest.mock('../../../scripts/lib/fetchGithub', () => ({ runGraphQL: jest.fn() }));
jest.mock('../../../scripts/lib/parseReadme', () => jest.fn());
jest.mock('../../../scripts/lib/media/mediaDownloader', () => ({ ensureDir: jest.fn() }));
jest.mock('../../../scripts/lib/translation', () => ({
  shouldTranslateUI: jest.fn(() => false),
  translateWithCache: jest.fn(async () => ({ text: null })),
}));
jest.mock('../../../scripts/lib/pipeline/nodeProcessor', () => ({
  processNode: jest.fn(async (node) => node),
}));
jest.mock('../../../scripts/lib/normalize/normalize', () => ({
  normalizeRepoDocsLinks: jest.fn(),
}));
jest.mock('../../../scripts/lib/normalize/githubIoPreferer', () => ({
  tryGithubIo: jest.fn(async () => null),
  applyGithubIoToNode: jest.fn(async () => {}),
}));
jest.mock('../../../scripts/lib/output/writeProjects', () => ({
  writeProjectsJson: jest.fn(),
}));

describe('fetchPinned', () => {
  let exitSpy;

  beforeEach(() => {
    jest.resetModules();
    delete process.env.GH_PROJECTS_TOKEN;
    delete process.env.GITHUB_TOKEN;
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function loadModule() {
    return require('../../../scripts/lib/fetchPinned').fetchPinned;
  }

  function setupNoToken(nodes) {
    const fs = require('fs');
    fs.readFileSync.mockReturnValue(JSON.stringify(nodes));
    return loadModule();
  }

  function setupWithToken(token, nodes) {
    process.env.GH_PROJECTS_TOKEN = token;
    const fetchPinned = loadModule();
    const fetchGithub = require('../../../scripts/lib/fetchGithub');
    fetchGithub.runGraphQL.mockResolvedValue(nodes);
    return fetchPinned;
  }

  // ─── fetchGraphQL: no-token branch ───────────────────────────────────────

  describe('fetchGraphQL – no token', () => {
    test('reads existing projects.json and runs the pipeline', async () => {
      const nodes = [{ __typename: 'Repository', name: 'repo1' }];
      const fetchPinned = setupNoToken(nodes);
      const fs = require('fs');

      await fetchPinned();

      expect(fs.readFileSync).toHaveBeenCalled();
      expect(exitSpy).not.toHaveBeenCalled();
    });

    test('calls process.exit(3) when file read throws', async () => {
      const fs = require('fs');
      fs.readFileSync.mockImplementation(() => { throw new Error('ENOENT'); });
      const fetchPinned = loadModule();

      await fetchPinned();

      expect(exitSpy).toHaveBeenCalledWith(3);
      expect(console.error).toHaveBeenCalled();
    });

    test('calls process.exit(3) when parsed file is not an array', async () => {
      const fs = require('fs');
      fs.readFileSync.mockReturnValue(JSON.stringify({ not: 'an array' }));
      const fetchPinned = loadModule();

      await fetchPinned();

      expect(exitSpy).toHaveBeenCalledWith(3);
    });
  });

  // ─── fetchGraphQL: token branch ──────────────────────────────────────────

  describe('fetchGraphQL – with token', () => {
    test('calls fetchGithub.runGraphQL with the token and login keglev', async () => {
      const nodes = [{ __typename: 'Repository', name: 'repo1' }];
      const fetchPinned = setupWithToken('ghp_testtoken', nodes);
      const fetchGithub = require('../../../scripts/lib/fetchGithub');

      await fetchPinned();

      expect(fetchGithub.runGraphQL).toHaveBeenCalledWith(
        'ghp_testtoken',
        expect.any(String),
        { login: 'keglev' }
      );
    });

    test('calls process.exit(3) when runGraphQL returns a non-array', async () => {
      process.env.GH_PROJECTS_TOKEN = 'ghp_testtoken';
      const fetchPinned = loadModule();
      const fetchGithub = require('../../../scripts/lib/fetchGithub');
      fetchGithub.runGraphQL.mockResolvedValue({ nodes: [] });

      await fetchPinned();

      expect(exitSpy).toHaveBeenCalledWith(3);
    });
  });

  // ─── node processing ─────────────────────────────────────────────────────

  describe('node processing', () => {
    test('calls ensureDir on the media root', async () => {
      const nodes = [{ __typename: 'Repository', name: 'repo1' }];
      const fetchPinned = setupNoToken(nodes);
      const mediaDownloader = require('../../../scripts/lib/media/mediaDownloader');

      await fetchPinned();

      expect(mediaDownloader.ensureDir).toHaveBeenCalled();
    });

    test('only passes Repository-typed nodes to nodeProcessor', async () => {
      const nodes = [
        { __typename: 'Repository', name: 'repo1' },
        { __typename: 'Gist', name: 'gist1' },
        { __typename: 'Repository', name: 'repo2' },
      ];
      const fetchPinned = setupNoToken(nodes);
      const nodeProcessor = require('../../../scripts/lib/pipeline/nodeProcessor');

      await fetchPinned();

      expect(nodeProcessor.processNode).toHaveBeenCalledTimes(2);
      const calledNames = nodeProcessor.processNode.mock.calls.map((c) => c[0].name);
      expect(calledNames).toContain('repo1');
      expect(calledNames).toContain('repo2');
      expect(calledNames).not.toContain('gist1');
    });

    test('passes expected services to nodeProcessor', async () => {
      const nodes = [{ __typename: 'Repository', name: 'repo1' }];
      const fetchPinned = setupNoToken(nodes);
      const nodeProcessor = require('../../../scripts/lib/pipeline/nodeProcessor');

      await fetchPinned();

      const services = nodeProcessor.processNode.mock.calls[0][1];
      expect(typeof services.getAxios).toBe('function');
      expect(typeof services.MEDIA_ROOT).toBe('string');
      expect(typeof services.parseReadme).toBe('function');
      expect(typeof services.translateWithCache).toBe('function');
      expect(typeof services.shouldTranslateUI).toBe('function');
    });

    test('continues pipeline even when processNode throws for a node', async () => {
      const nodes = [{ __typename: 'Repository', name: 'repo1' }];
      const fetchPinned = setupNoToken(nodes);
      const nodeProcessor = require('../../../scripts/lib/pipeline/nodeProcessor');
      nodeProcessor.processNode.mockRejectedValue(new Error('processing failed'));
      const writer = require('../../../scripts/lib/output/writeProjects');

      await fetchPinned();

      expect(writer.writeProjectsJson).toHaveBeenCalled();
      expect(exitSpy).not.toHaveBeenCalled();
    });

    test('calls normalizeRepoDocsLinks for each node', async () => {
      const nodes = [
        { __typename: 'Repository', name: 'repo1' },
        { __typename: 'Repository', name: 'repo2' },
      ];
      const fetchPinned = setupNoToken(nodes);
      const { normalizeRepoDocsLinks } = require('../../../scripts/lib/normalize/normalize');

      await fetchPinned();

      expect(normalizeRepoDocsLinks).toHaveBeenCalledTimes(2);
    });

    test('writes output via writeProjectsJson with correct path', async () => {
      const nodes = [{ __typename: 'Repository', name: 'repo1' }];
      const fetchPinned = setupNoToken(nodes);
      const writer = require('../../../scripts/lib/output/writeProjects');

      await fetchPinned();

      expect(writer.writeProjectsJson).toHaveBeenCalledWith(
        expect.stringContaining('projects.json'),
        nodes
      );
    });

    test('calls process.exit(3) when writeProjectsJson throws', async () => {
      const nodes = [{ __typename: 'Repository', name: 'repo1' }];
      const fetchPinned = setupNoToken(nodes);
      const writer = require('../../../scripts/lib/output/writeProjects');
      writer.writeProjectsJson.mockImplementation(() => { throw new Error('disk full'); });

      await fetchPinned();

      expect(exitSpy).toHaveBeenCalledWith(3);
    });
  });

  // ─── github.io post-processing (tryGithubIo) ─────────────────────────────

  describe('github.io post-processing', () => {
    test('calls applyGithubIoToNode for each repository node', async () => {
      const nodes = [{
        __typename: 'Repository',
        name: 'repo1',
        docsLink: 'https://raw.githubusercontent.com/keglev/repo1/main/docs/index.html',
      }];
      const fetchPinned = setupNoToken(nodes);
      const { applyGithubIoToNode } = require('../../../scripts/lib/normalize/githubIoPreferer');

      await fetchPinned();

      expect(applyGithubIoToNode).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'repo1' }),
        expect.any(Function),
        expect.anything()
      );
    });

    test('does not call tryGithubIo when docsLink has no raw.githubusercontent.com', async () => {
      const nodes = [{
        __typename: 'Repository',
        name: 'repo1',
        docsLink: 'https://keglev.github.io/repo1/docs',
      }];
      const fetchPinned = setupNoToken(nodes);
      const { tryGithubIo } = require('../../../scripts/lib/normalize/githubIoPreferer');

      await fetchPinned();

      expect(tryGithubIo).not.toHaveBeenCalled();
    });

    test('updates docsLink when tryGithubIo returns a preferred URL', async () => {
      const nodes = [{
        __typename: 'Repository',
        name: 'repo1',
        docsLink: 'https://raw.githubusercontent.com/keglev/repo1/main/docs/index.html',
      }];
      const fetchPinned = setupNoToken(nodes);
      const { tryGithubIo } = require('../../../scripts/lib/normalize/githubIoPreferer');
      tryGithubIo.mockResolvedValue('https://keglev.github.io/repo1/docs/index.html');
      const writer = require('../../../scripts/lib/output/writeProjects');

      await fetchPinned();

      const written = writer.writeProjectsJson.mock.calls[0][1];
      expect(written[0].docsLink).toBe('https://keglev.github.io/repo1/docs/index.html');
    });

    test('calls applyGithubIoToNode for nodes with repoDocs raw links', async () => {
      const nodes = [{
        __typename: 'Repository',
        name: 'repo1',
        repoDocs: {
          apiDocumentation: {
            link: 'https://raw.githubusercontent.com/keglev/repo1/main/docs/api.html',
          },
        },
      }];
      const fetchPinned = setupNoToken(nodes);
      const { applyGithubIoToNode } = require('../../../scripts/lib/normalize/githubIoPreferer');

      await fetchPinned();

      expect(applyGithubIoToNode).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'repo1' }),
        expect.any(Function),
        expect.anything()
      );
    });
  });

  // ─── convertToGhPages (inline fn, tested via written output) ─────────────

  describe('convertToGhPages', () => {
    async function runAndGetWrittenNodes(nodes) {
      const fetchPinned = setupNoToken(nodes);
      const writer = require('../../../scripts/lib/output/writeProjects');
      await fetchPinned();
      return writer.writeProjectsJson.mock.calls[0][1];
    }

    test('converts raw.githubusercontent.com docs link to github.io URL', async () => {
      const nodes = [{
        __typename: 'Repository',
        name: 'my-repo',
        repoDocs: {
          apiDocumentation: {
            link: 'https://raw.githubusercontent.com/keglev/my-repo/main/docs/api.html',
          },
        },
      }];
      const written = await runAndGetWrittenNodes(nodes);
      expect(written[0].repoDocs.apiDocumentation.link).toBe(
        'https://keglev.github.io/my-repo/docs/api.html'
      );
    });

    test('does not convert .md files in raw.githubusercontent.com links', async () => {
      const originalLink = 'https://raw.githubusercontent.com/keglev/my-repo/main/docs/README.md';
      const nodes = [{
        __typename: 'Repository',
        name: 'my-repo',
        repoDocs: { apiDocumentation: { link: originalLink } },
      }];
      const written = await runAndGetWrittenNodes(nodes);
      expect(written[0].repoDocs.apiDocumentation.link).toBe(originalLink);
    });

    test('converts github.com blob docs link to github.io URL', async () => {
      const nodes = [{
        __typename: 'Repository',
        name: 'my-repo',
        repoDocs: {
          apiDocumentation: {
            link: 'https://github.com/keglev/my-repo/blob/main/docs/api.html',
          },
        },
      }];
      const written = await runAndGetWrittenNodes(nodes);
      expect(written[0].repoDocs.apiDocumentation.link).toBe(
        'https://keglev.github.io/my-repo/docs/api.html'
      );
    });

    test('does not convert .md files in github.com blob links', async () => {
      const originalLink = 'https://github.com/keglev/my-repo/blob/main/docs/README.md';
      const nodes = [{
        __typename: 'Repository',
        name: 'my-repo',
        repoDocs: { apiDocumentation: { link: originalLink } },
      }];
      const written = await runAndGetWrittenNodes(nodes);
      expect(written[0].repoDocs.apiDocumentation.link).toBe(originalLink);
    });

    test('does not convert links that do not match any pattern', async () => {
      const originalLink = 'https://some-other-host.com/docs/page';
      const nodes = [{
        __typename: 'Repository',
        name: 'my-repo',
        repoDocs: { apiDocumentation: { link: originalLink } },
      }];
      const written = await runAndGetWrittenNodes(nodes);
      expect(written[0].repoDocs.apiDocumentation.link).toBe(originalLink);
    });

    test('converts architectureOverview link', async () => {
      const nodes = [{
        __typename: 'Repository',
        name: 'my-repo',
        repoDocs: {
          architectureOverview: {
            link: 'https://raw.githubusercontent.com/keglev/my-repo/main/docs/architecture.html',
          },
        },
      }];
      const written = await runAndGetWrittenNodes(nodes);
      expect(written[0].repoDocs.architectureOverview.link).toBe(
        'https://keglev.github.io/my-repo/docs/architecture.html'
      );
    });

    test('converts testing.testingDocs link', async () => {
      const nodes = [{
        __typename: 'Repository',
        name: 'my-repo',
        repoDocs: {
          testing: {
            testingDocs: {
              link: 'https://raw.githubusercontent.com/keglev/my-repo/main/docs/testing.html',
            },
          },
        },
      }];
      const written = await runAndGetWrittenNodes(nodes);
      expect(written[0].repoDocs.testing.testingDocs.link).toBe(
        'https://keglev.github.io/my-repo/docs/testing.html'
      );
    });

    test('converts top-level docsLink with api path', async () => {
      const nodes = [{
        __typename: 'Repository',
        name: 'my-repo',
        docsLink: 'https://raw.githubusercontent.com/keglev/my-repo/main/api/swagger.html',
      }];
      const written = await runAndGetWrittenNodes(nodes);
      expect(written[0].docsLink).toBe(
        'https://keglev.github.io/my-repo/api/swagger.html'
      );
    });
  });
});
