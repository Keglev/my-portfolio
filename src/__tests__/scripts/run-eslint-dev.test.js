/**
 * @file run-eslint-dev.test.js
 * @module src/__tests__/scripts/run-eslint-dev
 * @testing scripts/run-eslint-dev.js
 * @description Contract tests for the dev-mode ESLint runner: it sets
 * NODE_ENV to 'development' and runs the expected eslint command, exits
 * 0 on success, and maps a thrown error to the right exit code
 * (error.status if present, 1 otherwise).
 *
 * Note: the script runs synchronous code at require()-time with no
 * exported API; each test resets modules and re-requires to trigger a
 * fresh run.
 */
jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

describe('run-eslint-dev', () => {
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

  it('should run the eslint command with the expected arguments when the script loads', () => {
    const { execSync } = require('child_process');
    execSync.mockImplementation(() => {});

    require('../../../scripts/run-eslint-dev');

    expect(execSync).toHaveBeenCalledWith(
      'npx eslint src --format stylish --max-warnings 0',
      { stdio: 'inherit' }
    );
  });

  it('should exit 0 when eslint succeeds', () => {
    const { execSync } = require('child_process');
    execSync.mockImplementation(() => {});

    require('../../../scripts/run-eslint-dev');

    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should exit with error.status when execSync throws a status-bearing error', () => {
    const { execSync } = require('child_process');
    execSync.mockImplementation(() => {
      const err = new Error('lint failures found');
      err.status = 2;
      throw err;
    });

    require('../../../scripts/run-eslint-dev');

    expect(mockExit).toHaveBeenCalledWith(2);
  });

  it('should exit 1 when the thrown error has no status code', () => {
    const { execSync } = require('child_process');
    execSync.mockImplementation(() => {
      throw new Error('unexpected crash');
    });

    require('../../../scripts/run-eslint-dev');

    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should set NODE_ENV to "development" when the script loads', () => {
    const { execSync } = require('child_process');
    execSync.mockImplementation(() => {});

    require('../../../scripts/run-eslint-dev');

    expect(process.env.NODE_ENV).toBe('development');
  });
});
