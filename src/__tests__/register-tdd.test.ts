/**
 * TDD approach for register.ts coverage
 * Following Red-Green-Refactor methodology
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  validateEnvironmentVariables,
  determineRegistrationEnvironment,
} from '../utils/command-registration';
import { TEST_URLS } from './config/test-urls';

describe('TDD Register Coverage', () => {
  let originalEnv: typeof process.env;

  beforeEach(() => {
    originalEnv = { ...process.env };
    // Clear all environment variables to start with clean state
    delete process.env['DISCORD_TOKEN'];
    delete process.env['DISCORD_APPLICATION_ID'];
    delete process.env['DISCORD_PUBLIC_KEY'];
    delete process.env['GOOGLE_SHEET_ID'];
    delete process.env['GOOGLE_SHEETS_TYPE'];
    delete process.env['GOOGLE_SHEETS_PROJECT_ID'];
    delete process.env['GOOGLE_SHEETS_PRIVATE_KEY_ID'];
    delete process.env['GOOGLE_SHEETS_PRIVATE_KEY'];
    delete process.env['GOOGLE_SHEETS_CLIENT_EMAIL'];
    delete process.env['GOOGLE_SHEETS_CLIENT_ID'];
    delete process.env['TEST_CHANNEL_ID'];
    delete process.env['PRIVILEGED_USER_ID'];
    delete process.env['DISCORD_ENV'];
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('environment validation', () => {
    it('should throw when DISCORD_TOKEN is missing', () => {
      // REFACTOR: Test the extracted validation function directly
      // Only DISCORD_TOKEN is missing, all others are present
      process.env['DISCORD_APPLICATION_ID'] = 'test_app_id';
      process.env['DISCORD_PUBLIC_KEY'] = 'test_public_key';
      process.env['GOOGLE_SHEET_ID'] = 'test_sheet_id';
      process.env['GOOGLE_SHEETS_TYPE'] = 'service_account';
      process.env['GOOGLE_SHEETS_PROJECT_ID'] = 'test_project_id';
      process.env['GOOGLE_SHEETS_PRIVATE_KEY_ID'] = 'test_private_key_id';
      process.env['GOOGLE_SHEETS_PRIVATE_KEY'] = 'test_private_key';
      process.env['GOOGLE_SHEETS_CLIENT_EMAIL'] = 'test@test.com';
      process.env['GOOGLE_SHEETS_CLIENT_ID'] = 'test_client_id';
      process.env['TEST_CHANNEL_ID'] = 'test_channel_id';
      process.env['PRIVILEGED_USER_ID'] = 'test_user_id';

      expect(() => {
        validateEnvironmentVariables();
      }).toThrow('Missing required environment variable: DISCORD_TOKEN');
    });

    it('should throw when DISCORD_APPLICATION_ID is missing', () => {
      // GREEN: Test for missing APP_ID using extracted function
      // Only DISCORD_APPLICATION_ID is missing, all others are present
      process.env['DISCORD_TOKEN'] = 'test_token';
      process.env['DISCORD_PUBLIC_KEY'] = 'test_public_key';
      process.env['GOOGLE_SHEET_ID'] = 'test_sheet_id';
      process.env['GOOGLE_SHEETS_TYPE'] = 'service_account';
      process.env['GOOGLE_SHEETS_PROJECT_ID'] = 'test_project_id';
      process.env['GOOGLE_SHEETS_PRIVATE_KEY_ID'] = 'test_private_key_id';
      process.env['GOOGLE_SHEETS_PRIVATE_KEY'] = 'test_private_key';
      process.env['GOOGLE_SHEETS_CLIENT_EMAIL'] = 'test@test.com';
      process.env['GOOGLE_SHEETS_CLIENT_ID'] = 'test_client_id';
      process.env['TEST_CHANNEL_ID'] = 'test_channel_id';
      process.env['PRIVILEGED_USER_ID'] = 'test_user_id';

      expect(() => {
        validateEnvironmentVariables();
      }).toThrow('Missing required environment variable: DISCORD_APPLICATION_ID');
    });

    it('should return environment variables when all are present', () => {
      // GREEN: Positive test case
      process.env['DISCORD_TOKEN'] = 'test_token_123';
      process.env['DISCORD_APPLICATION_ID'] = 'test_app_id_456';
      process.env['DISCORD_PUBLIC_KEY'] = 'test_public_key';
      process.env['GOOGLE_SHEET_ID'] = 'test_sheet_id';
      process.env['GOOGLE_SHEETS_TYPE'] = 'service_account';
      process.env['GOOGLE_SHEETS_PROJECT_ID'] = 'test_project_id';
      process.env['GOOGLE_SHEETS_PRIVATE_KEY_ID'] = 'test_private_key_id';
      process.env['GOOGLE_SHEETS_PRIVATE_KEY'] = 'test_private_key';
      process.env['GOOGLE_SHEETS_CLIENT_EMAIL'] = 'test@test.com';
      process.env['GOOGLE_SHEETS_CLIENT_ID'] = 'test_client_id';
      process.env['TEST_CHANNEL_ID'] = 'test_channel_id';
      process.env['PRIVILEGED_USER_ID'] = 'test_user_id';

      const result = validateEnvironmentVariables();

      expect(result).toEqual({
        token: 'test_token_123',
        applicationId: 'test_app_id_456',
        publicKey: 'test_public_key',
        googleSheetId: 'test_sheet_id',
        googleSheetsType: 'service_account',
        googleSheetsProjectId: 'test_project_id',
        googleSheetsPrivateKeyId: 'test_private_key_id',
        googleSheetsPrivateKey: 'test_private_key',
        googleSheetsClientEmail: 'test@test.com',
        googleSheetsClientId: 'test_client_id',
        testChannelId: 'test_channel_id',
        privilegedUserId: 'test_user_id',
      });
    });
  });

  describe('environment-specific registration', () => {
    it('should determine development environment when DISCORD_ENV=development', () => {
      // RED: Test for development environment detection
      process.env['DISCORD_ENV'] = 'development';
      process.env['DISCORD_TOKEN'] = 'test_token';
      process.env['DISCORD_APPLICATION_ID'] = 'test_app_id';
      process.env['DISCORD_PUBLIC_KEY'] = 'test_public_key';
      process.env['GOOGLE_SHEET_ID'] = 'test_sheet_id';
      process.env['GOOGLE_SHEETS_TYPE'] = 'service_account';
      process.env['GOOGLE_SHEETS_PROJECT_ID'] = 'test_project_id';
      process.env['GOOGLE_SHEETS_PRIVATE_KEY_ID'] = 'test_private_key_id';
      process.env['GOOGLE_SHEETS_PRIVATE_KEY'] = 'test_private_key';
      process.env['GOOGLE_SHEETS_CLIENT_EMAIL'] = 'test@test.com';
      process.env['GOOGLE_SHEETS_CLIENT_ID'] = 'test_client_id';
      process.env['TEST_CHANNEL_ID'] = 'test_channel_id';
      process.env['PRIVILEGED_USER_ID'] = 'test_user_id';

      const result = determineRegistrationEnvironment();

      expect(result.environment).toBe('development');
      expect(result.applicationId).toBe('test_app_id');
    });

    it('should determine production environment when DISCORD_ENV=production', () => {
      // RED: Test for production environment detection
      process.env['DISCORD_ENV'] = 'production';
      process.env['DISCORD_TOKEN'] = 'prod_token';
      process.env['DISCORD_APPLICATION_ID'] = 'prod_app_id';
      process.env['DISCORD_PUBLIC_KEY'] = 'test_public_key';
      process.env['GOOGLE_SHEET_ID'] = 'test_sheet_id';
      process.env['GOOGLE_SHEETS_TYPE'] = 'service_account';
      process.env['GOOGLE_SHEETS_PROJECT_ID'] = 'test_project_id';
      process.env['GOOGLE_SHEETS_PRIVATE_KEY_ID'] = 'test_private_key_id';
      process.env['GOOGLE_SHEETS_PRIVATE_KEY'] = 'test_private_key';
      process.env['GOOGLE_SHEETS_CLIENT_EMAIL'] = 'test@test.com';
      process.env['GOOGLE_SHEETS_CLIENT_ID'] = 'test_client_id';
      process.env['TEST_CHANNEL_ID'] = 'test_channel_id';
      process.env['PRIVILEGED_USER_ID'] = 'test_user_id';

      const result = determineRegistrationEnvironment();

      expect(result.environment).toBe('production');
      expect(result.applicationId).toBe('prod_app_id');
    });

    it('should default to development when DISCORD_ENV is not set', () => {
      // RED: Test for default environment behavior
      delete process.env['DISCORD_ENV'];
      process.env['DISCORD_TOKEN'] = 'default_token';
      process.env['DISCORD_APPLICATION_ID'] = 'default_app_id';
      process.env['DISCORD_PUBLIC_KEY'] = 'test_public_key';
      process.env['GOOGLE_SHEET_ID'] = 'test_sheet_id';
      process.env['GOOGLE_SHEETS_TYPE'] = 'service_account';
      process.env['GOOGLE_SHEETS_PROJECT_ID'] = 'test_project_id';
      process.env['GOOGLE_SHEETS_PRIVATE_KEY_ID'] = 'test_private_key_id';
      process.env['GOOGLE_SHEETS_PRIVATE_KEY'] = 'test_private_key';
      process.env['GOOGLE_SHEETS_CLIENT_EMAIL'] = 'test@test.com';
      process.env['GOOGLE_SHEETS_CLIENT_ID'] = 'test_client_id';
      process.env['TEST_CHANNEL_ID'] = 'test_channel_id';
      process.env['PRIVILEGED_USER_ID'] = 'test_user_id';

      const result = determineRegistrationEnvironment();

      expect(result.environment).toBe('development');
      expect(result.applicationId).toBe('default_app_id');
    });

    it('should use different endpoints for dev vs prod environments', () => {
      // RED: Test for different API endpoints
      process.env['DISCORD_ENV'] = 'development';
      process.env['DISCORD_TOKEN'] = 'dev_token';
      process.env['DISCORD_APPLICATION_ID'] = 'dev_app_id';
      process.env['DISCORD_PUBLIC_KEY'] = 'test_public_key';
      process.env['GOOGLE_SHEET_ID'] = 'test_sheet_id';
      process.env['GOOGLE_SHEETS_TYPE'] = 'service_account';
      process.env['GOOGLE_SHEETS_PROJECT_ID'] = 'test_project_id';
      process.env['GOOGLE_SHEETS_PRIVATE_KEY_ID'] = 'test_private_key_id';
      process.env['GOOGLE_SHEETS_PRIVATE_KEY'] = 'test_private_key';
      process.env['GOOGLE_SHEETS_CLIENT_EMAIL'] = 'test@test.com';
      process.env['GOOGLE_SHEETS_CLIENT_ID'] = 'test_client_id';
      process.env['TEST_CHANNEL_ID'] = 'test_channel_id';
      process.env['PRIVILEGED_USER_ID'] = 'test_user_id';

      const devResult = determineRegistrationEnvironment();

      process.env['DISCORD_ENV'] = 'production';
      process.env['DISCORD_APPLICATION_ID'] = 'prod_app_id';
      const prodResult = determineRegistrationEnvironment();

      expect(devResult.endpoint).toBe(TEST_URLS.DISCORD.COMMANDS('dev_app_id'));
      expect(prodResult.endpoint).toBe(TEST_URLS.DISCORD.COMMANDS('prod_app_id'));
    });
  });
});
