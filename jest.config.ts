import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
  testMatch: ['**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'html', 'js', 'mjs', 'json'],

  // Soporte TS/plantillas Angular
  transform: {
    '^.+\\.(ts|mjs|html)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
        isolatedModules: true,
        diagnostics: { warnOnly: true },
      },
    ],
  },

  // Aliases de tu proyecto + mocks de assets/estilos
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/src/app/core/$1',
    '^@shared/(.*)$': '<rootDir>/src/app/shared/$1',
    '^@layout/(.*)$': '<rootDir>/src/app/layout/$1',
    '^@pages/(.*)$': '<rootDir>/src/app/pages/$1',
    '\\.(css|scss|sass|less)$': '<rootDir>/src/test/mocks/style-mock.ts',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/test/mocks/file-mock.ts',
  },

  // Cobertura (ajusta a tu gusto)
  collectCoverageFrom: [
    'src/app/**/*.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/environments/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  reporters: ['default'],
};

export default config;
