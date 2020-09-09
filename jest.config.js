module.exports = {
  cacheDirectory: '../.jest',
  globals: {
    'ts-jest': {
      diagnostics: false,
      isolatedModules: true,
      tsConfig: 'tsconfig.dev.json',
    },
  },
  testRegex: '.test.ts?$',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!**/node_modules/**',
    '!**/build/**',
    '!**/test/**',
    '!**/.coverage/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: [
    'text',
    'html',
    'text-summary',
  ],
  coverageDirectory: '.coverage',
  rootDir: './',
  testEnvironment: 'node',
  testRunner: 'jest-circus/runner',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  verbose: true,
};
