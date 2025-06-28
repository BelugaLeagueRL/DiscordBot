/**
 * Mock environments for different testing scenarios
 */

import type { Env } from '../../index';

/**
 * Base mock environment for testing
 */
export const mockBaseEnv: Env = {
  DISCORD_TOKEN: 'mock_discord_token_1234567890abcdef',
  DISCORD_PUBLIC_KEY: 'mock_public_key_abcdef1234567890',
  DISCORD_APPLICATION_ID: '123456789012345678',
  DATABASE_URL: 'sqlite://test.db',
  GOOGLE_SHEETS_API_KEY: 'mock_sheets_api_key_1234567890',
  ENVIRONMENT: 'test',
};

/**
 * Development environment mock
 */
export const mockDevEnv: Env = {
  ...mockBaseEnv,
  ENVIRONMENT: 'development',
  DATABASE_URL: 'sqlite://dev.db',
};

/**
 * Production environment mock
 */
export const mockProdEnv: Env = {
  ...mockBaseEnv,
  ENVIRONMENT: 'production',
  DATABASE_URL: 'postgres://user:pass@localhost/prod_db',
};

/**
 * Test environment with minimal configuration
 */
export const mockTestEnv: Env = {
  ...mockBaseEnv,
  GOOGLE_SHEETS_API_KEY: undefined,
  DATABASE_URL: 'sqlite://:memory:',
};

/**
 * Environment missing required configuration
 */
export const mockIncompleteEnv: Partial<Env> = {
  DISCORD_TOKEN: 'mock_token',
  // Missing DISCORD_PUBLIC_KEY and DISCORD_APPLICATION_ID
  DATABASE_URL: 'sqlite://test.db',
  ENVIRONMENT: 'test',
};

/**
 * Environment with invalid configuration
 */
export const mockInvalidEnv: Env = {
  DISCORD_TOKEN: '', // Empty token
  DISCORD_PUBLIC_KEY: 'invalid-key',
  DISCORD_APPLICATION_ID: 'not-a-number',
  DATABASE_URL: 'invalid://url',
  GOOGLE_SHEETS_API_KEY: '',
  ENVIRONMENT: 'invalid',
};

/**
 * Environment with very long values (edge case)
 */
export const mockLargeEnv: Env = {
  DISCORD_TOKEN: 'x'.repeat(1000),
  DISCORD_PUBLIC_KEY: 'y'.repeat(1000),
  DISCORD_APPLICATION_ID: '9'.repeat(20),
  DATABASE_URL: `sqlite://${'z'.repeat(500)}.db`,
  GOOGLE_SHEETS_API_KEY: 'a'.repeat(500),
  ENVIRONMENT: 'test',
};

/**
 * Factory function to create custom environment
 */
export function createMockEnv(overrides: Partial<Env> = {}): Env {
  return {
    ...mockBaseEnv,
    ...overrides,
  };
}

/**
 * Create environment for specific testing scenarios
 */
export const mockEnvironments = {
  base: mockBaseEnv,
  development: mockDevEnv,
  production: mockProdEnv,
  test: mockTestEnv,
  incomplete: mockIncompleteEnv,
  invalid: mockInvalidEnv,
  large: mockLargeEnv,

  // Scenario-specific environments
  withoutDatabase: createMockEnv({ DATABASE_URL: undefined }),
  withoutGoogleSheets: createMockEnv({ GOOGLE_SHEETS_API_KEY: undefined }),
  withInvalidDiscordToken: createMockEnv({ DISCORD_TOKEN: 'invalid_token' }),
  withMissingAppId: createMockEnv({ DISCORD_APPLICATION_ID: undefined as any }),
};

/**
 * Get environment for specific test scenario
 */
export function getEnvironmentForScenario(
  scenario: keyof typeof mockEnvironments
): Env | Partial<Env> {
  return mockEnvironments[scenario];
}

/**
 * Validate environment completeness
 */
export function isCompleteEnvironment(env: Partial<Env>): env is Env {
  const requiredFields: (keyof Env)[] = [
    'DISCORD_TOKEN',
    'DISCORD_PUBLIC_KEY',
    'DISCORD_APPLICATION_ID',
    'ENVIRONMENT',
  ];

  return requiredFields.every(field => env[field] !== undefined && env[field] !== '');
}
