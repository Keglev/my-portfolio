module.exports = {
  testEnvironment: 'jsdom',
  // Use setupFilesAfterEnv so testing-library/jest-dom matchers are installed
  // into the Jest environment before tests run.
  setupFilesAfterEnv: ['<rootDir>/config/jest/setupTestsNode.js'],
  transform: {
    '^.+\\.(js|jsx|mjs|cjs|ts|tsx)$': [
      'babel-jest',
      {
        presets: ['@babel/preset-env', ['@babel/preset-react', { runtime: 'automatic' }]]
      }
    ]
  },
  transformIgnorePatterns: ['node_modules/(?!(axios)/)'],
  moduleNameMapper: {
    '^.+\\.(css|less|scss|sass)$': '<rootDir>/config/jest/styleMock.js',
    '^.+\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/config/jest/fileMock.js',
    '^react-dom/test-utils$': '<rootDir>/config/jest/react-dom-test-utils.js',
    '^@vercel/speed-insights/react$': '<rootDir>/config/jest/speedInsightsMock.js'
  },
  collectCoverageFrom: [
    'config/jest/**/*.js',
    'src/**/*.{js,jsx}',
    'scripts/**/*.js',
    // Include all source files so coverage report is comprehensive
  ],
  // Exclude test files from coverage reporting
  coveragePathIgnorePatterns: [
    'node_modules',
    '__tests__',
    '\\.test\\.js$',
    '\\.spec\\.js$',
  ],
  coverageReporters: ['html', 'text', 'lcov'],
  coverageDirectory: '<rootDir>/coverage'
};
