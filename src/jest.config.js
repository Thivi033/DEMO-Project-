/** @type {import('jest').Config} */
const config = {
  // Enables verbose output for detailed test results
  verbose: true,

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Use 'node' for backend or 'jest-environment-jsdom' for frontend
  testEnvironment: 'node',

  // Specify where to look for test files
  testMatch: [
    "**/__tests__/**/*.js",
    "**/?(*.)+(spec|test).js"
  ],

  // Patterns to skip during testing
  //jest
  testPathIgnorePatterns: ["/node_modules/"],
};

export default config;
