module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: ['handler.js'],
};
