module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testPathIgnorePatterns: ['/node_modules/', '/frontend/', '/frontend-temp/'],
  modulePathIgnorePatterns: ['/frontend/', '/frontend-temp/'],
}; 