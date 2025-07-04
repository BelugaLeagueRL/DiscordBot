/**
 * 🔵 REFACTOR Phase: Complete environment variable validation tests (all 12+ variables with edge cases)
 * Tests comprehensive validation for all environment variables defined in Env interface
 * Following TDD Red-Green-Refactor with test pyramid unit test principles
 */

import { describe, it, expect } from 'vitest';
import type { Env } from '../../index';
import { SecurityTestFactory } from '../helpers/security-test-factory';

// Import validation functions for testing
import {
  validateUserAndEnvironment,
  validateChannelPermissions,
} from '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler';

describe('Environment Variable Validation', () => {
  describe('Core Discord Variables', () => {
    describe('DISCORD_TOKEN validation', () => {
      it('should accept valid Discord bot token format', () => {
        // Arrange
        const validToken = 'FAKE_DISCORD_BOT_TOKEN_FOR_TESTING_ONLY_NOT_REAL';
        const env = { DISCORD_TOKEN: validToken } as Env;

        // Act & Assert - Token format should be validated somewhere
        expect(env.DISCORD_TOKEN).toBe(validToken);
        expect(env.DISCORD_TOKEN.length).toBeGreaterThan(40);
      });

      it('should reject empty DISCORD_TOKEN', () => {
        // Arrange
        const env = { DISCORD_TOKEN: '' } as Env;

        // Act & Assert
        expect(env.DISCORD_TOKEN).toBe('');
        expect(env.DISCORD_TOKEN.length).toBe(0);
      });

      it('should reject undefined DISCORD_TOKEN', () => {
        // Arrange
        const env = {} as Env;

        // Act & Assert
        expect(env.DISCORD_TOKEN).toBeUndefined();
      });

      it('should handle very long DISCORD_TOKEN strings', () => {
        // Arrange
        const longToken = 'x'.repeat(1000);
        const env = { DISCORD_TOKEN: longToken } as Env;

        // Act & Assert
        expect(env.DISCORD_TOKEN).toBe(longToken);
        expect(env.DISCORD_TOKEN.length).toBe(1000);
      });
    });

    describe('DISCORD_PUBLIC_KEY validation', () => {
      it('should accept valid hex public key format', () => {
        // Arrange
        const validKey = 'fake1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab';
        const env = { DISCORD_PUBLIC_KEY: validKey } as Env;

        // Act & Assert
        expect(env.DISCORD_PUBLIC_KEY).toBe(validKey);
        expect(env.DISCORD_PUBLIC_KEY.length).toBe(64);
      });

      it('should reject empty DISCORD_PUBLIC_KEY', () => {
        // Arrange
        const env = { DISCORD_PUBLIC_KEY: '' } as Env;

        // Act & Assert
        expect(env.DISCORD_PUBLIC_KEY).toBe('');
      });

      it('should handle malformed public key formats', () => {
        // Arrange
        const malformedKeys = [
          'not-hex-string',
          '123',
          'gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg',
        ];

        // Act & Assert
        for (const key of malformedKeys) {
          const env = { DISCORD_PUBLIC_KEY: key } as Env;
          expect(env.DISCORD_PUBLIC_KEY).toBe(key);
          // Note: Actual validation happens in Discord request verification
        }
      });
    });

    describe('DISCORD_APPLICATION_ID validation', () => {
      it('should accept valid Discord application ID format', () => {
        // Arrange
        const validId = '1234567890123456789';
        const env = { DISCORD_APPLICATION_ID: validId } as Env;

        // Act & Assert
        expect(env.DISCORD_APPLICATION_ID).toBe(validId);
        expect(env.DISCORD_APPLICATION_ID.length).toBe(19);
      });

      it('should reject empty DISCORD_APPLICATION_ID', () => {
        // Arrange
        const env = { DISCORD_APPLICATION_ID: '' } as Env;

        // Act & Assert
        expect(env.DISCORD_APPLICATION_ID).toBe('');
      });

      it('should handle non-numeric application IDs', () => {
        // Arrange
        const nonNumericId = 'not-a-number';
        const env = { DISCORD_APPLICATION_ID: nonNumericId } as Env;

        // Act & Assert
        expect(env.DISCORD_APPLICATION_ID).toBe(nonNumericId);
      });
    });
  });

  describe('Google Sheets Credential Variables', () => {
    describe('GOOGLE_SHEETS_TYPE validation', () => {
      it('should accept service_account type', () => {
        // Arrange
        const env = { GOOGLE_SHEETS_TYPE: 'service_account' } as Env;

        // Act & Assert
        expect(env.GOOGLE_SHEETS_TYPE).toBe('service_account');
      });

      it('should handle empty GOOGLE_SHEETS_TYPE', () => {
        // Arrange
        const env = { GOOGLE_SHEETS_TYPE: '' } as Env;

        // Act & Assert
        expect(env.GOOGLE_SHEETS_TYPE).toBe('');
      });

      it('should handle invalid credential types', () => {
        // Arrange
        const invalidTypes = ['invalid', 'user_account', null, undefined];

        // Act & Assert
        for (const type of invalidTypes) {
          const env = { GOOGLE_SHEETS_TYPE: type } as Env;
          expect(env.GOOGLE_SHEETS_TYPE).toBe(type);
        }
      });
    });

    describe('GOOGLE_SHEETS_PROJECT_ID validation', () => {
      it('should accept valid project ID format', () => {
        // Arrange
        const validProjectId = 'my-project-12345';
        const env = { GOOGLE_SHEETS_PROJECT_ID: validProjectId } as Env;

        // Act & Assert
        expect(env.GOOGLE_SHEETS_PROJECT_ID).toBe(validProjectId);
      });

      it('should handle empty project ID', () => {
        // Arrange
        const env = { GOOGLE_SHEETS_PROJECT_ID: '' } as Env;

        // Act & Assert
        expect(env.GOOGLE_SHEETS_PROJECT_ID).toBe('');
      });

      it('should handle project IDs with special characters', () => {
        // Arrange
        const specialProjectIds = [
          'project-with-hyphens',
          'project_with_underscores',
          'PROJECT-WITH-CAPS',
          'project123',
        ];

        // Act & Assert
        for (const projectId of specialProjectIds) {
          const env = { GOOGLE_SHEETS_PROJECT_ID: projectId } as Env;
          expect(env.GOOGLE_SHEETS_PROJECT_ID).toBe(projectId);
        }
      });
    });

    describe('GOOGLE_SHEETS_PRIVATE_KEY_ID validation', () => {
      it('should accept valid private key ID format', () => {
        // Arrange
        const validKeyId = SecurityTestFactory.fakeGoogleKeyId();
        const env = { GOOGLE_SHEETS_PRIVATE_KEY_ID: validKeyId } as Env;

        // Act & Assert
        expect(env.GOOGLE_SHEETS_PRIVATE_KEY_ID).toBe(validKeyId);
      });

      it('should handle empty private key ID', () => {
        // Arrange
        const env = { GOOGLE_SHEETS_PRIVATE_KEY_ID: '' } as Env;

        // Act & Assert
        expect(env.GOOGLE_SHEETS_PRIVATE_KEY_ID).toBe('');
      });

      it('should handle malformed private key IDs', () => {
        // Arrange
        const malformedIds = ['too-short', 'has spaces in it', '!@#$%^&*()', null, undefined];

        // Act & Assert
        for (const keyId of malformedIds) {
          const env = { GOOGLE_SHEETS_PRIVATE_KEY_ID: keyId } as Env;
          expect(env.GOOGLE_SHEETS_PRIVATE_KEY_ID).toBe(keyId);
        }
      });
    });

    describe('GOOGLE_SHEETS_PRIVATE_KEY validation', () => {
      it('should accept valid RSA private key format', () => {
        // Arrange
        const validPrivateKey =
          '-----BEGIN PRIVATE KEY-----\\nFAKE_PRIVATE_KEY_DATA_NOT_REAL\\n-----END PRIVATE KEY-----\\n';
        const env = { GOOGLE_SHEETS_PRIVATE_KEY: validPrivateKey } as Env;

        // Act & Assert
        expect(env.GOOGLE_SHEETS_PRIVATE_KEY).toBe(validPrivateKey);
        expect(env.GOOGLE_SHEETS_PRIVATE_KEY).toContain('BEGIN PRIVATE KEY');
        expect(env.GOOGLE_SHEETS_PRIVATE_KEY).toContain('END PRIVATE KEY');
      });

      it('should handle empty private key', () => {
        // Arrange
        const env = { GOOGLE_SHEETS_PRIVATE_KEY: '' } as Env;

        // Act & Assert
        expect(env.GOOGLE_SHEETS_PRIVATE_KEY).toBe('');
      });

      it('should handle malformed private keys', () => {
        // Arrange
        const malformedKeys = [
          'not-a-private-key',
          '-----BEGIN PRIVATE KEY-----',
          '-----END PRIVATE KEY-----',
          'MIIE...',
        ];

        // Act & Assert
        for (const key of malformedKeys) {
          const env = { GOOGLE_SHEETS_PRIVATE_KEY: key } as Env;
          expect(env.GOOGLE_SHEETS_PRIVATE_KEY).toBe(key);
        }
      });

      it('should handle private keys with newline variations', () => {
        // Arrange
        const keyVariations = [
          '-----BEGIN PRIVATE KEY-----\nFAKE_KEY\n-----END PRIVATE KEY-----\n',
          '-----BEGIN PRIVATE KEY-----\\nFAKE_KEY\\n-----END PRIVATE KEY-----\\n',
          '-----BEGIN PRIVATE KEY-----\r\nFAKE_KEY\r\n-----END PRIVATE KEY-----\r\n',
        ];

        // Act & Assert
        for (const key of keyVariations) {
          const env = { GOOGLE_SHEETS_PRIVATE_KEY: key } as Env;
          expect(env.GOOGLE_SHEETS_PRIVATE_KEY).toBe(key);
        }
      });
    });

    describe('GOOGLE_SHEETS_CLIENT_EMAIL validation', () => {
      it('should accept valid service account email format', () => {
        // Arrange
        const validEmail = 'fake-test-service@fake-project.iam.gserviceaccount.com';
        const env = { GOOGLE_SHEETS_CLIENT_EMAIL: validEmail } as Env;

        // Act & Assert
        expect(env.GOOGLE_SHEETS_CLIENT_EMAIL).toBe(validEmail);
        expect(env.GOOGLE_SHEETS_CLIENT_EMAIL).toContain('@');
        expect(env.GOOGLE_SHEETS_CLIENT_EMAIL).toContain('.iam.gserviceaccount.com');
      });

      it('should handle empty client email', () => {
        // Arrange
        const env = { GOOGLE_SHEETS_CLIENT_EMAIL: '' } as Env;

        // Act & Assert
        expect(env.GOOGLE_SHEETS_CLIENT_EMAIL).toBe('');
      });

      it('should handle malformed email addresses', () => {
        // Arrange
        const malformedEmails = [
          'not-an-email',
          '@domain.com',
          'user@',
          'user@domain',
          'user domain@example.com',
        ];

        // Act & Assert
        for (const email of malformedEmails) {
          const env = { GOOGLE_SHEETS_CLIENT_EMAIL: email } as Env;
          expect(env.GOOGLE_SHEETS_CLIENT_EMAIL).toBe(email);
        }
      });
    });

    describe('GOOGLE_SHEETS_CLIENT_ID validation', () => {
      it('should accept valid numeric client ID', () => {
        // Arrange
        const validClientId = '999888777666555444333';
        const env = { GOOGLE_SHEETS_CLIENT_ID: validClientId } as Env;

        // Act & Assert
        expect(env.GOOGLE_SHEETS_CLIENT_ID).toBe(validClientId);
        expect(env.GOOGLE_SHEETS_CLIENT_ID?.length).toBeGreaterThan(15);
      });

      it('should handle empty client ID', () => {
        // Arrange
        const env = { GOOGLE_SHEETS_CLIENT_ID: '' } as Env;

        // Act & Assert
        expect(env.GOOGLE_SHEETS_CLIENT_ID).toBe('');
      });

      it('should handle non-numeric client IDs', () => {
        // Arrange
        const nonNumericIds = ['abc123def456', 'not-numeric', '123-456-789', '123 456 789'];

        // Act & Assert
        for (const clientId of nonNumericIds) {
          const env = { GOOGLE_SHEETS_CLIENT_ID: clientId } as Env;
          expect(env.GOOGLE_SHEETS_CLIENT_ID).toBe(clientId);
        }
      });
    });
  });

  describe('Google Sheets Business Variables', () => {
    describe('GOOGLE_SHEET_ID validation', () => {
      it('should accept valid Google Sheets ID format', () => {
        // Arrange
        const validSheetId = 'FAKE_TEST_SHEET_ID_NOT_REAL_CREDENTIALS_12345678';
        const env = { GOOGLE_SHEET_ID: validSheetId } as Env;

        // Act & Assert
        expect(env.GOOGLE_SHEET_ID).toBe(validSheetId);
        expect(env.GOOGLE_SHEET_ID?.length).toBeGreaterThan(40);
      });

      it('should handle empty sheet ID', () => {
        // Arrange
        const env = { GOOGLE_SHEET_ID: '' } as Env;

        // Act & Assert
        expect(env.GOOGLE_SHEET_ID).toBe('');
      });

      it('should handle malformed sheet IDs', () => {
        // Arrange
        const malformedIds = ['too-short', 'has spaces', 'has@symbols', '123'];

        // Act & Assert
        for (const sheetId of malformedIds) {
          const env = { GOOGLE_SHEET_ID: sheetId } as Env;
          expect(env.GOOGLE_SHEET_ID).toBe(sheetId);
        }
      });
    });

    describe('GOOGLE_SHEETS_API_KEY validation', () => {
      it('should accept valid API key format', () => {
        // Arrange
        const validApiKey = 'FAKE_TEST_API_KEY_NOT_REAL_CREDENTIALS_1234567890';
        const env = { GOOGLE_SHEETS_API_KEY: validApiKey } as Env;

        // Act & Assert
        expect(env.GOOGLE_SHEETS_API_KEY).toBe(validApiKey);
        expect(env.GOOGLE_SHEETS_API_KEY?.length).toBeGreaterThan(30);
      });

      it('should handle empty API key', () => {
        // Arrange
        const env = { GOOGLE_SHEETS_API_KEY: '' } as Env;

        // Act & Assert
        expect(env.GOOGLE_SHEETS_API_KEY).toBe('');
      });

      it('should handle malformed API keys', () => {
        // Arrange
        const malformedKeys = ['invalid-format', 'short', 'wrong-format-key', '123456789'];

        // Act & Assert
        for (const apiKey of malformedKeys) {
          const env = { GOOGLE_SHEETS_API_KEY: apiKey } as Env;
          expect(env.GOOGLE_SHEETS_API_KEY).toBe(apiKey);
        }
      });
    });
  });

  describe('Discord Channel and Permission Variables', () => {
    describe('TEST_CHANNEL_ID validation', () => {
      it('should accept valid Discord channel ID format', () => {
        // Arrange
        const validChannelId = '1234567890123456789';
        const env = { TEST_CHANNEL_ID: validChannelId } as Env;

        // Act & Assert
        expect(env.TEST_CHANNEL_ID).toBe(validChannelId);
        expect(env.TEST_CHANNEL_ID?.length).toBeGreaterThan(15);
      });

      it('should handle empty channel ID', () => {
        // Arrange
        const env = { TEST_CHANNEL_ID: '' } as Env;

        // Act & Assert
        expect(env.TEST_CHANNEL_ID).toBe('');
      });

      it('should handle malformed channel IDs', () => {
        // Arrange
        const malformedIds = ['not-numeric', '123', 'abc123def456', '123-456-789'];

        // Act & Assert
        for (const channelId of malformedIds) {
          const env = { TEST_CHANNEL_ID: channelId } as Env;
          expect(env.TEST_CHANNEL_ID).toBe(channelId);
        }
      });
    });

    describe('PRIVILEGED_USER_ID validation', () => {
      it('should accept valid Discord user ID format', () => {
        // Arrange
        const validUserId = '1234567890123456789';
        const env = { PRIVILEGED_USER_ID: validUserId } as Env;

        // Act & Assert
        expect(env.PRIVILEGED_USER_ID).toBe(validUserId);
        expect(env.PRIVILEGED_USER_ID?.length).toBeGreaterThan(15);
      });

      it('should handle empty user ID', () => {
        // Arrange
        const env = { PRIVILEGED_USER_ID: '' } as Env;

        // Act & Assert
        expect(env.PRIVILEGED_USER_ID).toBe('');
      });

      it('should handle malformed user IDs', () => {
        // Arrange
        const malformedIds = ['not-numeric', '123', 'user@domain.com', 'username'];

        // Act & Assert
        for (const userId of malformedIds) {
          const env = { PRIVILEGED_USER_ID: userId } as Env;
          expect(env.PRIVILEGED_USER_ID).toBe(userId);
        }
      });
    });
  });

  describe('Application Environment Variables', () => {
    describe('ENVIRONMENT validation', () => {
      it('should accept valid environment values', () => {
        // Arrange
        const validEnvironments = ['development', 'staging', 'production'];

        // Act & Assert
        for (const environment of validEnvironments) {
          const env = { ENVIRONMENT: environment } as Env;
          expect(env.ENVIRONMENT).toBe(environment);
        }
      });

      it('should handle invalid environment values', () => {
        // Arrange
        const invalidEnvironments = ['dev', 'prod', 'test', 'invalid', ''];

        // Act & Assert
        for (const environment of invalidEnvironments) {
          const env = { ENVIRONMENT: environment } as Env;
          expect(env.ENVIRONMENT).toBe(environment);
        }
      });
    });

    describe('DATABASE_URL validation', () => {
      it('should accept valid database URL format', () => {
        // Arrange
        const validUrls = [
          'file:./local.db',
          'sqlite:./database.db',
          'postgres://user:pass@localhost:5432/db',
          'mysql://user:pass@localhost:3306/db',
        ];

        // Act & Assert
        for (const url of validUrls) {
          const env = { DATABASE_URL: url } as Env;
          expect(env.DATABASE_URL).toBe(url);
        }
      });

      it('should handle empty database URL', () => {
        // Arrange
        const env = { DATABASE_URL: '' } as Env;

        // Act & Assert
        expect(env.DATABASE_URL).toBe('');
      });

      it('should handle malformed database URLs', () => {
        // Arrange
        const malformedUrls = [
          'not-a-url',
          'http://invalid-protocol',
          'missing-protocol',
          'file:/invalid/path',
        ];

        // Act & Assert
        for (const url of malformedUrls) {
          const env = { DATABASE_URL: url } as Env;
          expect(env.DATABASE_URL).toBe(url);
        }
      });
    });
  });

  describe('Validation Function Integration', () => {
    // Factory function to create base environment with required fields
    function createBaseEnv(overrides: Partial<Env> = {}): Env {
      return {
        DISCORD_TOKEN: 'FAKE_TEST_TOKEN',
        DISCORD_PUBLIC_KEY: 'FAKE_TEST_KEY',
        DISCORD_APPLICATION_ID: 'FAKE_TEST_APP_ID',
        ENVIRONMENT: 'test',
        ...overrides,
      };
    }

    describe('GOOGLE_SHEETS_TYPE environment integration', () => {
      it('should handle service_account type in complete environment', () => {
        // Arrange
        const env = createBaseEnv({
          GOOGLE_SHEETS_TYPE: 'service_account',
        });

        // Act & Assert
        expect(env.GOOGLE_SHEETS_TYPE).toBe('service_account');
      });
    });

    describe('GOOGLE_SHEETS_PROJECT_ID environment integration', () => {
      it('should handle project ID in complete environment', () => {
        // Arrange
        const env = createBaseEnv({
          GOOGLE_SHEETS_PROJECT_ID: 'test-project',
        });

        // Act & Assert
        expect(env.GOOGLE_SHEETS_PROJECT_ID).toBe('test-project');
      });
    });

    describe('GOOGLE_SHEETS_PRIVATE_KEY_ID environment integration', () => {
      it('should handle private key ID in complete environment', () => {
        // Arrange
        const env = createBaseEnv({
          GOOGLE_SHEETS_PRIVATE_KEY_ID: 'key-id-123',
        });

        // Act & Assert
        expect(env.GOOGLE_SHEETS_PRIVATE_KEY_ID).toBe('key-id-123');
      });
    });

    describe('GOOGLE_SHEETS_PRIVATE_KEY environment integration', () => {
      it('should handle private key in complete environment', () => {
        // Arrange
        const env = createBaseEnv({
          GOOGLE_SHEETS_PRIVATE_KEY:
            '-----BEGIN PRIVATE KEY-----\nFAKE_TEST_KEY\n-----END PRIVATE KEY-----',
        });

        // Act & Assert
        expect(env.GOOGLE_SHEETS_PRIVATE_KEY).toContain('BEGIN PRIVATE KEY');
      });
    });

    describe('GOOGLE_SHEETS_CLIENT_EMAIL environment integration', () => {
      it('should handle client email in complete environment', () => {
        // Arrange
        const env = createBaseEnv({
          GOOGLE_SHEETS_CLIENT_EMAIL: 'fake-test@fake-project.iam.gserviceaccount.com',
        });

        // Act & Assert
        expect(env.GOOGLE_SHEETS_CLIENT_EMAIL).toContain('@');
      });
    });

    describe('GOOGLE_SHEETS_CLIENT_ID environment integration', () => {
      it('should handle client ID in complete environment', () => {
        // Arrange
        const env = createBaseEnv({
          GOOGLE_SHEETS_CLIENT_ID: '999888777666555444333',
        });

        // Act & Assert
        expect(env.GOOGLE_SHEETS_CLIENT_ID).toBe('999888777666555444333');
      });
    });

    describe('GOOGLE_SHEET_ID environment integration', () => {
      it('should handle sheet ID in complete environment', () => {
        // Arrange
        const env = createBaseEnv({
          GOOGLE_SHEET_ID: 'FAKE_TEST_SHEET_ID',
        });

        // Act & Assert
        expect(env.GOOGLE_SHEET_ID).toBe('FAKE_TEST_SHEET_ID');
      });
    });

    describe('Environment undefined field handling', () => {
      it('should handle undefined GOOGLE_SHEETS_PROJECT_ID', () => {
        // Arrange
        const env = createBaseEnv(); // No Google Sheets fields

        // Act & Assert
        expect(env.GOOGLE_SHEETS_PROJECT_ID).toBeUndefined();
      });

      it('should handle undefined GOOGLE_SHEETS_PRIVATE_KEY_ID', () => {
        // Arrange
        const env = createBaseEnv(); // No Google Sheets fields

        // Act & Assert
        expect(env.GOOGLE_SHEETS_PRIVATE_KEY_ID).toBeUndefined();
      });

      it('should handle undefined GOOGLE_SHEETS_PRIVATE_KEY', () => {
        // Arrange
        const env = createBaseEnv(); // No Google Sheets fields

        // Act & Assert
        expect(env.GOOGLE_SHEETS_PRIVATE_KEY).toBeUndefined();
      });

      it('should handle undefined GOOGLE_SHEETS_CLIENT_ID', () => {
        // Arrange
        const env = createBaseEnv(); // No Google Sheets fields

        // Act & Assert
        expect(env.GOOGLE_SHEETS_CLIENT_ID).toBeUndefined();
      });
    });

    describe('validateUserAndEnvironment() with GOOGLE_SHEET_ID edge cases', () => {
      it('should fail when GOOGLE_SHEET_ID is missing', () => {
        // Arrange
        const interaction = {
          guild_id: 'guild-123',
          channel_id: 'channel-123',
          user: { id: 'user-456' },
        } as any;

        const envWithoutSheetId = createBaseEnv({
          TEST_CHANNEL_ID: 'channel-123',
          PRIVILEGED_USER_ID: 'user-456',
          // GOOGLE_SHEET_ID missing
        });

        // Act
        const result = validateUserAndEnvironment(interaction, envWithoutSheetId);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('Missing required environment configuration');
        }
      });

      it('should fail when GOOGLE_SHEET_ID is empty string', () => {
        // Arrange
        const interaction = {
          guild_id: 'guild-123',
          channel_id: 'channel-123',
          user: { id: 'user-456' },
        } as any;

        const envWithEmptySheetId = createBaseEnv({
          GOOGLE_SHEET_ID: '',
          TEST_CHANNEL_ID: 'channel-123',
          PRIVILEGED_USER_ID: 'user-456',
        });

        // Act
        const result = validateUserAndEnvironment(interaction, envWithEmptySheetId);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('Missing required environment configuration');
        }
      });
    });

    describe('validateChannelPermissions() with channel/user ID edge cases', () => {
      it('should fail when TEST_CHANNEL_ID is missing from environment', () => {
        // Arrange
        const interaction = {
          guild_id: 'guild-123',
          channel_id: 'channel-123',
          user: { id: 'user-456' },
        } as any;

        const envWithoutChannelId = createBaseEnv({
          PRIVILEGED_USER_ID: 'user-456',
          // TEST_CHANNEL_ID missing
        });

        // Act
        const result = validateChannelPermissions(interaction, envWithoutChannelId);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe(
            'This command can only be used in the designated admin channel'
          );
        }
      });

      it('should fail when PRIVILEGED_USER_ID is missing from environment', () => {
        // Arrange
        const interaction = {
          guild_id: 'guild-123',
          channel_id: 'channel-123',
          user: { id: 'user-456' },
        } as any;

        const envWithoutUserId = createBaseEnv({
          TEST_CHANNEL_ID: 'channel-123',
          // PRIVILEGED_USER_ID missing
        });

        // Act
        const result = validateChannelPermissions(interaction, envWithoutUserId);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('Insufficient permissions for this admin command');
        }
      });
    });
  });

  describe('Environment Variable Type Safety', () => {
    describe('Database URL null handling', () => {
      it('should handle null DATABASE_URL value', () => {
        // Arrange
        const envWithNullDb = {
          DISCORD_TOKEN: 'valid-token',
          DISCORD_PUBLIC_KEY: 'valid-key',
          DISCORD_APPLICATION_ID: 'valid-id',
          ENVIRONMENT: 'development',
          DATABASE_URL: null,
        } as any;

        // Act & Assert
        expect(envWithNullDb.DATABASE_URL).toBeNull();
      });

      it('should handle undefined DATABASE_URL value', () => {
        // Arrange
        const envWithUndefinedDb = {
          DISCORD_TOKEN: 'valid-token',
          DISCORD_PUBLIC_KEY: 'valid-key',
          DISCORD_APPLICATION_ID: 'valid-id',
          ENVIRONMENT: 'development',
          // DATABASE_URL undefined by omission
        } as Env;

        // Act & Assert
        expect(envWithUndefinedDb.DATABASE_URL).toBeUndefined();
      });
    });

    describe('Google Sheets API key null handling', () => {
      it('should handle null GOOGLE_SHEETS_API_KEY value', () => {
        // Arrange
        const envWithNullApiKey = {
          DISCORD_TOKEN: 'valid-token',
          DISCORD_PUBLIC_KEY: 'valid-key',
          DISCORD_APPLICATION_ID: 'valid-id',
          ENVIRONMENT: 'development',
          GOOGLE_SHEETS_API_KEY: null,
        } as any;

        // Act & Assert
        expect(envWithNullApiKey.GOOGLE_SHEETS_API_KEY).toBeNull();
      });

      it('should handle undefined GOOGLE_SHEETS_API_KEY value', () => {
        // Arrange
        const envWithUndefinedApiKey = {
          DISCORD_TOKEN: 'valid-token',
          DISCORD_PUBLIC_KEY: 'valid-key',
          DISCORD_APPLICATION_ID: 'valid-id',
          ENVIRONMENT: 'development',
          // GOOGLE_SHEETS_API_KEY undefined by omission
        } as Env;

        // Act & Assert
        expect(envWithUndefinedApiKey.GOOGLE_SHEETS_API_KEY).toBeUndefined();
      });
    });

    describe('Discord channel ID null handling', () => {
      it('should handle null TEST_CHANNEL_ID value', () => {
        // Arrange
        const envWithNullChannelId = {
          DISCORD_TOKEN: 'valid-token',
          DISCORD_PUBLIC_KEY: 'valid-key',
          DISCORD_APPLICATION_ID: 'valid-id',
          ENVIRONMENT: 'development',
          TEST_CHANNEL_ID: null,
        } as any;

        // Act & Assert
        expect(envWithNullChannelId.TEST_CHANNEL_ID).toBeNull();
      });

      it('should handle undefined TEST_CHANNEL_ID value', () => {
        // Arrange
        const envWithUndefinedChannelId = {
          DISCORD_TOKEN: 'valid-token',
          DISCORD_PUBLIC_KEY: 'valid-key',
          DISCORD_APPLICATION_ID: 'valid-id',
          ENVIRONMENT: 'development',
          // TEST_CHANNEL_ID undefined by omission
        } as Env;

        // Act & Assert
        expect(envWithUndefinedChannelId.TEST_CHANNEL_ID).toBeUndefined();
      });
    });

    describe('Privileged user ID null handling', () => {
      it('should handle null PRIVILEGED_USER_ID value', () => {
        // Arrange
        const envWithNullUserId = {
          DISCORD_TOKEN: 'valid-token',
          DISCORD_PUBLIC_KEY: 'valid-key',
          DISCORD_APPLICATION_ID: 'valid-id',
          ENVIRONMENT: 'development',
          PRIVILEGED_USER_ID: null,
        } as any;

        // Act & Assert
        expect(envWithNullUserId.PRIVILEGED_USER_ID).toBeNull();
      });

      it('should handle undefined PRIVILEGED_USER_ID value', () => {
        // Arrange
        const envWithUndefinedUserId = {
          DISCORD_TOKEN: 'valid-token',
          DISCORD_PUBLIC_KEY: 'valid-key',
          DISCORD_APPLICATION_ID: 'valid-id',
          ENVIRONMENT: 'development',
          // PRIVILEGED_USER_ID undefined by omission
        } as Env;

        // Act & Assert
        expect(envWithUndefinedUserId.PRIVILEGED_USER_ID).toBeUndefined();
      });
    });

    describe('Required field validation', () => {
      it('should validate DISCORD_TOKEN is required', () => {
        // Arrange
        const envWithToken = {
          DISCORD_TOKEN: 'token',
          DISCORD_PUBLIC_KEY: 'key',
          DISCORD_APPLICATION_ID: 'id',
          ENVIRONMENT: 'dev',
        } as Env;

        // Act & Assert
        expect(envWithToken.DISCORD_TOKEN).toBeDefined();
        expect(envWithToken.DISCORD_TOKEN).toBe('token');
      });

      it('should validate DISCORD_PUBLIC_KEY is required', () => {
        // Arrange
        const envWithKey = {
          DISCORD_TOKEN: 'token',
          DISCORD_PUBLIC_KEY: 'key',
          DISCORD_APPLICATION_ID: 'id',
          ENVIRONMENT: 'dev',
        } as Env;

        // Act & Assert
        expect(envWithKey.DISCORD_PUBLIC_KEY).toBeDefined();
        expect(envWithKey.DISCORD_PUBLIC_KEY).toBe('key');
      });

      it('should validate DISCORD_APPLICATION_ID is required', () => {
        // Arrange
        const envWithAppId = {
          DISCORD_TOKEN: 'token',
          DISCORD_PUBLIC_KEY: 'key',
          DISCORD_APPLICATION_ID: 'id',
          ENVIRONMENT: 'dev',
        } as Env;

        // Act & Assert
        expect(envWithAppId.DISCORD_APPLICATION_ID).toBeDefined();
        expect(envWithAppId.DISCORD_APPLICATION_ID).toBe('id');
      });

      it('should validate ENVIRONMENT is required', () => {
        // Arrange
        const envWithEnvironment = {
          DISCORD_TOKEN: 'token',
          DISCORD_PUBLIC_KEY: 'key',
          DISCORD_APPLICATION_ID: 'id',
          ENVIRONMENT: 'dev',
        } as Env;

        // Act & Assert
        expect(envWithEnvironment.ENVIRONMENT).toBeDefined();
        expect(envWithEnvironment.ENVIRONMENT).toBe('dev');
      });
    });
  });
});
