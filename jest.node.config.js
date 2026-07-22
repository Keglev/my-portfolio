/**
 * Jest configuration for browser-environment (jsdom) tests covering src/ components,
 * scripts/, and config/jest helpers.
 */
module.exports = {
  // jsdom is required for React component tests; the Node default breaks DOM APIs
  testEnvironment: 'jsdom',
  // setupFilesAfterEnv (not setupFiles) ensures jest-dom matchers load after the environment is ready
  setupFilesAfterEnv: ['<rootDir>/config/jest/setupTestsNode.js'],
  transform: {
    // Explicit babel presets because CRA's default transform is unavailable in this standalone config
    '^.+\\.(js|jsx|mjs|cjs|ts|tsx)$': [
      'babel-jest',
      {
        presets: ['@babel/preset-env', ['@babel/preset-react', { runtime: 'automatic' }]],
        // TEMPORARY: rewrites Vite's `import.meta.env` to `process.env`, which
        // preset-env's CommonJS output cannot represent. Removed together with
        // config/jest/ when the runner migrates to Vitest, which reads
        // import.meta.env natively. See the plugin file for the full rationale.
        // require.resolve, not '<rootDir>/...': Babel resolves plugin paths
        // itself and never sees Jest's <rootDir> token.
        plugins: [require.resolve('./config/jest/importMetaEnvBabelPlugin.js')]
      }
    ]
  },
  moduleNameMapper: {
    // Prevent style imports from throwing in jsdom
    '^.+\\.(css|less|scss|sass)$': '<rootDir>/config/jest/styleMock.js',
    // Static assets are stubbed to a string to avoid binary parse errors
    '^.+\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/config/jest/fileMock.js',
    // Redirect deprecated test-utils path to React's built-in act
    '^react-dom/test-utils$': '<rootDir>/config/jest/react-dom-test-utils.js',
    // Vercel SDK has no meaning in test environments
    '^@vercel/speed-insights/react$': '<rootDir>/config/jest/speedInsightsMock.js'
  },
  // Include all source files so coverage report is comprehensive
  collectCoverageFrom: [
    'config/jest/**/*.js',
    'src/**/*.{js,jsx}',
    'scripts/**/*.js',
  ],
  // Exclude test files, entry points, and standalone debug/audit scripts from coverage reporting
  coveragePathIgnorePatterns: [
    'node_modules',
    '__tests__',
    '\\.test\\.js$',
    '\\.spec\\.js$',
    'setupTests\\.js',
    'audit-check\\.js',
  ],
  // lcov enables CI coverage upload; json-summary drives badge generation
  coverageReporters: ['html', 'text', 'lcov', 'json-summary'],
  coverageDirectory: '<rootDir>/coverage'
};
