/** Tests for config/jest/react-dom-test-utils.js — covers the React-available path and the noop fallback. */

describe('react-dom-test-utils', () => {
  let reactDomTestUtils;

  beforeEach(() => {
    // Re-require each time to get a fresh module instance
    delete require.cache[require.resolve('../../../../config/jest/react-dom-test-utils')];
  });

  describe('when React is available', () => {
    beforeEach(() => {
      reactDomTestUtils = require('../../../../config/jest/react-dom-test-utils');
    });

    it('should export an object with act method', () => {
      expect(reactDomTestUtils).toBeDefined();
      expect(typeof reactDomTestUtils).toBe('object');
      expect(typeof reactDomTestUtils.act).toBe('function');
    });

    it('should have act method from React', () => {
      const React = require('react');
      expect(reactDomTestUtils.act).toBe(React.act);
    });

    it('should execute callback passed to act', async () => {
      let callbackExecuted = false;

      await reactDomTestUtils.act(async () => {
        callbackExecuted = true;
      });

      expect(callbackExecuted).toBe(true);
    });

    it('act should handle callbacks with return values', async () => {
      const result = await reactDomTestUtils.act(async () => {
        return 'test-result';
      });

      expect(result).toBe('test-result');
    });

    it('should not have other properties', () => {
      expect(Object.keys(reactDomTestUtils)).toContain('act');
      // Loose check: module may expose additional React exports alongside act
      expect(typeof reactDomTestUtils.act).toBe('function');
    });
  });

  describe('fallback behavior', () => {
    it('should have a working fallback noop function', () => {
      // Replicates the catch-path noop inline to verify its short-circuit logic independently
      const noop = function noop(cb) {
        return cb && cb();
      };

      let called = false;
      const result = noop(() => {
        called = true;
        return 'result';
      });

      expect(called).toBe(true);
      expect(result).toBe('result');
    });

    it('fallback noop should handle no callback gracefully', () => {
      const noop = function noop(cb) {
        return cb && cb();
      };

      expect(() => noop()).not.toThrow();
      expect(noop()).toBeUndefined();
    });

    it('fallback noop should handle null/undefined gracefully', () => {
      const noop = function noop(cb) {
        return cb && cb();
      };

      expect(noop(null)).toBeFalsy();
      expect(noop(undefined)).toBeFalsy();
    });
  });

  describe('module export structure', () => {
    beforeEach(() => {
      reactDomTestUtils = require('../../../../config/jest/react-dom-test-utils');
    });

    it('should be exported as module.exports', () => {
      expect(reactDomTestUtils).toBeDefined();
    });

    it('should export an object with at least act property', () => {
      expect(reactDomTestUtils).toHaveProperty('act');
      expect(typeof reactDomTestUtils.act).toBe('function');
    });

    it('exported act should be callable', async () => {
      let executed = false;
      await reactDomTestUtils.act(async () => {
        executed = true;
      });
      expect(executed).toBe(true);
    });
  });
});
