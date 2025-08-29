/** @type {import('jest').Config} */
export default {
  preset: "jest-preset-angular",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setup-jest.ts"],
  testMatch: ["**/?(*.)+(spec).ts"],
  transform: {
    "^.+\\.(ts|mjs|js|html)$": [
      "jest-preset-angular",
      {
        tsconfig: "<rootDir>/tsconfig.spec.json",
        stringifyContentPathRegex: "\\.html$",
      },
    ],
  },
  moduleNameMapper: {
    "^@core/(.*)$": "<rootDir>/src/app/core/$1",
    "^@shared/(.*)$": "<rootDir>/src/app/shared/$1",
    "^@features/(.*)$": "<rootDir>/src/app/features/$1",
    "\\.(css|scss|sass)$": "<rootDir>/src/test/style-mock.js",
  },
  transformIgnorePatterns: ["node_modules/(?!.*\\.mjs$)"],
  moduleFileExtensions: ["ts", "js", "mjs", "html"],
};
