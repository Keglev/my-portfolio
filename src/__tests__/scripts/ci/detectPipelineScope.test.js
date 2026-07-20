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
const { resolveScope } = require('../../../../scripts/ci/detectPipelineScope');

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
  });
});
