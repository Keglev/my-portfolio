/**
 * @file detectPipelineScope.test.js
 * @module src/__tests__/scripts/ci/detectPipelineScope
 * @testing scripts/ci/detectPipelineScope.js
 * @description Contract tests for resolveScope(changedFiles), the pure
 * function that maps a push diff's changed file paths to
 * { coverage, archDocs, deploy } so ci.yml can decide which
 * downstream workflows to dispatch without over- or under-triggering
 * coverage/architecture-doc regeneration.
 *
 * Contract:
 * - coverage: true when any path under src/** changed, tests included. A
 *   codeRef flag used to split this in two — src/** minus tests, plus
 *   jsdoc.json — because the first needed a code-reference rebuild and the
 *   second did not. Coverage never made that distinction; it was true for
 *   either. Retiring the code reference (ADR-009) therefore collapses the
 *   two cases into one check rather than losing a rule. scripts/lib/** was
 *   in this contract until the P1 build-time-fetch retirement deleted that
 *   directory outright; the path class no longer exists, so resolveScope no
 *   longer checks it.
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
    it('should flag coverage and deploy but not archDocs when only src/** non-test files change', () => {
      const changedFiles = ['src/components/Projects/ProjectCard.js'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ coverage: true, archDocs: false, deploy: true });
    });

    it('should flag coverage and deploy when only src/__tests__/** files change', () => {
      const changedFiles = ['src/__tests__/components/ProjectCard.test.js'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ coverage: true, archDocs: false, deploy: true });
    });

    it('should flag only archDocs when only docs/** files change', () => {
      const changedFiles = ['docs/architecture/overview.md'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ coverage: false, archDocs: true, deploy: false });
    });

    it('should flag only archDocs when only scripts/docs/** template files change', () => {
      const changedFiles = ['scripts/docs/templates/hub.html'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ coverage: false, archDocs: true, deploy: false });
    });

    it('should flag every dimension when a mixed change touches both src/** and docs/**', () => {
      const changedFiles = ['src/components/Projects/ProjectCard.js', 'docs/index.md'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ coverage: true, archDocs: true, deploy: true });
    });

    it('should flag only deploy when a workflow file outside docs/** changes', () => {
      const changedFiles = ['.github/workflows/ci.yml'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ coverage: false, archDocs: false, deploy: true });
    });

    it('should flag nothing when the changed file list is empty', () => {
      const changedFiles = [];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ coverage: false, archDocs: false, deploy: false });
    });

    // jsdoc.json used to trigger coverage through the codeRef flag. The file
    // is gone with the code reference, so a root config file outside src/
    // now classifies like package.json: deploy only.
    it('should flag only deploy when a root config file outside src/ changes', () => {
      const changedFiles = ['vercel.json'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ coverage: false, archDocs: false, deploy: true });
    });

    it('should flag only deploy when package.json changes without any src/** or docs/** change', () => {
      const changedFiles = ['package.json'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ coverage: false, archDocs: false, deploy: true });
    });

    // The lockfile is what `npm ci` installs from, so a dependency bump that
    // touches only package-lock.json still changes the deployed bundle. It
    // must classify like package.json, not fall through to "nothing to do".
    it('should flag only deploy when package-lock.json changes on its own', () => {
      const changedFiles = ['package-lock.json'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ coverage: false, archDocs: false, deploy: true });
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

      expect(scope).toEqual({ coverage: false, archDocs: false, deploy: true });
    });

    it('should flag only deploy when the root index.html build entry changes', () => {
      const changedFiles = ['index.html'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ coverage: false, archDocs: false, deploy: true });
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
      expect(written).toContain('coverage=true');
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
      expect(written).toContain('coverage=false');
      expect(written).toContain('archDocs=false');
      expect(written).toContain('deploy=false');
    });
  });
});
