/**
 * TDD approach for register.ts coverage
 * Following Red-Green-Refactor methodology
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateEnvironmentVariables } from '../register';

describe('TDD Register Coverage', () => {
  let originalEnv: typeof process.env;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('environment validation', () => {
    it('should throw when DISCORD_TOKEN is missing', () => {
      // REFACTOR: Test the extracted validation function directly
      delete process.env['DISCORD_TOKEN'];

      expect(() => {
        validateEnvironmentVariables();
      }).toThrow(
        'Missing required environment variables: DISCORD_TOKEN and DISCORD_APPLICATION_ID'
      );
    });

    it('should throw when DISCORD_APPLICATION_ID is missing', () => {
      // GREEN: Test for missing APP_ID using extracted function
      delete process.env['DISCORD_APPLICATION_ID'];

      expect(() => {
        validateEnvironmentVariables();
      }).toThrow(
        'Missing required environment variables: DISCORD_TOKEN and DISCORD_APPLICATION_ID'
      );
    });

    it('should return environment variables when both are present', () => {
      // GREEN: Positive test case
      process.env['DISCORD_TOKEN'] = 'test_token_123';
      process.env['DISCORD_APPLICATION_ID'] = 'test_app_id_456';

      const result = validateEnvironmentVariables();

      expect(result).toEqual({
        token: 'test_token_123',
        applicationId: 'test_app_id_456',
      });
    });
  });
});
