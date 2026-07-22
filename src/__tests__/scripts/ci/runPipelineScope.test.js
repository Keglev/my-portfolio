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
import { resolveChangedFiles, resolveScopeForRange } from '../../../../scripts/ci/runPipelineScope.js';

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

      expect(scope).toEqual({ apiDocs: false, coverage: false, archDocs: true, deploy: false });
    });

    it('should force every flag true when the diff is unavailable', () => {
      const exec = vi.fn(() => {
        throw new Error('fatal: bad revision');
      });

      const scope = resolveScopeForRange('abc123', 'def456', exec);

      expect(scope).toEqual({ apiDocs: true, coverage: true, archDocs: true, deploy: true });
    });
  });
});
