import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathPattern: '__tests__',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        esModuleInterop: false,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
};

export default config;
