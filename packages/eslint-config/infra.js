'use strict';

const { defineConfig } = require('eslint/config');
const globals = require('globals');
const base = require('./base.js');

/**
 * AWS CDK / Node backend rules. Source uses TypeScript with NodeNext
 * module resolution; linting stays module-system agnostic.
 */
module.exports = defineConfig([
  ...base,
  {
    files: ['**/*.ts', '**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.test.ts'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  {
    // ESLint flat-config entrypoints stay CommonJS require() — not app source.
    files: ['eslint.config.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['lib/lambda/**/*.ts'],
    rules: {
      // AppSync resolver event shapes are loosely typed at the boundary.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ignores: ['node_modules/**', 'cdk.out/**', 'dist/**'],
  },
]);
