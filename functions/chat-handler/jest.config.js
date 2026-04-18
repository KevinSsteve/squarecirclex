module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'handler.js',
    '!**/node_modules/**',
  ],
  testMatch: [
    '**/*.test.js',
  ],
  verbose: true,
};
