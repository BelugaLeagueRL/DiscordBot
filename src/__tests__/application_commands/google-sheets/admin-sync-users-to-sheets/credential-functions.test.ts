/**
 * Unit tests for credential-related functions in admin-sync-users-to-sheets
 * Tests buildCredentialsObject function (Lines 439-444) and loadCredentialsFromEnvironment (Lines 449-468)
 * Following TDD Red-Green-Refactor with anti-pattern prevention
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from '../../../../index';
import { buildCredentialsObject } from '../../../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler';
import { handleAdminSyncUsersToSheets } from '../../../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler';
import { handleAdminSyncUsersToSheetsDiscord } from '../../../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler';

describe('Credential Functions', () => {
  describe('buildCredentialsObject function behavior (Lines 439-444)', () => {
    it('should build credentials object with client_email and private_key from environment', () => {
      // Arrange - Create environment with Google Sheets credentials
      const mockEnv = {
        GOOGLE_SHEETS_CLIENT_EMAIL: 'test@serviceaccount.com',
        GOOGLE_SHEETS_PRIVATE_KEY:
          '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n',
        GOOGLE_SHEETS_TYPE: 'service_account',
        GOOGLE_SHEETS_PROJECT_ID: 'project-123',
        GOOGLE_SHEETS_PRIVATE_KEY_ID: 'key-id-123',
        GOOGLE_SHEETS_CLIENT_ID: 'client-123',
      } as Env;

      // Act - Call buildCredentialsObject function directly
      const result = buildCredentialsObject(mockEnv);

      // Assert - Focus on specific credential object structure (Lines 440-443)
      expect(result).toEqual({
        client_email: 'test@serviceaccount.com',
        private_key: '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n',
      });
      expect(result.client_email).toBe('test@serviceaccount.com'); // Verify client_email mapping (Line 441)
      expect(result.private_key).toBe(
        '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n'
      ); // Verify private_key mapping (Line 442)
    });
  });

  describe('loadCredentialsFromEnvironment function behavior (Lines 449-468)', () => {
    it('should return error when validateRequiredCredentialFields fails for empty CLIENT_EMAIL', async () => {
      // Arrange - Valid interaction and context, but environment with empty CLIENT_EMAIL to trigger validateRequiredCredentialFields failure
      const validInteraction = {
        id: 'interaction-123',
        application_id: 'app-456',
        type: 2,
        guild_id: '123456789012345678',
        channel_id: 'test-channel-id',
        user: {
          id: 'privileged-user-id',
          username: 'testuser',
        },
        data: {
          id: 'command-789',
          name: 'admin_sync_users_to_sheets',
          type: 1,
        },
        token: 'token-abc',
        version: 1,
      };

      const validContext = {
        waitUntil: vi.fn(),
        passThroughOnException: vi.fn(),
      };

      const mockEnvEmptyClientEmail = {
        TEST_CHANNEL_ID: 'test-channel-id',
        PRIVILEGED_USER_ID: 'privileged-user-id',
        GOOGLE_SHEET_ID: 'sheet-123',
        GOOGLE_SHEETS_TYPE: 'service_account',
        GOOGLE_SHEETS_PROJECT_ID: 'project-123',
        GOOGLE_SHEETS_PRIVATE_KEY_ID: 'key-id-123',
        GOOGLE_SHEETS_PRIVATE_KEY:
          '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n',
        GOOGLE_SHEETS_CLIENT_EMAIL: '', // Empty string to trigger validateCredentials failure (validateCredentials checks for non-empty strings)
        GOOGLE_SHEETS_CLIENT_ID: 'client-123',
      } as Env;

      // Act - Test through handleAdminSyncUsersToSheets which calls loadCredentialsFromEnvironment (Lines 450-452)
      const result = await handleAdminSyncUsersToSheets(
        validInteraction,
        validContext,
        mockEnvEmptyClientEmail
      );

      // Assert - Focus on loadCredentialsFromEnvironment error for missing required field (caught earlier than validateCredentials)
      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required credential field: GOOGLE_SHEETS_CLIENT_EMAIL'); // Error from validateRequiredCredentialFields via loadCredentialsFromEnvironment
    });
  });

  describe('handleAdminSyncUsersToSheetsDiscord function behavior (Lines 474-517)', () => {
    beforeEach(() => {
      vi.resetAllMocks();
      vi.stubGlobal('crypto', {
        randomUUID: vi.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
      });
    });

    it('should return ephemeral response when all validations pass and sync succeeds', () => {
      // Arrange - Valid interaction, context, and environment for successful sync
      const validInteraction = {
        id: 'interaction-123',
        application_id: 'app-456',
        type: 2,
        guild_id: '123456789012345678',
        channel_id: 'test-channel-id',
        user: {
          id: 'privileged-user-id',
          username: 'testuser',
          discriminator: '1234',
          global_name: 'Test User',
        },
        data: {
          id: 'command-789',
          name: 'admin_sync_users_to_sheets',
          type: 1,
        },
        token: 'token-abc',
        version: 1,
      };

      const validContext = {
        waitUntil: vi.fn(),
        passThroughOnException: vi.fn(),
      };

      const completeValidEnv = {
        TEST_CHANNEL_ID: 'test-channel-id',
        PRIVILEGED_USER_ID: 'privileged-user-id',
        GOOGLE_SHEET_ID: 'sheet-123',
        GOOGLE_SHEETS_TYPE: 'service_account',
        GOOGLE_SHEETS_PROJECT_ID: 'project-123',
        GOOGLE_SHEETS_PRIVATE_KEY_ID: 'key-id-123',
        GOOGLE_SHEETS_PRIVATE_KEY:
          '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n',
        GOOGLE_SHEETS_CLIENT_EMAIL: 'test@serviceaccount.com',
        GOOGLE_SHEETS_CLIENT_ID: 'client-123',
      } as Env;

      // Act - Call handleAdminSyncUsersToSheetsDiscord directly for success path testing (Lines 474-517)
      const result = handleAdminSyncUsersToSheetsDiscord(
        validInteraction,
        validContext,
        completeValidEnv
      );

      // Assert - Focus on successful response and background sync initiation (Lines 515-516)
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(200); // Successful ephemeral response
      expect(validContext.waitUntil).toHaveBeenCalledWith(expect.any(Promise)); // Background sync initiated
    });
  });
});
