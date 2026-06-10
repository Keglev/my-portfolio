/*
 * Tests for scripts/run-eslint-dev.js
 * Covers: NODE_ENV setup, eslint command invocation, and process.exit code mapping.
 *
 * Note: the script runs synchronous code at require()-time with no exported API;
 * each test resets modules and re-requires to trigger a fresh run.
 */
jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

describe('scripts/run-eslint-dev', () => {
  let mockExit;
  let originalNodeEnv;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    jest.resetModules();
    // Prevent process.exit() from actually terminating the test process.
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    mockExit.mockRestore();
  });

  test('runs the eslint command with the expected arguments', () => {
    const { execSync } = require('child_process');
    execSync.mockImplementation(() => {});
    require('../../../scripts/run-eslint-dev');
    expect(execSync).toHaveBeenCalledWith(
      'npx eslint src --format stylish --max-warnings 0',
      { stdio: 'inherit' }
    );
  });

  test('exits 0 when eslint succeeds', () => {
    const { execSync } = require('child_process');
    execSync.mockImplementation(() => {});
    require('../../../scripts/run-eslint-dev');
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  test('exits with error.status when execSync throws a status-bearing error', () => {
    const { execSync } = require('child_process');
    execSync.mockImplementation(() => {
      const err = new Error('lint failures found');
      err.status = 2;
      throw err;
    });
    require('../../../scripts/run-eslint-dev');
    expect(mockExit).toHaveBeenCalledWith(2);
  });

  test('exits 1 when the thrown error has no status code', () => {
    const { execSync } = require('child_process');
    execSync.mockImplementation(() => {
      throw new Error('unexpected crash');
    });
    require('../../../scripts/run-eslint-dev');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test('sets NODE_ENV to "development" before invoking eslint', () => {
    const { execSync } = require('child_process');
    execSync.mockImplementation(() => {});
    require('../../../scripts/run-eslint-dev');
    expect(process.env.NODE_ENV).toBe('development');
  });
});
