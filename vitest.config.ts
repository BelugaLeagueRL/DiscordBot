import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'miniflare',
    environmentOptions: {
      // Miniflare options for Cloudflare Workers testing
      bindings: {
        DISCORD_TOKEN: 'test-token',
        DISCORD_PUBLIC_KEY: 'test-key',
        DISCORD_APPLICATION_ID: 'test-app-id',
        ENVIRONMENT: 'test',
      },
      kvNamespaces: [],
      durableObjects: {},
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.test.{ts,js}',
        '**/*.spec.{ts,js}',
        'vitest.config.ts',
        'eslint.config.js',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    include: ['src/**/*.{test,spec}.{ts,js}'],
    exclude: ['node_modules/', 'dist/', '.wrangler/'],
  },
});