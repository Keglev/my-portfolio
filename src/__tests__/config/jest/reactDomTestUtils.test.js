/**
 * @file reactDomTestUtils.test.js
 * @module src/__tests__/config/jest/reactDomTestUtils
 * @testing config/jest/react-dom-test-utils.js
 * @description Contract tests for the react-dom/test-utils shim that
 * redirects to React's built-in act() when available, and falls back to a
 * noop when React itself cannot be required.
 *
 * Contract:
 * - When React is available: act is React's own act function (same
 *   reference), executes its callback, returns the callback's return
 *   value, and propagates a thrown/rejected error.
 * - When React is unavailable (require('react') throws): act falls back
 *   to `(cb) => cb && cb()` -- still calls the callback and returns its
 *   result, with no React-specific guarantees beyond that.
 *
 * Out of scope: React's own act() implementation; this only tests the
 * shim's re-export/fallback decision.
 */
const MODULE_PATH = '../../../../config/jest/react-dom-test-utils';

describe('react-dom-test-utils', () => {
  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  describe('when React is available', () => {
    let mod;

    beforeEach(() => {
      mod = require(MODULE_PATH);
    });

    it('should export React\'s own act function', () => {
      const React = require('react');

      expect(mod.act).toBe(React.act);
    });

    it('should export only the act property', () => {
      expect(Object.keys(mod)).toEqual(['act']);
    });

    it('should return the callback\'s value when act is called', async () => {
      const result = await mod.act(async () => 'test-result');

      expect(result).toBe('test-result');
    });

    it('should propagate a rejection when the callback throws', async () => {
      const callback = async () => { throw new Error('test error'); };

      await expect(mod.act(callback)).rejects.toThrow('test error');
    });

    it('should return the same act reference on repeated requires', () => {
      const modAgain = require(MODULE_PATH);

      expect(modAgain.act).toBe(mod.act);
    });
  });

  describe('when React is unavailable', () => {
    // require('react') throwing is the real trigger for the module's catch
    // branch. jest.doMock + isolateModules forces that exact path without
    // reimplementing the fallback logic inline -- a prior version of these
    // tests did that instead, which meant "fallback" tests never actually
    // exercised the module's own catch-path code. That gave false coverage
    // confidence and is why this file was consolidated from three.
    function requireWithReactUnavailable() {
      let mod;
      jest.isolateModules(() => {
        jest.doMock('react', () => { throw new Error('react not found'); });
        mod = require(MODULE_PATH);
      });
      return mod;
    }

    it('should export a working act function', () => {
      const mod = requireWithReactUnavailable();

      expect(typeof mod.act).toBe('function');
    });

    it('should call the callback and return its result', () => {
      const mod = requireWithReactUnavailable();

      let called = false;
      const result = mod.act(() => { called = true; return 'fallback-result'; });

      expect(called).toBe(true);
      expect(result).toBe('fallback-result');
    });

    it('should return undefined when called without a callback', () => {
      const mod = requireWithReactUnavailable();

      const result = mod.act();

      expect(result).toBeUndefined();
    });

    it('should not throw when called with a null or undefined callback', () => {
      const mod = requireWithReactUnavailable();

      expect(() => mod.act(null)).not.toThrow();
      expect(() => mod.act(undefined)).not.toThrow();
    });
  });
});
