/**
 * @file detectPipelineScope.test.js
 * @module src/__tests__/scripts/ci/detectPipelineScope
 * @testing scripts/ci/detectPipelineScope.js
 * @description Contract tests for resolveScope(changedFiles), the pure
 * function that maps a push diff's changed file paths to
 * { apiDocs, coverage, archDocs, deploy } so ci.yml can decide which
 * downstream workflows to dispatch without over- or under-triggering
 * JSDoc/coverage/architecture-doc regeneration.
 *
 * Contract:
 * - apiDocs: true when the exported API surface could have changed — any
 *   path under src/** (excluding src/__tests__/**), or the jsdoc.json
 *   config file. scripts/lib/** was in this contract until the P1
 *   build-time-fetch retirement deleted that directory outright; the
 *   path class no longer exists, so resolveScope no longer checks it.
 * - coverage: true whenever apiDocs is true, OR any src/__tests__/** path
 *   changed (a test-only change still invalidates the coverage report but
 *   does not require a JSDoc rebuild).
 * - archDocs: true when any path under docs/** or scripts/docs/** changed.
 * - deploy: true when at least one changed file is not a pure
 *   documentation path (docs/** or scripts/docs/**). An empty change list
 *   deploys nothing.
 *
 * Out of scope: the GitHub Actions CLI entry point (stdin/argument parsing,
 * $GITHUB_OUTPUT writing) is covered separately once scripts/ci/
 * detectPipelineScope.js grows a CLI wrapper around this pure function.
 */
import fs from 'node:fs';
import { resolveScope, runCli } from '../../../../scripts/ci/detectPipelineScope.js';

describe('detectPipelineScope', () => {
  describe('resolveScope', () => {
    it('should flag apiDocs, coverage and deploy but not archDocs when only src/** non-test files change', () => {
      const changedFiles = ['src/components/Projects/ProjectCard.js'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ apiDocs: true, coverage: true, archDocs: false, deploy: true });
    });

    it('should flag only coverage and deploy when only src/__tests__/** files change', () => {
      const changedFiles = ['src/__tests__/components/ProjectCard.test.js'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ apiDocs: false, coverage: true, archDocs: false, deploy: true });
    });

    it('should flag only archDocs when only docs/** files change', () => {
      const changedFiles = ['docs/architecture/overview.md'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ apiDocs: false, coverage: false, archDocs: true, deploy: false });
    });

    it('should flag only archDocs when only scripts/docs/** template files change', () => {
      const changedFiles = ['scripts/docs/templates/hub.html'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ apiDocs: false, coverage: false, archDocs: true, deploy: false });
    });

    it('should flag every dimension when a mixed change touches both src/** and docs/**', () => {
      const changedFiles = ['src/components/Projects/ProjectCard.js', 'docs/index.md'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ apiDocs: true, coverage: true, archDocs: true, deploy: true });
    });

    it('should flag only deploy when a workflow file outside docs/** changes', () => {
      const changedFiles = ['.github/workflows/ci.yml'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ apiDocs: false, coverage: false, archDocs: false, deploy: true });
    });

    it('should flag nothing when the changed file list is empty', () => {
      const changedFiles = [];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ apiDocs: false, coverage: false, archDocs: false, deploy: false });
    });

    it('should flag apiDocs, coverage and deploy when jsdoc.json changes', () => {
      const changedFiles = ['jsdoc.json'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ apiDocs: true, coverage: true, archDocs: false, deploy: true });
    });

    it('should flag only deploy when package.json changes without any src/** or docs/** change', () => {
      const changedFiles = ['package.json'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ apiDocs: false, coverage: false, archDocs: false, deploy: true });
    });

    // The Vite migration added vite.config.js and moved index.html to the repo
    // root. Both are build inputs: a change to either can alter the deployed
    // bundle but cannot alter the documented API surface or test coverage, so
    // they must classify exactly like package.json. resolveScope needed no
    // change to achieve this (neither path is under docs/, so the catch-all
    // deploy rule already covers them) -- these cases exist to keep it that
    // way if the prefix rules are ever rewritten.
    it('should flag only deploy when vite.config.js changes without any src/** or docs/** change', () => {
      const changedFiles = ['vite.config.js'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ apiDocs: false, coverage: false, archDocs: false, deploy: true });
    });

    it('should flag only deploy when the root index.html build entry changes', () => {
      const changedFiles = ['index.html'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ apiDocs: false, coverage: false, archDocs: false, deploy: true });
    });
  });

  describe('runCli', () => {
    // fs is spied rather than vi.mock'd: the module resolves fs through a
    // CommonJS require, which vi.mock does not intercept. Spying mutates the
    // shared builtin object both sides already hold, so the interception is
    // real. See chapter 08c's troubleshooting notes.
    let readFileSync;
    let appendFileSync;

    beforeEach(() => {
      readFileSync = vi.spyOn(fs, 'readFileSync');
      appendFileSync = vi.spyOn(fs, 'appendFileSync').mockImplementation(() => {});
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllEnvs();
    });

    it('should append every resolved flag to $GITHUB_OUTPUT when the variable is set', () => {
      readFileSync.mockReturnValue('src/App.jsx\n');
      vi.stubEnv('GITHUB_OUTPUT', '/tmp/gh-output');

      runCli();

      const [target, written] = appendFileSync.mock.calls[0];
      expect(target).toBe('/tmp/gh-output');
      expect(written).toContain('apiDocs=true');
      expect(written).toContain('coverage=true');
      expect(written).toContain('archDocs=false');
      expect(written).toContain('deploy=true');
    });

    it('should terminate the appended block with a newline so a later append cannot join onto it', () => {
      // GITHUB_OUTPUT is append-only and shared by every step in the job; a
      // missing trailing newline silently merges this step's last flag with
      // the next step's first one.
      readFileSync.mockReturnValue('docs/index.md\n');
      vi.stubEnv('GITHUB_OUTPUT', '/tmp/gh-output');

      runCli();

      expect(appendFileSync.mock.calls[0][1].endsWith('\n')).toBe(true);
    });

    it('should print the flags to stdout when $GITHUB_OUTPUT is not set', () => {
      // The local-run fallback: the script stays usable outside Actions.
      readFileSync.mockReturnValue('docs/index.md\n');
      vi.stubEnv('GITHUB_OUTPUT', '');

      runCli();

      expect(appendFileSync).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('archDocs=true');
    });

    it('should trim entries and drop blank lines when parsing the stdin file list', () => {
      // `git diff --name-only` output ends with a trailing newline, which
      // would otherwise resolve as an empty-string path.
      readFileSync.mockReturnValue('  src/App.jsx  \n\n\ndocs/index.md\n');
      vi.stubEnv('GITHUB_OUTPUT', '/tmp/gh-output');

      runCli();

      const written = appendFileSync.mock.calls[0][1];
      expect(written).toContain('apiDocs=true');
      expect(written).toContain('archDocs=true');
    });

    it('should read the changed-file list from stdin', () => {
      readFileSync.mockReturnValue('src/App.jsx\n');
      vi.stubEnv('GITHUB_OUTPUT', '/tmp/gh-output');

      runCli();

      expect(readFileSync).toHaveBeenCalledWith(0, 'utf8');
    });

    it('should resolve every flag false when stdin is empty', () => {
      readFileSync.mockReturnValue('');
      vi.stubEnv('GITHUB_OUTPUT', '/tmp/gh-output');

      runCli();

      const written = appendFileSync.mock.calls[0][1];
      expect(written).toContain('deploy=false');
      expect(written).toContain('apiDocs=false');
    });
  });
});
