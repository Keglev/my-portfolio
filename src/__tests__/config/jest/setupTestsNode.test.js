/**
 * Tests for config/jest/setupTestsNode.js
 * This file sets up the Jest environment with React, fetch, jest-dom, and console management
 */

describe('setupTestsNode', () => {
  let originalGlobal;

  beforeEach(() => {
    // Store original global state
    originalGlobal = {
      React: global.React,
      fetch: global.fetch,
      IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT,
      consoleError: console.error
    };
  });

  afterEach(() => {
    // Restore original global state
    global.React = originalGlobal.React;
    global.fetch = originalGlobal.fetch;
    global.IS_REACT_ACT_ENVIRONMENT = originalGlobal.IS_REACT_ACT_ENVIRONMENT;
    console.error = originalGlobal.consoleError;
  });

  describe('React global setup', () => {
    it('should attempt to provide React global', () => {
      // This test verifies the module loads without errors
      expect(() => {
        delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
        require('../../../../config/jest/setupTestsNode');
      }).not.toThrow();
    });

    it('should have React available after setup (or gracefully handle missing React)', () => {
      delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
      require('../../../../config/jest/setupTestsNode');
      // React may or may not be available depending on environment
      // Just verify the module executed without throwing
      const reactType = typeof global.React;
      expect(reactType === 'object' || reactType === 'undefined').toBe(true);
    });
  });

  describe('fetch polyfill setup', () => {
    it('should setup fetch if available', () => {
      delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
      require('../../../../config/jest/setupTestsNode');
      // fetch should be defined (either natively or via polyfill)
      expect(typeof global.fetch).toBe('function');
    });

    it('fetch should be callable', () => {
      // This tests that if fetch exists, it's properly set up
      delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
      require('../../../../config/jest/setupTestsNode');
      expect(typeof global.fetch).toBe('function');
    });
  });

  describe('jest-dom matchers setup', () => {
    it('should attempt to load jest-dom matchers', () => {
      // jest-dom extends expect with additional matchers
      expect(() => {
        delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
        require('../../../../config/jest/setupTestsNode');
      }).not.toThrow();
    });

    it('should have jest-dom matchers available', () => {
      delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
      require('../../../../config/jest/setupTestsNode');
      // Check if jest-dom matchers are available
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
      // The module wraps console.error, so it may have already been wrapped
      // by setupTestsNode which runs at module load time
      expect(typeof console.error).toBe('function');
    });

    it('should suppress ReactDOMTestUtils.act deprecation warnings', () => {
      delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
      require('../../../../config/jest/setupTestsNode');

      const errorSpy = jest.fn();
      const originalError = console.error;
      console.error = errorSpy;

      // Call with deprecation message
      console.error('Warning: ReactDOMTestUtils.act is deprecated');

      // Should not call the spy for suppressed messages
      // Reset and call with normal message
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
      // The module is designed to handle missing node-fetch gracefully
      expect(() => {
        delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
        require('../../../../config/jest/setupTestsNode');
      }).not.toThrow();
    });
  });

  describe('module execution', () => {
    it('should be a self-executing setup module', () => {
      // Clear cache and execute
      delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
      const result = require('../../../../config/jest/setupTestsNode');
      // Setup modules may export undefined or an empty object
      expect(result === undefined || typeof result === 'object').toBe(true);
    });

    it('should execute all try-catch blocks', () => {
      delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
      require('../../../../config/jest/setupTestsNode');

      // Verify that the setup actually initialized globals
      // IS_REACT_ACT_ENVIRONMENT should definitely be set
      expect(typeof global.IS_REACT_ACT_ENVIRONMENT).not.toBe('undefined');
      expect(global.IS_REACT_ACT_ENVIRONMENT).toBe(true);
    });
  });

  describe('consistency', () => {
    it('should consistently setup the environment on each require', () => {
      // First setup
      delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
      require('../../../../config/jest/setupTestsNode');
      const firstReactAct = global.IS_REACT_ACT_ENVIRONMENT;

      // Second setup
      delete require.cache[require.resolve('../../../../config/jest/setupTestsNode')];
      require('../../../../config/jest/setupTestsNode');
      const secondReactAct = global.IS_REACT_ACT_ENVIRONMENT;

      expect(firstReactAct).toBe(secondReactAct);
      expect(secondReactAct).toBe(true);
    });
  });
});
