import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    pool: '@cloudflare/vitest-pool-workers',
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
        main: './src/index.ts', // Required for SELF service binding
        miniflare: {
          // Fix for discord-api-types module resolution
          compatibilityDate: '2024-01-01',
          compatibilityFlags: ['nodejs_compat'],
        },
      },
    },
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.test.{ts,js}',
        '**/*.spec.{ts,js}',
        'src/__tests__/**/*',
        'vitest.config.ts',
        'eslint.config.js',
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
    },
    include: ['src/**/*.{test,spec}.{ts,js}'],
    exclude: ['node_modules/', 'dist/', '.wrangler/'],
  },
});
