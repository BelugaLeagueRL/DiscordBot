/**
 * Simplified ESLint Configuration for Development Efficiency
 * Using eslint:recommended + @typescript-eslint/recommended
 */

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // Base configurations
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['src/**/*.{ts,js}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Keep essential security rules
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-console': 'off', // Allow console for Worker logging
      
      // Keep essential TypeScript rules
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'warn', // Warn instead of error
      
      // Modern JavaScript preferences
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  {
    // Test files: Even more relaxed
    files: ['**/*.test.{ts,js}', '**/*.spec.{ts,js}', 'src/__tests__/**/*'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  prettierConfig,
);