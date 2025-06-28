/**
 * ENHANCED PRODUCTION ESLint Configuration (2025 Industry Standard)
 * 
 * Research-based configuration covering:
 * - Security vulnerabilities prevention
 * - Type safety enforcement
 * - Performance optimization for Cloudflare Workers
 * - Discord bot security best practices
 * - Memory management for serverless environments
 * - Maintainability and debugging
 */

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // Base configurations (2025 standard)
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.strictTypeChecked,

  {
    files: ['src/**/*.{ts,js}'],
    languageOptions: {
      parserOptions: {
        projectService: true, // 2025 auto-discovery feature
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // === SECURITY RULES (Critical for Discord Bots) ===
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-caller': 'error',
      'no-extend-native': 'error',
      'no-global-assign': 'error',
      'no-implicit-globals': 'error',
      '@typescript-eslint/no-implied-eval': 'error',
      
      // === INPUT VALIDATION & SANITIZATION (Discord Bot Critical) ===
      'no-control-regex': 'error',
      'no-div-regex': 'error',
      'no-regex-spaces': 'error',
      'no-misleading-character-class': 'error',
      
      // === TYPE SAFETY (Production Critical) ===
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      
      // === DISCORD BOT SPECIFIC ===
      'no-console': 'off', // Allow console for Worker logging
      '@typescript-eslint/require-await': 'error', // Critical for async Discord handlers
      '@typescript-eslint/no-floating-promises': 'error', // Prevent unhandled promises
      '@typescript-eslint/await-thenable': 'error',
      
      // === CODE QUALITY (Industry Standard) ===
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      
      // === PERFORMANCE (Cloudflare Workers Optimized) ===
      'prefer-const': 'error',
      'no-var': 'error',
      'no-array-constructor': 'error',
      'no-new-object': 'error',
      'no-new-wrappers': 'error',
      'prefer-object-spread': 'error',
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',
      'prefer-template': 'error', // Core ESLint rule
      '@typescript-eslint/prefer-for-of': 'error',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      
      // === MEMORY MANAGEMENT (Workers Environment) ===
      'no-delete-var': 'error',
      'no-label-var': 'error',
      'no-shadow-restricted-names': 'error',
      'no-undef-init': 'error',
      
      // === ERROR HANDLING (Production Critical) ===
      '@typescript-eslint/only-throw-error': 'error',
      '@typescript-eslint/prefer-promise-reject-errors': 'error',
      
      // === IMPORTS & ORGANIZATION ===
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
        fixStyle: 'separate-type-imports'
      }],
      '@typescript-eslint/consistent-type-exports': 'error',
      
      // === NAMING CONVENTIONS ===
      '@typescript-eslint/naming-convention': ['error',
        {
          selector: 'interface',
          format: ['PascalCase']
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase']
        },
        {
          selector: 'enum',
          format: ['PascalCase']
        },
        {
          selector: 'enumMember',
          format: ['PascalCase']
        }
      ],
      
      // === STRICT BOOLEAN EXPRESSIONS ===
      '@typescript-eslint/strict-boolean-expressions': ['error', {
        allowString: false,
        allowNumber: false,
        allowNullableObject: false,
        allowNullableBoolean: false,
        allowNullableString: false,
        allowNullableNumber: false,
        allowAny: false
      }],
      
      // === COMPLEXITY CONTROL ===
      'complexity': ['error', 10],
      'max-params': ['error', 4],
      'max-depth': ['error', 4],
      'max-nested-callbacks': ['error', 3],
      'max-statements-per-line': ['error', { max: 1 }],
      
      // === DEBUGGING & MAINTAINABILITY ===
      'no-alert': 'error',
      'no-debugger': 'error',
      'no-empty': ['error', { allowEmptyCatch: false }],
      'no-empty-function': 'error',
      'no-lonely-if': 'error',
      'no-magic-numbers': ['warn', { 
        ignore: [-1, 0, 1, 2, 3, 4, 5, 100, 1000],
        ignoreArrayIndexes: true,
        ignoreDefaultValues: true
      }],
      'no-multi-assign': 'error',
      'no-negated-condition': 'warn',
      'no-nested-ternary': 'error',
      'no-unneeded-ternary': 'error',
      'no-useless-return': 'error',
      
      // === PROMISE & ASYNC HANDLING (Critical for Discord Bots) ===
      '@typescript-eslint/no-misused-promises': ['error', {
        checksConditionals: true,
        checksVoidReturn: true,
        checksSpreads: true
      }],
      '@typescript-eslint/return-await': ['error', 'always'], // Safer error handling
      
      // === ARRAY & OBJECT SAFETY ===
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/no-dynamic-delete': 'error',
      '@typescript-eslint/dot-notation': 'error',
      
      // === FUNCTION SAFETY ===
      '@typescript-eslint/prefer-function-type': 'error',
      '@typescript-eslint/method-signature-style': ['error', 'property'],
      
      // === ADDITIONAL SAFETY ===
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
    },
  },

  {
    // Test files: Slightly relaxed for productivity
    files: ['**/*.test.{ts,js}', '**/*.spec.{ts,js}', 'src/__tests__/**/*'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      'complexity': 'off',
      'max-params': 'off',
      'no-magic-numbers': 'off',
      '@typescript-eslint/prefer-readonly': 'off',
      'max-nested-callbacks': 'off',
    },
  },

  prettierConfig,
);