/**
 * TDD approach for register.ts coverage
 * Following Red-Green-Refactor methodology
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  validateEnvironmentVariables,
  determineRegistrationEnvironment,
} from '../utils/command-registration';

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

  describe('environment-specific registration', () => {
    it('should determine development environment when DISCORD_ENV=development', () => {
      // RED: Test for development environment detection
      process.env['DISCORD_ENV'] = 'development';
      process.env['DISCORD_TOKEN'] = 'test_token';
      process.env['DISCORD_APPLICATION_ID'] = 'test_app_id';

      const result = determineRegistrationEnvironment();

      expect(result.environment).toBe('development');
      expect(result.applicationId).toBe('test_app_id');
    });

    it('should determine production environment when DISCORD_ENV=production', () => {
      // RED: Test for production environment detection
      process.env['DISCORD_ENV'] = 'production';
      process.env['DISCORD_TOKEN'] = 'prod_token';
      process.env['DISCORD_APPLICATION_ID'] = 'prod_app_id';

      const result = determineRegistrationEnvironment();

      expect(result.environment).toBe('production');
      expect(result.applicationId).toBe('prod_app_id');
    });

    it('should default to development when DISCORD_ENV is not set', () => {
      // RED: Test for default environment behavior
      delete process.env['DISCORD_ENV'];
      process.env['DISCORD_TOKEN'] = 'default_token';
      process.env['DISCORD_APPLICATION_ID'] = 'default_app_id';

      const result = determineRegistrationEnvironment();

      expect(result.environment).toBe('development');
      expect(result.applicationId).toBe('default_app_id');
    });

    it('should use different endpoints for dev vs prod environments', () => {
      // RED: Test for different API endpoints
      process.env['DISCORD_ENV'] = 'development';
      process.env['DISCORD_TOKEN'] = 'dev_token';
      process.env['DISCORD_APPLICATION_ID'] = 'dev_app_id';

      const devResult = determineRegistrationEnvironment();

      process.env['DISCORD_ENV'] = 'production';
      process.env['DISCORD_APPLICATION_ID'] = 'prod_app_id';
      const prodResult = determineRegistrationEnvironment();

      expect(devResult.endpoint).toBe(
        'https://discord.com/api/v10/applications/dev_app_id/commands'
      );
      expect(prodResult.endpoint).toBe(
        'https://discord.com/api/v10/applications/prod_app_id/commands'
      );
    });
  });
});
