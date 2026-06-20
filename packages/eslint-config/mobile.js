'use strict';

const { defineConfig } = require('eslint/config');
const eslintConfigPrettier = require('eslint-config-prettier');
const expoConfig = require('eslint-config-expo/flat');

/**
 * Expo / React Native rules. Keeps eslint-config-expo as the primary preset
 * (it already bundles TypeScript + React rules). Do not stack base.js here —
 * typescript-eslint on top breaks expo's import resolver for `@/` aliases.
 */
module.exports = defineConfig([
  expoConfig,
  eslintConfigPrettier,
  {
    rules: {
      // `@/` aliases are checked by `tsc --noEmit`; expo's import resolver fails under workspace hoist + TS 6.
      'import/no-unresolved': 'off',
      'import/namespace': 'off',
      'import/no-duplicates': 'off',
    },
  },
  {
    files: ['eslint.config.js', 'scripts/**/*.js'],
    rules: {
      // ESLint/Node scripts are CommonJS; Expo's no-require-imports targets app code.
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['src/design-system/primitives/motion.tsx'],
    rules: {
      // Reanimated shared values are mutated via `.value` by design.
      'react-hooks/immutability': 'off',
    },
  },
  {
    ignores: ['dist/**', '.expo/**', 'node_modules/**', 'android/**', 'ios/**', 'web-build/**'],
  },
]);
