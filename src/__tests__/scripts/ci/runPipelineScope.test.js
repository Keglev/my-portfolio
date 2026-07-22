/**
 * @file runPipelineScope.test.js
 * @module src/__tests__/scripts/ci/runPipelineScope
 * @testing scripts/ci/runPipelineScope.js
 * @description Contract tests for resolveChangedFiles(before, after, exec),
 * the git-diff-range resolver that feeds resolveScope(). ci.yml's
 * start-deploy-stage job cannot guarantee the `before` SHA is reachable
 * (new branch: before is the all-zero SHA; force-push: before was
 * rewritten out of history), so this module must fail safe rather than
 * fail closed.
 *
 * Contract:
 * - Given a `before` SHA that is present in history, returns the
 *   `git diff --name-only` file list between before and after.
 * - Given the all-zero SHA (new branch, no prior commit), returns null —
 *   the caller must treat null as "diff unavailable, run everything".
 * - Given a `before` SHA that git cannot resolve (force-push rewrote
 *   history), returns null for the same reason, rather than throwing.
 * - Never silently skips downstream work: null is the only "unknown"
 *   signal, and the caller (runPipelineScope's CLI) maps null to all
 *   scope flags true rather than all false.
 */
import fs from 'node:fs';
import {
  resolveChangedFiles,
  resolveScopeForRange,
  runCli,
} from '../../../../scripts/ci/runPipelineScope.js';

describe('runPipelineScope', () => {
  describe('resolveChangedFiles', () => {
    it('should return the diffed file list when before is reachable', () => {
      const exec = vi.fn()
        .mockReturnValueOnce('') // git cat-file -e <before>
        .mockReturnValueOnce('src/App.js\nsrc/index.js\n'); // git diff --name-only

      const result = resolveChangedFiles('abc123', 'def456', exec);

      expect(result).toEqual(['src/App.js', 'src/index.js']);
      expect(exec).toHaveBeenCalledWith(expect.stringContaining('cat-file -e abc123'));
      expect(exec).toHaveBeenCalledWith(expect.stringContaining('diff --name-only abc123 def456'));
    });

    it('should return null when before is the all-zero SHA', () => {
      const exec = vi.fn();

      const result = resolveChangedFiles('0'.repeat(40), 'def456', exec);

      expect(result).toBeNull();
      expect(exec).not.toHaveBeenCalled();
    });

    it('should return null when before is missing or empty', () => {
      const exec = vi.fn();

      const result = resolveChangedFiles('', 'def456', exec);

      expect(result).toBeNull();
      expect(exec).not.toHaveBeenCalled();
    });

    it('should return null when git cat-file cannot find before (force-push rewrote history)', () => {
      const exec = vi.fn(() => {
        throw new Error('fatal: Not a valid object name abc123');
      });

      const result = resolveChangedFiles('abc123', 'def456', exec);

      expect(result).toBeNull();
    });

    it('should return null when git diff itself fails after cat-file succeeds', () => {
      const exec = vi.fn()
        .mockReturnValueOnce('') // git cat-file -e <before> succeeds
        .mockImplementationOnce(() => { throw new Error('fatal: bad revision'); });

      const result = resolveChangedFiles('abc123', 'def456', exec);

      expect(result).toBeNull();
    });

    it('should filter out blank lines when the diff output contains them', () => {
      const exec = vi.fn()
        .mockReturnValueOnce('')
        .mockReturnValueOnce('src/App.js\n\n\nsrc/index.js\n');

      const result = resolveChangedFiles('abc123', 'def456', exec);

      expect(result).toEqual(['src/App.js', 'src/index.js']);
    });
  });

  describe('resolveScopeForRange', () => {
    it('should resolve normal scope flags when the diff is available', () => {
      const exec = vi.fn()
        .mockReturnValueOnce('')
        .mockReturnValueOnce('docs/index.md\n');

      const scope = resolveScopeForRange('abc123', 'def456', exec);

      expect(scope).toEqual({ coverage: false, archDocs: true, deploy: false });
    });

    it('should force every flag true when the diff is unavailable', () => {
      const exec = vi.fn(() => {
        throw new Error('fatal: bad revision');
      });

      const scope = resolveScopeForRange('abc123', 'def456', exec);

      expect(scope).toEqual({ coverage: true, archDocs: true, deploy: true });
    });
  });

  describe('runCli', () => {
    // Every case below drives the fail-safe path by leaving the `before`
    // argument off argv. That short-circuits resolveChangedFiles before it
    // shells out, so these tests never invoke real git and stay deterministic
    // regardless of the checkout's history.
    //
    // fs is spied rather than vi.mock'd because the module resolves it
    // through a CommonJS require, which vi.mock does not intercept.
    let appendFileSync;
    let originalArgv;

    beforeEach(() => {
      originalArgv = process.argv;
      appendFileSync = vi.spyOn(fs, 'appendFileSync').mockImplementation(() => {});
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      process.argv = originalArgv;
      vi.restoreAllMocks();
      vi.unstubAllEnvs();
    });

    it('should write every flag true to $GITHUB_OUTPUT when no before SHA is supplied', () => {
      // The fail-safe contract, end to end: an unresolvable range must run
      // the whole downstream pipeline rather than silently skip it.
      process.argv = ['node', 'runPipelineScope.js'];
      vi.stubEnv('GITHUB_OUTPUT', '/tmp/gh-output');

      runCli();

      const [target, written] = appendFileSync.mock.calls[0];
      expect(target).toBe('/tmp/gh-output');
      expect(written).toContain('coverage=true');
      expect(written).toContain('archDocs=true');
      expect(written).toContain('deploy=true');
    });

    it('should treat the all-zero before SHA as unresolvable and flag everything true', () => {
      // github.event.before is all zeros on a brand-new branch.
      process.argv = ['node', 'runPipelineScope.js', '0'.repeat(40), 'def456'];
      vi.stubEnv('GITHUB_OUTPUT', '/tmp/gh-output');

      runCli();

      expect(appendFileSync.mock.calls[0][1]).toContain('deploy=true');
    });

    it('should terminate the appended block with a newline so a later append cannot join onto it', () => {
      process.argv = ['node', 'runPipelineScope.js'];
      vi.stubEnv('GITHUB_OUTPUT', '/tmp/gh-output');

      runCli();

      expect(appendFileSync.mock.calls[0][1].endsWith('\n')).toBe(true);
    });

    it('should print the flags to stdout when $GITHUB_OUTPUT is not set', () => {
      process.argv = ['node', 'runPipelineScope.js'];
      vi.stubEnv('GITHUB_OUTPUT', '');

      runCli();

      expect(appendFileSync).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('deploy=true');
    });
  });
});
