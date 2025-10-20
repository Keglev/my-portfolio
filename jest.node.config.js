module.exports = {
  testEnvironment: 'jsdom',
  // Use setupFilesAfterEnv so testing-library/jest-dom matchers are installed
  // into the Jest environment before tests run.
  setupFilesAfterEnv: ['<rootDir>/config/jest/setupTestsNode.js'],
  transformIgnorePatterns: ['node_modules/(?!(axios)/)'],
  moduleNameMapper: {
    '^.+\\.(css|less|scss|sass)$': '<rootDir>/config/jest/styleMock.js',
    '^.+\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/config/jest/fileMock.js'
    ,
    '^react-dom/test-utils$': '<rootDir>/config/jest/react-dom-test-utils.js'
  }
};
