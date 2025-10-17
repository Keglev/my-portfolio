module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/config/jest/setupTestsNode.js'],
  transformIgnorePatterns: ['node_modules/(?!(axios)/)'],
  moduleNameMapper: {
    '^.+\\.(css|less|scss|sass)$': '<rootDir>/config/jest/styleMock.js',
    '^.+\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/config/jest/fileMock.js'
  }
};
