import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['.output/**', '.wxt/**', 'node_modules/**', 'data/**', 'stats.html', '.preview/**'],
  },

  js.configs.recommended,
  tseslint.configs.recommended,

  {
    files: ['**/*.tsx'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.flat.recommended.rules,
  },

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.webextensions,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // Node で動くファイル
  {
    files: [
      'scripts/**/*.{ts,mjs}',
      'site/**/*.mjs',
      'store/**/*.mjs',
      'wxt.config.ts',
      'eslint.config.js',
      'vitest.config.ts',
    ],
    languageOptions: {
      globals: globals.node,
    },
  },

  // テストは Vitest のグローバルを使わず import する方針だが、Node の API は使う
  {
    files: ['tests/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
);
