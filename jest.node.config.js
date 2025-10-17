module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/scripts/jest/setupTestsNode.js'],
  transformIgnorePatterns: ['node_modules/(?!(axios)/)'],
  moduleNameMapper: {
    '^.+\\.(css|less|scss|sass)$': '<rootDir>/scripts/jest/styleMock.js',
    '^.+\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/scripts/jest/fileMock.js'
  }
};
