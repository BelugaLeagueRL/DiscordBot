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
      include: ['src/**/*.{ts,js}'],
      exclude: ['src/__tests__/**', '**/*.test.{ts,js}', '**/*.spec.{ts,js}'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    include: ['src/**/*.{test,spec}.{ts,js}'],
    exclude: ['node_modules/', 'dist/', '.wrangler/'],
  },
});
