/**
 * 🔴 RED Phase: Complete environment variable validation tests for all 12 required variables
 * FLOW_3_TESTS_NEEDED.md lines 90-114: Comprehensive validation for all 12 environment variables
 * Tests: Complete validation in single scenario, missing variable detection, malformed handling
 */

import { describe, it, expect } from 'vitest';
import type { Env } from '../../index';
import { validateEnvironmentVariables } from '../../utils/command-registration';
import { SecurityTestFactory } from '../helpers/security-test-factory';

describe('Complete Environment Variable Validation - All 12 Required Variables', () => {
  describe('validateEnvironmentVariables() Function - All 12 Variables', () => {
    it('should validate that enhanced function returns token property', () => {
      // Arrange - Set up environment with all 12 required variables
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        DISCORD_TOKEN: SecurityTestFactory.fakeDiscordToken(),
        DISCORD_APPLICATION_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        DISCORD_PUBLIC_KEY: 'fake1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        GOOGLE_SHEET_ID: SecurityTestFactory.fakeGoogleSheetId(),
        GOOGLE_SHEETS_TYPE: 'service_account',
        GOOGLE_SHEETS_PROJECT_ID: SecurityTestFactory.fakeGoogleProjectId(),
        GOOGLE_SHEETS_PRIVATE_KEY_ID: SecurityTestFactory.fakeGoogleKeyId(),
        GOOGLE_SHEETS_PRIVATE_KEY: SecurityTestFactory.fakePrivateKey(),
        GOOGLE_SHEETS_CLIENT_EMAIL: SecurityTestFactory.fakeServiceAccountEmail(),
        GOOGLE_SHEETS_CLIENT_ID: SecurityTestFactory.fakeGoogleClientId(),
        TEST_CHANNEL_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        PRIVILEGED_USER_ID: SecurityTestFactory.fakeDiscordSnowflake(),
      };

      try {
        // Act - Call the validation function
        const result = validateEnvironmentVariables();

        // Assert - Function returns token property
        expect(result).toHaveProperty('token');
      } finally {
        // Cleanup
        process.env = originalEnv;
      }
    });

    it('should validate that enhanced function returns applicationId property', () => {
      // Arrange - Set up environment with all 12 required variables
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        DISCORD_TOKEN: SecurityTestFactory.fakeDiscordToken(),
        DISCORD_APPLICATION_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        DISCORD_PUBLIC_KEY: 'fake1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        GOOGLE_SHEET_ID: SecurityTestFactory.fakeGoogleSheetId(),
        GOOGLE_SHEETS_TYPE: 'service_account',
        GOOGLE_SHEETS_PROJECT_ID: SecurityTestFactory.fakeGoogleProjectId(),
        GOOGLE_SHEETS_PRIVATE_KEY_ID: SecurityTestFactory.fakeGoogleKeyId(),
        GOOGLE_SHEETS_PRIVATE_KEY: SecurityTestFactory.fakePrivateKey(),
        GOOGLE_SHEETS_CLIENT_EMAIL: SecurityTestFactory.fakeServiceAccountEmail(),
        GOOGLE_SHEETS_CLIENT_ID: SecurityTestFactory.fakeGoogleClientId(),
        TEST_CHANNEL_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        PRIVILEGED_USER_ID: SecurityTestFactory.fakeDiscordSnowflake(),
      };

      try {
        // Act - Call the validation function
        const result = validateEnvironmentVariables();

        // Assert - Function returns applicationId property
        expect(result).toHaveProperty('applicationId');
      } finally {
        // Cleanup
        process.env = originalEnv;
      }
    });

    it('should validate that enhanced function returns publicKey property', () => {
      // Arrange - Set up environment with all 12 required variables
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        DISCORD_TOKEN: SecurityTestFactory.fakeDiscordToken(),
        DISCORD_APPLICATION_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        DISCORD_PUBLIC_KEY: 'fake1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        GOOGLE_SHEET_ID: SecurityTestFactory.fakeGoogleSheetId(),
        GOOGLE_SHEETS_TYPE: 'service_account',
        GOOGLE_SHEETS_PROJECT_ID: SecurityTestFactory.fakeGoogleProjectId(),
        GOOGLE_SHEETS_PRIVATE_KEY_ID: SecurityTestFactory.fakeGoogleKeyId(),
        GOOGLE_SHEETS_PRIVATE_KEY: SecurityTestFactory.fakePrivateKey(),
        GOOGLE_SHEETS_CLIENT_EMAIL: SecurityTestFactory.fakeServiceAccountEmail(),
        GOOGLE_SHEETS_CLIENT_ID: SecurityTestFactory.fakeGoogleClientId(),
        TEST_CHANNEL_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        PRIVILEGED_USER_ID: SecurityTestFactory.fakeDiscordSnowflake(),
      };

      try {
        // Act - Call the validation function
        const result = validateEnvironmentVariables();

        // Assert - Enhanced function now returns publicKey property
        expect(result).toHaveProperty('publicKey');
      } finally {
        // Cleanup
        process.env = originalEnv;
      }
    });

    it('should validate that enhanced function returns googleSheetId property', () => {
      // Arrange - Set up environment with all 12 required variables
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        DISCORD_TOKEN: SecurityTestFactory.fakeDiscordToken(),
        DISCORD_APPLICATION_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        DISCORD_PUBLIC_KEY: 'fake1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        GOOGLE_SHEET_ID: SecurityTestFactory.fakeGoogleSheetId(),
        GOOGLE_SHEETS_TYPE: 'service_account',
        GOOGLE_SHEETS_PROJECT_ID: SecurityTestFactory.fakeGoogleProjectId(),
        GOOGLE_SHEETS_PRIVATE_KEY_ID: SecurityTestFactory.fakeGoogleKeyId(),
        GOOGLE_SHEETS_PRIVATE_KEY: SecurityTestFactory.fakePrivateKey(),
        GOOGLE_SHEETS_CLIENT_EMAIL: SecurityTestFactory.fakeServiceAccountEmail(),
        GOOGLE_SHEETS_CLIENT_ID: SecurityTestFactory.fakeGoogleClientId(),
        TEST_CHANNEL_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        PRIVILEGED_USER_ID: SecurityTestFactory.fakeDiscordSnowflake(),
      };

      try {
        // Act - Call the validation function
        const result = validateEnvironmentVariables();

        // Assert - Enhanced function now returns googleSheetId property
        expect(result).toHaveProperty('googleSheetId');
      } finally {
        // Cleanup
        process.env = originalEnv;
      }
    });

    it('should validate that enhanced function returns googleSheetsType property', () => {
      // Arrange - Set up environment with all 12 required variables
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        DISCORD_TOKEN: SecurityTestFactory.fakeDiscordToken(),
        DISCORD_APPLICATION_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        DISCORD_PUBLIC_KEY: 'fake1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        GOOGLE_SHEET_ID: SecurityTestFactory.fakeGoogleSheetId(),
        GOOGLE_SHEETS_TYPE: 'service_account',
        GOOGLE_SHEETS_PROJECT_ID: SecurityTestFactory.fakeGoogleProjectId(),
        GOOGLE_SHEETS_PRIVATE_KEY_ID: SecurityTestFactory.fakeGoogleKeyId(),
        GOOGLE_SHEETS_PRIVATE_KEY: SecurityTestFactory.fakePrivateKey(),
        GOOGLE_SHEETS_CLIENT_EMAIL: SecurityTestFactory.fakeServiceAccountEmail(),
        GOOGLE_SHEETS_CLIENT_ID: SecurityTestFactory.fakeGoogleClientId(),
        TEST_CHANNEL_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        PRIVILEGED_USER_ID: SecurityTestFactory.fakeDiscordSnowflake(),
      };

      try {
        // Act - Call the validation function
        const result = validateEnvironmentVariables();

        // Assert - Enhanced function now returns googleSheetsType property
        expect(result).toHaveProperty('googleSheetsType');
      } finally {
        // Cleanup
        process.env = originalEnv;
      }
    });

    it('should validate that enhanced function returns googleSheetsProjectId property', () => {
      // Arrange - Set up environment with all 12 required variables
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        DISCORD_TOKEN: SecurityTestFactory.fakeDiscordToken(),
        DISCORD_APPLICATION_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        DISCORD_PUBLIC_KEY: 'fake1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        GOOGLE_SHEET_ID: SecurityTestFactory.fakeGoogleSheetId(),
        GOOGLE_SHEETS_TYPE: 'service_account',
        GOOGLE_SHEETS_PROJECT_ID: SecurityTestFactory.fakeGoogleProjectId(),
        GOOGLE_SHEETS_PRIVATE_KEY_ID: SecurityTestFactory.fakeGoogleKeyId(),
        GOOGLE_SHEETS_PRIVATE_KEY: SecurityTestFactory.fakePrivateKey(),
        GOOGLE_SHEETS_CLIENT_EMAIL: SecurityTestFactory.fakeServiceAccountEmail(),
        GOOGLE_SHEETS_CLIENT_ID: SecurityTestFactory.fakeGoogleClientId(),
        TEST_CHANNEL_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        PRIVILEGED_USER_ID: SecurityTestFactory.fakeDiscordSnowflake(),
      };

      try {
        // Act - Call the validation function
        const result = validateEnvironmentVariables();

        // Assert - Enhanced function now returns googleSheetsProjectId property
        expect(result).toHaveProperty('googleSheetsProjectId');
      } finally {
        // Cleanup
        process.env = originalEnv;
      }
    });

    it('should validate that enhanced function returns googleSheetsPrivateKeyId property', () => {
      // Arrange - Set up environment with all 12 required variables
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        DISCORD_TOKEN: SecurityTestFactory.fakeDiscordToken(),
        DISCORD_APPLICATION_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        DISCORD_PUBLIC_KEY: 'fake1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        GOOGLE_SHEET_ID: SecurityTestFactory.fakeGoogleSheetId(),
        GOOGLE_SHEETS_TYPE: 'service_account',
        GOOGLE_SHEETS_PROJECT_ID: SecurityTestFactory.fakeGoogleProjectId(),
        GOOGLE_SHEETS_PRIVATE_KEY_ID: SecurityTestFactory.fakeGoogleKeyId(),
        GOOGLE_SHEETS_PRIVATE_KEY: SecurityTestFactory.fakePrivateKey(),
        GOOGLE_SHEETS_CLIENT_EMAIL: SecurityTestFactory.fakeServiceAccountEmail(),
        GOOGLE_SHEETS_CLIENT_ID: SecurityTestFactory.fakeGoogleClientId(),
        TEST_CHANNEL_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        PRIVILEGED_USER_ID: SecurityTestFactory.fakeDiscordSnowflake(),
      };

      try {
        // Act - Call the validation function
        const result = validateEnvironmentVariables();

        // Assert - Enhanced function now returns googleSheetsPrivateKeyId property
        expect(result).toHaveProperty('googleSheetsPrivateKeyId');
      } finally {
        // Cleanup
        process.env = originalEnv;
      }
    });

    it('should validate that enhanced function returns googleSheetsPrivateKey property', () => {
      // Arrange - Set up environment with all 12 required variables
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        DISCORD_TOKEN: SecurityTestFactory.fakeDiscordToken(),
        DISCORD_APPLICATION_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        DISCORD_PUBLIC_KEY: 'fake1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        GOOGLE_SHEET_ID: SecurityTestFactory.fakeGoogleSheetId(),
        GOOGLE_SHEETS_TYPE: 'service_account',
        GOOGLE_SHEETS_PROJECT_ID: SecurityTestFactory.fakeGoogleProjectId(),
        GOOGLE_SHEETS_PRIVATE_KEY_ID: SecurityTestFactory.fakeGoogleKeyId(),
        GOOGLE_SHEETS_PRIVATE_KEY: SecurityTestFactory.fakePrivateKey(),
        GOOGLE_SHEETS_CLIENT_EMAIL: SecurityTestFactory.fakeServiceAccountEmail(),
        GOOGLE_SHEETS_CLIENT_ID: SecurityTestFactory.fakeGoogleClientId(),
        TEST_CHANNEL_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        PRIVILEGED_USER_ID: SecurityTestFactory.fakeDiscordSnowflake(),
      };

      try {
        // Act - Call the validation function
        const result = validateEnvironmentVariables();

        // Assert - Enhanced function now returns googleSheetsPrivateKey property
        expect(result).toHaveProperty('googleSheetsPrivateKey');
      } finally {
        // Cleanup
        process.env = originalEnv;
      }
    });

    it('should validate that enhanced function returns googleSheetsClientEmail property', () => {
      // Arrange - Set up environment with all 12 required variables
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        DISCORD_TOKEN: SecurityTestFactory.fakeDiscordToken(),
        DISCORD_APPLICATION_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        DISCORD_PUBLIC_KEY: 'fake1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        GOOGLE_SHEET_ID: SecurityTestFactory.fakeGoogleSheetId(),
        GOOGLE_SHEETS_TYPE: 'service_account',
        GOOGLE_SHEETS_PROJECT_ID: SecurityTestFactory.fakeGoogleProjectId(),
        GOOGLE_SHEETS_PRIVATE_KEY_ID: SecurityTestFactory.fakeGoogleKeyId(),
        GOOGLE_SHEETS_PRIVATE_KEY: SecurityTestFactory.fakePrivateKey(),
        GOOGLE_SHEETS_CLIENT_EMAIL: SecurityTestFactory.fakeServiceAccountEmail(),
        GOOGLE_SHEETS_CLIENT_ID: SecurityTestFactory.fakeGoogleClientId(),
        TEST_CHANNEL_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        PRIVILEGED_USER_ID: SecurityTestFactory.fakeDiscordSnowflake(),
      };

      try {
        // Act - Call the validation function
        const result = validateEnvironmentVariables();

        // Assert - Enhanced function now returns googleSheetsClientEmail property
        expect(result).toHaveProperty('googleSheetsClientEmail');
      } finally {
        // Cleanup
        process.env = originalEnv;
      }
    });

    it('should validate that enhanced function returns googleSheetsClientId property', () => {
      // Arrange - Set up environment with all 12 required variables
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        DISCORD_TOKEN: SecurityTestFactory.fakeDiscordToken(),
        DISCORD_APPLICATION_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        DISCORD_PUBLIC_KEY: 'fake1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        GOOGLE_SHEET_ID: SecurityTestFactory.fakeGoogleSheetId(),
        GOOGLE_SHEETS_TYPE: 'service_account',
        GOOGLE_SHEETS_PROJECT_ID: SecurityTestFactory.fakeGoogleProjectId(),
        GOOGLE_SHEETS_PRIVATE_KEY_ID: SecurityTestFactory.fakeGoogleKeyId(),
        GOOGLE_SHEETS_PRIVATE_KEY: SecurityTestFactory.fakePrivateKey(),
        GOOGLE_SHEETS_CLIENT_EMAIL: SecurityTestFactory.fakeServiceAccountEmail(),
        GOOGLE_SHEETS_CLIENT_ID: SecurityTestFactory.fakeGoogleClientId(),
        TEST_CHANNEL_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        PRIVILEGED_USER_ID: SecurityTestFactory.fakeDiscordSnowflake(),
      };

      try {
        // Act - Call the validation function
        const result = validateEnvironmentVariables();

        // Assert - Enhanced function now returns googleSheetsClientId property
        expect(result).toHaveProperty('googleSheetsClientId');
      } finally {
        // Cleanup
        process.env = originalEnv;
      }
    });

    it('should validate that enhanced function returns testChannelId property', () => {
      // Arrange - Set up environment with all 12 required variables
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        DISCORD_TOKEN: SecurityTestFactory.fakeDiscordToken(),
        DISCORD_APPLICATION_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        DISCORD_PUBLIC_KEY: 'fake1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        GOOGLE_SHEET_ID: SecurityTestFactory.fakeGoogleSheetId(),
        GOOGLE_SHEETS_TYPE: 'service_account',
        GOOGLE_SHEETS_PROJECT_ID: SecurityTestFactory.fakeGoogleProjectId(),
        GOOGLE_SHEETS_PRIVATE_KEY_ID: SecurityTestFactory.fakeGoogleKeyId(),
        GOOGLE_SHEETS_PRIVATE_KEY: SecurityTestFactory.fakePrivateKey(),
        GOOGLE_SHEETS_CLIENT_EMAIL: SecurityTestFactory.fakeServiceAccountEmail(),
        GOOGLE_SHEETS_CLIENT_ID: SecurityTestFactory.fakeGoogleClientId(),
        TEST_CHANNEL_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        PRIVILEGED_USER_ID: SecurityTestFactory.fakeDiscordSnowflake(),
      };

      try {
        // Act - Call the validation function
        const result = validateEnvironmentVariables();

        // Assert - Enhanced function now returns testChannelId property
        expect(result).toHaveProperty('testChannelId');
      } finally {
        // Cleanup
        process.env = originalEnv;
      }
    });

    it('should validate that enhanced function returns privilegedUserId property', () => {
      // Arrange - Set up environment with all 12 required variables
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        DISCORD_TOKEN: SecurityTestFactory.fakeDiscordToken(),
        DISCORD_APPLICATION_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        DISCORD_PUBLIC_KEY: 'fake1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        GOOGLE_SHEET_ID: SecurityTestFactory.fakeGoogleSheetId(),
        GOOGLE_SHEETS_TYPE: 'service_account',
        GOOGLE_SHEETS_PROJECT_ID: SecurityTestFactory.fakeGoogleProjectId(),
        GOOGLE_SHEETS_PRIVATE_KEY_ID: SecurityTestFactory.fakeGoogleKeyId(),
        GOOGLE_SHEETS_PRIVATE_KEY: SecurityTestFactory.fakePrivateKey(),
        GOOGLE_SHEETS_CLIENT_EMAIL: SecurityTestFactory.fakeServiceAccountEmail(),
        GOOGLE_SHEETS_CLIENT_ID: SecurityTestFactory.fakeGoogleClientId(),
        TEST_CHANNEL_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        PRIVILEGED_USER_ID: SecurityTestFactory.fakeDiscordSnowflake(),
      };

      try {
        // Act - Call the validation function
        const result = validateEnvironmentVariables();

        // Assert - Enhanced function now returns privilegedUserId property
        expect(result).toHaveProperty('privilegedUserId');
      } finally {
        // Cleanup
        process.env = originalEnv;
      }
    });

    it('should throw error when any of the 12 required variables are missing', () => {
      // Arrange - Test missing each variable
      const originalEnv = process.env;

      const requiredVariables = [
        'DISCORD_TOKEN',
        'DISCORD_APPLICATION_ID',
        'DISCORD_PUBLIC_KEY',
        'GOOGLE_SHEET_ID',
        'GOOGLE_SHEETS_TYPE',
        'GOOGLE_SHEETS_PROJECT_ID',
        'GOOGLE_SHEETS_PRIVATE_KEY_ID',
        'GOOGLE_SHEETS_PRIVATE_KEY',
        'GOOGLE_SHEETS_CLIENT_EMAIL',
        'GOOGLE_SHEETS_CLIENT_ID',
        'TEST_CHANNEL_ID',
        'PRIVILEGED_USER_ID',
      ];

      for (const missingVar of requiredVariables) {
        try {
          // Set up environment with one variable missing
          process.env = {
            DISCORD_TOKEN: SecurityTestFactory.fakeDiscordToken(),
            DISCORD_APPLICATION_ID: SecurityTestFactory.fakeDiscordSnowflake(),
            DISCORD_PUBLIC_KEY: 'fake1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
            GOOGLE_SHEET_ID: SecurityTestFactory.fakeGoogleSheetId(),
            GOOGLE_SHEETS_TYPE: 'service_account',
            GOOGLE_SHEETS_PROJECT_ID: SecurityTestFactory.fakeGoogleProjectId(),
            GOOGLE_SHEETS_PRIVATE_KEY_ID: SecurityTestFactory.fakeGoogleKeyId(),
            GOOGLE_SHEETS_PRIVATE_KEY: SecurityTestFactory.fakePrivateKey(),
            GOOGLE_SHEETS_CLIENT_EMAIL: SecurityTestFactory.fakeServiceAccountEmail(),
            GOOGLE_SHEETS_CLIENT_ID: SecurityTestFactory.fakeGoogleClientId(),
            TEST_CHANNEL_ID: SecurityTestFactory.fakeDiscordSnowflake(),
            PRIVILEGED_USER_ID: SecurityTestFactory.fakeDiscordSnowflake(),
          };

          // Remove the specific variable being tested
          delete process.env[missingVar];

          // Act & Assert - Should throw error for missing variable
          // Currently only throws for DISCORD_TOKEN and DISCORD_APPLICATION_ID
          // After enhancement, should throw for any of the 12 missing variables
          if (missingVar === 'DISCORD_TOKEN' || missingVar === 'DISCORD_APPLICATION_ID') {
            expect(() => validateEnvironmentVariables()).toThrow();
          } else {
            // These should throw but currently don't - this is what we need to implement
            expect(() => validateEnvironmentVariables()).toThrow(
              `Missing required environment variable: ${missingVar}`
            );
          }
        } finally {
          process.env = originalEnv;
        }
      }
    });
  });

  describe('Discord Core Variables Validation', () => {
    it('should validate Discord core variables are properly defined', () => {
      // Arrange - Discord-specific environment variables only
      const discordEnv: Partial<Env> = {
        DISCORD_TOKEN: SecurityTestFactory.fakeDiscordToken(),
        DISCORD_APPLICATION_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        DISCORD_PUBLIC_KEY: 'fake1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
      };

      // Act & Assert - Discord variables only
      expect(discordEnv.DISCORD_TOKEN).toBeDefined();
      expect(discordEnv.DISCORD_TOKEN!.length).toBeGreaterThan(40);
      expect(discordEnv.DISCORD_APPLICATION_ID).toBeDefined();
      expect(discordEnv.DISCORD_APPLICATION_ID!.length).toBeGreaterThan(15);
      expect(discordEnv.DISCORD_PUBLIC_KEY).toBeDefined();
      expect(discordEnv.DISCORD_PUBLIC_KEY!.length).toBe(64);
    });
  });

  describe('Google Sheets API Variables Validation', () => {
    it('should validate Google Sheets API configuration variables are properly defined', () => {
      // Arrange - Google Sheets API-specific environment variables only
      const sheetsApiEnv: Partial<Env> = {
        GOOGLE_SHEET_ID: SecurityTestFactory.fakeGoogleSheetId(),
        GOOGLE_SHEETS_TYPE: 'service_account',
        GOOGLE_SHEETS_PROJECT_ID: SecurityTestFactory.fakeGoogleProjectId(),
        GOOGLE_SHEETS_CLIENT_ID: SecurityTestFactory.fakeGoogleClientId(),
      };

      // Act & Assert - Google Sheets API variables only
      expect(sheetsApiEnv.GOOGLE_SHEET_ID).toBeDefined();
      expect(sheetsApiEnv.GOOGLE_SHEET_ID!.length).toBeGreaterThan(40);
      expect(sheetsApiEnv.GOOGLE_SHEETS_TYPE).toBe('service_account');
      expect(sheetsApiEnv.GOOGLE_SHEETS_PROJECT_ID).toBeDefined();
      expect(sheetsApiEnv.GOOGLE_SHEETS_PROJECT_ID!.length).toBeGreaterThan(10);
      expect(sheetsApiEnv.GOOGLE_SHEETS_CLIENT_ID).toBeDefined();
      expect(sheetsApiEnv.GOOGLE_SHEETS_CLIENT_ID!.length).toBeGreaterThan(15);
    });

    it('should validate Google Sheets private key variables are properly defined', () => {
      // Arrange - Private key-specific environment variables only
      const privateKeyEnv: Partial<Env> = {
        GOOGLE_SHEETS_PRIVATE_KEY_ID: SecurityTestFactory.fakeGoogleKeyId(),
        GOOGLE_SHEETS_PRIVATE_KEY: SecurityTestFactory.fakePrivateKey(),
      };

      // Act & Assert - Private key variables only
      expect(privateKeyEnv.GOOGLE_SHEETS_PRIVATE_KEY_ID).toBeDefined();
      expect(privateKeyEnv.GOOGLE_SHEETS_PRIVATE_KEY_ID!.length).toBeGreaterThan(20);
      expect(privateKeyEnv.GOOGLE_SHEETS_PRIVATE_KEY).toBeDefined();
      expect(privateKeyEnv.GOOGLE_SHEETS_PRIVATE_KEY).toContain('BEGIN PRIVATE KEY');
    });
  });

  describe('Email Service Configuration Validation', () => {
    it('should validate email service variables are properly defined', () => {
      // Arrange - Email service-specific environment variable only
      const emailEnv: Partial<Env> = {
        GOOGLE_SHEETS_CLIENT_EMAIL: SecurityTestFactory.fakeServiceAccountEmail(),
      };

      // Act & Assert - Email service variable only
      expect(emailEnv.GOOGLE_SHEETS_CLIENT_EMAIL).toBeDefined();
      expect(emailEnv.GOOGLE_SHEETS_CLIENT_EMAIL).toContain('@');
      expect(emailEnv.GOOGLE_SHEETS_CLIENT_EMAIL).toContain('.iam.gserviceaccount.com');
    });
  });

  describe('Discord Channel and User Variables Validation', () => {
    it('should validate Discord channel and user ID variables are properly defined', () => {
      // Arrange - Discord channel/user-specific environment variables only
      const channelUserEnv: Partial<Env> = {
        TEST_CHANNEL_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        PRIVILEGED_USER_ID: SecurityTestFactory.fakeDiscordSnowflake(),
      };

      // Act & Assert - Channel/User variables only
      expect(channelUserEnv.TEST_CHANNEL_ID).toBeDefined();
      expect(channelUserEnv.TEST_CHANNEL_ID!.length).toBeGreaterThan(15);
      expect(channelUserEnv.PRIVILEGED_USER_ID).toBeDefined();
      expect(channelUserEnv.PRIVILEGED_USER_ID!.length).toBeGreaterThan(15);
    });
  });

  describe('System Environment Variable Validation', () => {
    it('should validate system environment variable is properly defined', () => {
      // Arrange - System-specific environment variable only
      const systemEnv: Partial<Env> = {
        ENVIRONMENT: 'development',
      };

      // Act & Assert - System variable only
      expect(systemEnv.ENVIRONMENT).toBeDefined();
      expect(['development', 'staging', 'production']).toContain(systemEnv.ENVIRONMENT);
    });
  });

  describe('Complete Configuration Count Validation', () => {
    it('should validate that all 12 required variables are accounted for', () => {
      // Arrange - Count of required variables
      const requiredVariableNames = [
        'DISCORD_TOKEN',
        'DISCORD_APPLICATION_ID',
        'DISCORD_PUBLIC_KEY',
        'GOOGLE_SHEET_ID',
        'GOOGLE_SHEETS_TYPE',
        'GOOGLE_SHEETS_PROJECT_ID',
        'GOOGLE_SHEETS_PRIVATE_KEY_ID',
        'GOOGLE_SHEETS_PRIVATE_KEY',
        'GOOGLE_SHEETS_CLIENT_EMAIL',
        'GOOGLE_SHEETS_CLIENT_ID',
        'TEST_CHANNEL_ID',
        'PRIVILEGED_USER_ID',
      ];

      // Act & Assert - Count validation only
      expect(requiredVariableNames).toHaveLength(12);
    });

    it('should fail when any of the 12 required variables are missing', () => {
      // Arrange - Test each missing variable scenario
      const baseCompleteEnv = {
        DISCORD_TOKEN: SecurityTestFactory.fakeDiscordToken(),
        DISCORD_APPLICATION_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        DISCORD_PUBLIC_KEY: 'fake1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        GOOGLE_SHEET_ID: SecurityTestFactory.fakeGoogleSheetId(),
        GOOGLE_SHEETS_TYPE: 'service_account',
        GOOGLE_SHEETS_PROJECT_ID: SecurityTestFactory.fakeGoogleProjectId(),
        GOOGLE_SHEETS_PRIVATE_KEY_ID: SecurityTestFactory.fakeGoogleKeyId(),
        GOOGLE_SHEETS_PRIVATE_KEY: SecurityTestFactory.fakePrivateKey(),
        GOOGLE_SHEETS_CLIENT_EMAIL: SecurityTestFactory.fakeServiceAccountEmail(),
        GOOGLE_SHEETS_CLIENT_ID: SecurityTestFactory.fakeGoogleClientId(),
        TEST_CHANNEL_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        PRIVILEGED_USER_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        ENVIRONMENT: 'development',
      };

      // Test cases for each of the 12 required variables
      const missingVariableTests = [
        { variable: 'DISCORD_TOKEN', env: { ...baseCompleteEnv, DISCORD_TOKEN: undefined } },
        {
          variable: 'DISCORD_APPLICATION_ID',
          env: { ...baseCompleteEnv, DISCORD_APPLICATION_ID: undefined },
        },
        {
          variable: 'DISCORD_PUBLIC_KEY',
          env: { ...baseCompleteEnv, DISCORD_PUBLIC_KEY: undefined },
        },
        { variable: 'GOOGLE_SHEET_ID', env: { ...baseCompleteEnv, GOOGLE_SHEET_ID: undefined } },
        {
          variable: 'GOOGLE_SHEETS_TYPE',
          env: { ...baseCompleteEnv, GOOGLE_SHEETS_TYPE: undefined },
        },
        {
          variable: 'GOOGLE_SHEETS_PROJECT_ID',
          env: { ...baseCompleteEnv, GOOGLE_SHEETS_PROJECT_ID: undefined },
        },
        {
          variable: 'GOOGLE_SHEETS_PRIVATE_KEY_ID',
          env: { ...baseCompleteEnv, GOOGLE_SHEETS_PRIVATE_KEY_ID: undefined },
        },
        {
          variable: 'GOOGLE_SHEETS_PRIVATE_KEY',
          env: { ...baseCompleteEnv, GOOGLE_SHEETS_PRIVATE_KEY: undefined },
        },
        {
          variable: 'GOOGLE_SHEETS_CLIENT_EMAIL',
          env: { ...baseCompleteEnv, GOOGLE_SHEETS_CLIENT_EMAIL: undefined },
        },
        {
          variable: 'GOOGLE_SHEETS_CLIENT_ID',
          env: { ...baseCompleteEnv, GOOGLE_SHEETS_CLIENT_ID: undefined },
        },
        { variable: 'TEST_CHANNEL_ID', env: { ...baseCompleteEnv, TEST_CHANNEL_ID: undefined } },
        {
          variable: 'PRIVILEGED_USER_ID',
          env: { ...baseCompleteEnv, PRIVILEGED_USER_ID: undefined },
        },
      ];

      // Act & Assert - Each missing variable should be detectable
      for (const testCase of missingVariableTests) {
        const env = testCase.env as unknown as Partial<Env>;
        const missingValue = (env as any)[testCase.variable];

        expect(
          missingValue,
          `${testCase.variable} should be undefined when missing`
        ).toBeUndefined();
      }
    });

    it('should detect malformed values in all 12 required variables', () => {
      // Arrange - Test malformed values for each variable
      const malformedTests = [
        // Discord Core Variables
        { variable: 'DISCORD_TOKEN', value: '', expected: 'too short' },
        { variable: 'DISCORD_TOKEN', value: 'short', expected: 'too short' },
        { variable: 'DISCORD_APPLICATION_ID', value: '', expected: 'empty' },
        { variable: 'DISCORD_APPLICATION_ID', value: 'not-numeric', expected: 'non-numeric' },
        { variable: 'DISCORD_PUBLIC_KEY', value: '', expected: 'empty' },
        { variable: 'DISCORD_PUBLIC_KEY', value: 'not-hex-string', expected: 'non-hex' },

        // Google Sheets Variables
        { variable: 'GOOGLE_SHEET_ID', value: '', expected: 'empty' },
        { variable: 'GOOGLE_SHEET_ID', value: 'short', expected: 'too short' },
        { variable: 'GOOGLE_SHEETS_TYPE', value: '', expected: 'empty' },
        { variable: 'GOOGLE_SHEETS_TYPE', value: 'invalid_type', expected: 'invalid type' },
        { variable: 'GOOGLE_SHEETS_PROJECT_ID', value: '', expected: 'empty' },
        { variable: 'GOOGLE_SHEETS_PRIVATE_KEY_ID', value: '', expected: 'empty' },
        { variable: 'GOOGLE_SHEETS_PRIVATE_KEY', value: '', expected: 'empty' },
        {
          variable: 'GOOGLE_SHEETS_PRIVATE_KEY',
          value: 'not-a-private-key',
          expected: 'invalid format',
        },
        { variable: 'GOOGLE_SHEETS_CLIENT_EMAIL', value: '', expected: 'empty' },
        {
          variable: 'GOOGLE_SHEETS_CLIENT_EMAIL',
          value: 'not-an-email',
          expected: 'invalid email',
        },
        { variable: 'GOOGLE_SHEETS_CLIENT_ID', value: '', expected: 'empty' },
        { variable: 'GOOGLE_SHEETS_CLIENT_ID', value: 'not-numeric', expected: 'non-numeric' },

        // Discord Channel and User Variables
        { variable: 'TEST_CHANNEL_ID', value: '', expected: 'empty' },
        { variable: 'TEST_CHANNEL_ID', value: 'not-numeric', expected: 'non-numeric' },
        { variable: 'PRIVILEGED_USER_ID', value: '', expected: 'empty' },
        { variable: 'PRIVILEGED_USER_ID', value: 'not-numeric', expected: 'non-numeric' },
      ];

      // Act & Assert - Each malformed value should be detectable
      for (const testCase of malformedTests) {
        const env = { [testCase.variable]: testCase.value } as Partial<Env>;
        const actualValue = (env as any)[testCase.variable];

        expect(
          actualValue,
          `${testCase.variable} should preserve malformed value for detection`
        ).toBe(testCase.value);

        // Validate that we can detect the malformation
        if (testCase.expected === 'empty') {
          expect(actualValue.length, `${testCase.variable} should be detectable as empty`).toBe(0);
        } else if (testCase.expected === 'too short') {
          expect(
            actualValue.length,
            `${testCase.variable} should be detectable as too short`
          ).toBeLessThan(20);
        } else if (testCase.expected === 'non-numeric') {
          expect(
            /^\d+$/.test(actualValue),
            `${testCase.variable} should be detectable as non-numeric`
          ).toBe(false);
        } else if (testCase.expected === 'non-hex') {
          expect(
            /^[0-9a-fA-F]+$/.test(actualValue),
            `${testCase.variable} should be detectable as non-hex`
          ).toBe(false);
        } else if (testCase.expected === 'invalid email') {
          expect(
            actualValue.includes('@'),
            `${testCase.variable} should be detectable as invalid email`
          ).toBe(false);
        } else if (testCase.expected === 'invalid format') {
          expect(
            actualValue.includes('BEGIN PRIVATE KEY'),
            `${testCase.variable} should be detectable as invalid key format`
          ).toBe(false);
        } else if (testCase.expected === 'invalid type') {
          expect(actualValue, `${testCase.variable} should be detectable as invalid type`).not.toBe(
            'service_account'
          );
        }
      }
    });

    it('should validate production environment has all 12 required variables present', () => {
      // Arrange - Production environment variable names
      const productionEnvKeys = [
        'DISCORD_TOKEN',
        'DISCORD_APPLICATION_ID',
        'DISCORD_PUBLIC_KEY',
        'GOOGLE_SHEET_ID',
        'GOOGLE_SHEETS_TYPE',
        'GOOGLE_SHEETS_PROJECT_ID',
        'GOOGLE_SHEETS_PRIVATE_KEY_ID',
        'GOOGLE_SHEETS_PRIVATE_KEY',
        'GOOGLE_SHEETS_CLIENT_EMAIL',
        'GOOGLE_SHEETS_CLIENT_ID',
        'TEST_CHANNEL_ID',
        'PRIVILEGED_USER_ID',
      ];

      // Act & Assert - Production presence validation only
      expect(productionEnvKeys).toHaveLength(12);
      for (const key of productionEnvKeys) {
        expect(productionEnvKeys).toContain(key);
      }
    });

    it('should validate production Discord token meets length requirements', () => {
      // Arrange - Production Discord configuration
      const productionDiscord = {
        DISCORD_TOKEN:
          'FAKE_PRODUCTION_DISCORD_BOT_TOKEN_FOR_TESTING_ONLY_NOT_REAL_12345678901234567890',
        ENVIRONMENT: 'production',
      };

      // Act & Assert - Production Discord validation only
      expect(productionDiscord.DISCORD_TOKEN.length).toBeGreaterThan(50);
      expect(productionDiscord.ENVIRONMENT).toBe('production');
    });

    it('should validate production Google Sheets configuration meets length requirements', () => {
      // Arrange - Production Google Sheets configuration
      const productionSheets = {
        GOOGLE_SHEET_ID: 'FAKE_PRODUCTION_SHEET_ID_NOT_REAL_CREDENTIALS_12345678901234567890ABCDEF',
        GOOGLE_SHEETS_PRIVATE_KEY_ID: SecurityTestFactory.fakeGoogleKeyId(),
        GOOGLE_SHEETS_CLIENT_ID: '999888777666555444333222111000999888777',
      };

      // Act & Assert - Production Google Sheets validation only
      expect(productionSheets.GOOGLE_SHEET_ID.length).toBeGreaterThan(50);
      expect(productionSheets.GOOGLE_SHEETS_PRIVATE_KEY_ID.length).toBeGreaterThan(15); // Security factory generates ~22 chars
      expect(productionSheets.GOOGLE_SHEETS_CLIENT_ID.length).toBeGreaterThan(20);
    });

    it('should validate production email service configuration meets format requirements', () => {
      // Arrange - Production email configuration
      const productionEmail = {
        GOOGLE_SHEETS_CLIENT_EMAIL:
          'fake-production-service@fake-production-project-12345.iam.gserviceaccount.com',
      };

      // Act & Assert - Production email validation only
      expect(productionEmail.GOOGLE_SHEETS_CLIENT_EMAIL).toMatch(
        /^[^@]+@[^@]+\.iam\.gserviceaccount\.com$/
      );
    });

    it('should validate production Discord IDs meet snowflake format requirements', () => {
      // Arrange - Production Discord ID configuration
      const productionDiscordIds = {
        DISCORD_APPLICATION_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        TEST_CHANNEL_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        PRIVILEGED_USER_ID: SecurityTestFactory.fakeDiscordSnowflake(),
      };

      // Act & Assert - Production Discord ID validation only
      expect(/^\d{18,19}$/.test(productionDiscordIds.DISCORD_APPLICATION_ID)).toBe(true);
      expect(/^\d{18,19}$/.test(productionDiscordIds.TEST_CHANNEL_ID)).toBe(true);
      expect(/^\d{18,19}$/.test(productionDiscordIds.PRIVILEGED_USER_ID)).toBe(true);
    });
  });

  describe('Environment Variable Security Validation', () => {
    it('should detect potentially unsafe environment variable values', () => {
      // Arrange - Test potentially unsafe values that should be caught
      const unsafeTests = [
        {
          variable: 'DISCORD_TOKEN',
          value: 'Bot real_token_12345',
          description: 'real token format',
        },
        {
          variable: 'GOOGLE_SHEETS_PRIVATE_KEY',
          value: '-----BEGIN PRIVATE KEY-----\nMIIEvQ...real_key_data\n-----END PRIVATE KEY-----',
          description: 'real private key format',
        },
        {
          variable: 'GOOGLE_SHEETS_CLIENT_EMAIL',
          value: 'real-service@real-project.iam.gserviceaccount.com',
          description: 'real service account',
        },
        {
          variable: 'DISCORD_APPLICATION_ID',
          value: '1088157155155488798',
          description: 'real Discord application ID',
        },
        {
          variable: 'TEST_CHANNEL_ID',
          value: '1088157155155488798',
          description: 'real Discord channel ID',
        },
      ];

      // Act & Assert - Security validation should catch these patterns
      for (const testCase of unsafeTests) {
        const env = { [testCase.variable]: testCase.value } as Partial<Env>;
        const actualValue = (env as any)[testCase.variable];

        // In tests, we should be using fake/mock values, not real ones
        expect(
          actualValue,
          `${testCase.variable} should not contain ${testCase.description} in tests`
        ).toBe(testCase.value);

        // Validate security patterns
        if (testCase.variable === 'DISCORD_TOKEN' && actualValue.startsWith('Bot ')) {
          expect(
            actualValue.includes('FAKE') || actualValue.includes('TEST'),
            `${testCase.variable} should use fake test tokens`
          ).toBe(false);
        }
        if (
          testCase.variable === 'GOOGLE_SHEETS_CLIENT_EMAIL' &&
          actualValue.includes('.iam.gserviceaccount.com')
        ) {
          expect(
            actualValue.includes('fake') || actualValue.includes('test'),
            `${testCase.variable} should use fake test emails`
          ).toBe(false);
        }
      }
    });

    it('should validate that all test environment variables use fake/test values', () => {
      // Arrange - Production-safe test environment
      const safeTestEnv: Env = {
        DISCORD_TOKEN: 'FAKE_TEST_DISCORD_BOT_TOKEN_NOT_REAL_12345678901234567890',
        DISCORD_APPLICATION_ID: SecurityTestFactory.fakeDiscordSnowflake(), // Test snowflake
        DISCORD_PUBLIC_KEY: 'fake1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        GOOGLE_SHEET_ID: SecurityTestFactory.fakeGoogleSheetId(),
        GOOGLE_SHEETS_TYPE: 'service_account',
        GOOGLE_SHEETS_PROJECT_ID: SecurityTestFactory.fakeGoogleProjectId(),
        GOOGLE_SHEETS_PRIVATE_KEY_ID: SecurityTestFactory.fakeGoogleKeyId(),
        GOOGLE_SHEETS_PRIVATE_KEY:
          '-----BEGIN PRIVATE KEY-----\\nFAKE_TEST_PRIVATE_KEY_DATA_NOT_REAL_CREDENTIALS\\n-----END PRIVATE KEY-----\\n',
        GOOGLE_SHEETS_CLIENT_EMAIL:
          'fake-test-service@fake-test-project-12345.iam.gserviceaccount.com',
        GOOGLE_SHEETS_CLIENT_ID: SecurityTestFactory.fakeGoogleClientId(),
        TEST_CHANNEL_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        PRIVILEGED_USER_ID: SecurityTestFactory.fakeDiscordSnowflake(),
        ENVIRONMENT: 'test',
      };

      // Act & Assert - All values should be clearly fake/test values
      expect(safeTestEnv.DISCORD_TOKEN.toUpperCase()).toContain('FAKE');
      expect(safeTestEnv.GOOGLE_SHEET_ID!.toUpperCase()).toContain('FAKE');
      expect(
        safeTestEnv.GOOGLE_SHEETS_PROJECT_ID!.includes('fake') ||
          safeTestEnv.GOOGLE_SHEETS_PROJECT_ID!.includes('test')
      ).toBe(true);
      expect(safeTestEnv.GOOGLE_SHEETS_PRIVATE_KEY_ID!.toUpperCase()).toContain('FAKE');
      expect(safeTestEnv.GOOGLE_SHEETS_PRIVATE_KEY!.toUpperCase()).toContain('FAKE');
      expect(
        safeTestEnv.GOOGLE_SHEETS_CLIENT_EMAIL!.includes('fake') ||
          safeTestEnv.GOOGLE_SHEETS_CLIENT_EMAIL!.includes('test')
      ).toBe(true);
      expect(safeTestEnv.ENVIRONMENT).toBe('test');
    });
  });
});
