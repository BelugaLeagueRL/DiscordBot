/**
 * Unit tests for internal validation functions in admin-sync-users-to-sheets
 * Tests uncovered lines in validateBasics (234-257) and related functions
 * Following TDD Red-Green-Refactor with anti-pattern prevention
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from '../../../../index';
import { handleAdminSyncUsersToSheets } from '../../../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler';

describe('Internal Validation Functions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('validateBasics function behavior (Lines 234-257)', () => {
    it('should return error when interaction data is undefined', async () => {
      // Arrange - Create interaction that passes validateInteractionStructure but fails data check
      const invalidInteraction = {
        id: 'interaction-123',
        application_id: 'app-456',
        type: 2,
        guild_id: '123456789012345678',
        channel_id: 'test-channel-id',
        user: {
          id: 'privileged-user-id',
          username: 'testuser',
        },
        token: 'token-abc',
        version: 1,
        // data is explicitly undefined to trigger line 249-251 in validateBasics
        data: undefined,
      } as any; // Type assertion needed to bypass strict typing for test scenario

      const validContext = {
        waitUntil: vi.fn(),
        passThroughOnException: vi.fn(),
      };

      const mockEnv = {
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

      // Act - Test through handleAdminSyncUsersToSheets which calls performValidation -> validateBasics
      const result = await handleAdminSyncUsersToSheets(invalidInteraction, validContext, mockEnv);

      // Assert - Focus on specific validateBasics error for missing data (Line 250)
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid command data'); // Specific error from validateBasics line 250
    });
  });

  describe('validateUserAndEnvironment function behavior (Lines 273-292)', () => {
    it('should return error when GOOGLE_SHEET_ID is missing', async () => {
      // Arrange - Valid interaction but missing GOOGLE_SHEET_ID to trigger line 282-284
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

      const mockEnvMissingSheetId = {
        TEST_CHANNEL_ID: 'test-channel-id',
        PRIVILEGED_USER_ID: 'privileged-user-id',
        // GOOGLE_SHEET_ID is missing to trigger line 282-284 in validateUserAndEnvironment
        GOOGLE_SHEETS_TYPE: 'service_account',
        GOOGLE_SHEETS_PROJECT_ID: 'project-123',
        GOOGLE_SHEETS_PRIVATE_KEY_ID: 'key-id-123',
        GOOGLE_SHEETS_PRIVATE_KEY:
          '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n',
        GOOGLE_SHEETS_CLIENT_EMAIL: 'test@serviceaccount.com',
        GOOGLE_SHEETS_CLIENT_ID: 'client-123',
      } as Env;

      // Act - Test through handleAdminSyncUsersToSheets which calls performValidation -> validateUserAndEnvironment
      const result = await handleAdminSyncUsersToSheets(
        validInteraction,
        validContext,
        mockEnvMissingSheetId
      );

      // Assert - Focus on specific validateUserAndEnvironment error for missing GOOGLE_SHEET_ID (Line 283)
      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required environment configuration'); // Specific error from validateUserAndEnvironment line 283
    });
  });
});
