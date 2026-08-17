/**
 * @file detectPipelineScope.test.js
 * @module src/__tests__/scripts/ci/detectPipelineScope
 * @testing scripts/ci/detectPipelineScope.js
 * @description Contract tests for resolveScope(changedFiles), the pure
 * function that maps a push diff's changed file paths to
 * { coverage, deploy } so ci.yml can decide which downstream workflows to
 * dispatch without over- or under-triggering coverage publishing or a
 * production deploy.
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
 * - deploy: true when at least one changed file is not a pure
 *   documentation path (docs/** or scripts/docs/**). An empty change list
 *   deploys nothing. An archDocs flag once sat beside these two; it was
 *   removed because no workflow consumed it (architecture-docs.yml
 *   self-triggers on its own docs/** paths).
 *
 * Out of scope: resolveScope has no CLI of its own. The argv-driven entry
 * that ci.yml actually invokes, and its $GITHUB_OUTPUT emit contract, live
 * in runPipelineScope.js and are tested in runPipelineScope.test.js.
 */
import { resolveScope } from '../../../../scripts/ci/detectPipelineScope.js';

describe('detectPipelineScope', () => {
  describe('resolveScope', () => {
    it('should flag coverage and deploy when only src/** non-test files change', () => {
      const changedFiles = ['src/components/Projects/ProjectCard.js'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ coverage: true, deploy: true });
    });

    it('should flag coverage and deploy when only src/__tests__/** files change', () => {
      const changedFiles = ['src/__tests__/components/ProjectCard.test.js'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ coverage: true, deploy: true });
    });

    it('should flag neither coverage nor deploy when only docs/** files change', () => {
      const changedFiles = ['docs/architecture/overview.md'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ coverage: false, deploy: false });
    });

    it('should flag neither coverage nor deploy when only scripts/docs/** template files change', () => {
      const changedFiles = ['scripts/docs/templates/hub.html'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ coverage: false, deploy: false });
    });

    it('should flag every dimension when a mixed change touches both src/** and docs/**', () => {
      const changedFiles = ['src/components/Projects/ProjectCard.js', 'docs/index.md'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ coverage: true, deploy: true });
    });

    it('should flag only deploy when a workflow file outside docs/** changes', () => {
      const changedFiles = ['.github/workflows/ci.yml'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ coverage: false, deploy: true });
    });

    it('should flag nothing when the changed file list is empty', () => {
      const changedFiles = [];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ coverage: false, deploy: false });
    });

    // jsdoc.json used to trigger coverage through the codeRef flag. The file
    // is gone with the code reference, so a root config file outside src/
    // now classifies like package.json: deploy only.
    it('should flag only deploy when a root config file outside src/ changes', () => {
      const changedFiles = ['vercel.json'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ coverage: false, deploy: true });
    });

    it('should flag only deploy when package.json changes without any src/** or docs/** change', () => {
      const changedFiles = ['package.json'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ coverage: false, deploy: true });
    });

    // The lockfile is what `npm ci` installs from, so a dependency bump that
    // touches only package-lock.json still changes the deployed bundle. It
    // must classify like package.json, not fall through to "nothing to do".
    it('should flag only deploy when package-lock.json changes on its own', () => {
      const changedFiles = ['package-lock.json'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ coverage: false, deploy: true });
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

      expect(scope).toEqual({ coverage: false, deploy: true });
    });

    it('should flag only deploy when the root index.html build entry changes', () => {
      const changedFiles = ['index.html'];

      const scope = resolveScope(changedFiles);

      expect(scope).toEqual({ coverage: false, deploy: true });
    });
  });
});
