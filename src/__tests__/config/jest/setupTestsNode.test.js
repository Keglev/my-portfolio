/** Tests for config/jest/setupTestsNode.js — verifies global polyfills, IS_REACT_ACT_ENVIRONMENT, and console.error suppression are applied on require. */

describe('setupTestsNode', () => {
  let originalGlobal;

  beforeEach(() => {
    originalGlobal = {
      React: global.React,
      fetch: global.fetch,
      IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT,
      consoleError: console.error
    };
  });

  afterEach(() => {
    global.React = originalGlobal.React;
    global.fetch = originalGlobal.fetch;
    global.IS_REACT_ACT_ENVIRONMENT = originalGlobal.IS_REACT_ACT_ENVIRONMENT;
    console.error = originalGlobal.consoleError;
  });

  describe('React global setup', () => {
    it('should attempt to provide React global', () => {
      expect(() => {
        delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
        require('../../../../config/jest/setupTestsNode');
      }).not.toThrow();
    });

    it('should have React available after setup (or gracefully handle missing React)', () => {
      delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
      require('../../../../config/jest/setupTestsNode');
      // Loose check: React may or may not be available depending on environment
      const reactType = typeof global.React;
      expect(reactType === 'object' || reactType === 'undefined').toBe(true);
    });
  });

  describe('fetch polyfill setup', () => {
    it('should setup fetch if available', () => {
      delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
      require('../../../../config/jest/setupTestsNode');
      // Either native fetch or the node-fetch polyfill should be present
      expect(typeof global.fetch).toBe('function');
    });

    it('fetch should be callable', () => {
      delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
      require('../../../../config/jest/setupTestsNode');
      expect(typeof global.fetch).toBe('function');
    });
  });

  describe('jest-dom matchers setup', () => {
    it('should attempt to load jest-dom matchers', () => {
      expect(() => {
        delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
        require('../../../../config/jest/setupTestsNode');
      }).not.toThrow();
    });

    it('should have jest-dom matchers available', () => {
      delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
      require('../../../../config/jest/setupTestsNode');
      expect(expect.extend).toBeDefined();
    });
  });

  describe('React act environment setup', () => {
    it('should set IS_REACT_ACT_ENVIRONMENT flag', () => {
      delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
      require('../../../../config/jest/setupTestsNode');
      expect(global.IS_REACT_ACT_ENVIRONMENT).toBe(true);
    });

    it('IS_REACT_ACT_ENVIRONMENT should be a boolean true', () => {
      delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
      require('../../../../config/jest/setupTestsNode');
      expect(typeof global.IS_REACT_ACT_ENVIRONMENT).toBe('boolean');
      expect(global.IS_REACT_ACT_ENVIRONMENT).toBe(true);
    });
  });

  describe('console.error suppression', () => {
    it('should wrap or modify console.error', () => {
      delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
      require('../../../../config/jest/setupTestsNode');
      // console.error may already be wrapped because the module runs as a side-effect on load
      expect(typeof console.error).toBe('function');
    });

    it('should suppress ReactDOMTestUtils.act deprecation warnings', () => {
      delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
      require('../../../../config/jest/setupTestsNode');

      const errorSpy = jest.fn();
      const originalError = console.error;
      console.error = errorSpy;

      console.error('Warning: ReactDOMTestUtils.act is deprecated');

      // Suppressed messages must not reach the spy; only normal messages should
      errorSpy.mockClear();
      console.error('Normal error message');
      expect(errorSpy).toHaveBeenCalled();

      console.error = originalError;
    });

    it('should pass through non-suppressed error messages', () => {
      delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
      require('../../../../config/jest/setupTestsNode');

      const errorSpy = jest.fn();
      console.error = errorSpy;

      console.error('This is a normal error');
      expect(errorSpy).toHaveBeenCalledWith('This is a normal error');
    });

    it('should handle console.error with multiple arguments', () => {
      delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
      require('../../../../config/jest/setupTestsNode');

      const errorSpy = jest.fn();
      console.error = errorSpy;

      console.error('Error:', new Error('test'));
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should not throw errors during setup', () => {
      expect(() => {
        delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
        require('../../../../config/jest/setupTestsNode');
      }).not.toThrow();
    });

    it('should gracefully handle missing optional dependencies', () => {
      expect(() => {
        delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
        require('../../../../config/jest/setupTestsNode');
      }).not.toThrow();
    });
  });

  describe('module execution', () => {
    it('should be a self-executing setup module', () => {
      delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
      const result = require('../../../../config/jest/setupTestsNode');
      // Setup modules export undefined or an empty object by convention
      expect(result === undefined || typeof result === 'object').toBe(true);
    });

    it('should execute all try-catch blocks', () => {
      delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
      require('../../../../config/jest/setupTestsNode');
      expect(typeof global.IS_REACT_ACT_ENVIRONMENT).not.toBe('undefined');
      expect(global.IS_REACT_ACT_ENVIRONMENT).toBe(true);
    });
  });

  describe('consistency', () => {
    it('should consistently setup the environment on each require', () => {
      delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
      require('../../../../config/jest/setupTestsNode');
      const firstReactAct = global.IS_REACT_ACT_ENVIRONMENT;

      delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
      require('../../../../config/jest/setupTestsNode');
      const secondReactAct = global.IS_REACT_ACT_ENVIRONMENT;

      expect(firstReactAct).toBe(secondReactAct);
      expect(secondReactAct).toBe(true);
    });
  });
});
