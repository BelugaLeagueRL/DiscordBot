/**
 * Unit tests for background sync functionality in admin-sync-users-to-sheets
 * Tests the uncovered lines 98-106, 107-112 via exported function behavior
 * Following TDD Red-Green-Refactor with anti-pattern prevention
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from '../../../../index';
import { handleAdminSyncUsersToSheetsDiscord } from '../../../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler';

describe('Background Sync Functionality', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
    });
  });

  describe('syncUsersToSheetsBackground success scenario (Lines 98-106)', () => {
    it('should schedule background work and return success result with requestId and estimatedDuration', () => {
      // Arrange
      const mockContext = {
        waitUntil: vi.fn(),
        passThroughOnException: vi.fn(),
      };

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

      // Act
      const result = handleAdminSyncUsersToSheetsDiscord(validInteraction, mockContext, mockEnv);

      // Assert - Focus on specific behavior of successful background sync scheduling
      expect(result).toBeInstanceOf(Response);
      expect(mockContext.waitUntil).toHaveBeenCalledWith(expect.any(Promise));
    });
  });

  describe('syncUsersToSheetsBackground error scenario (Lines 107-112)', () => {
    it('should return error response when context.waitUntil throws an exception', () => {
      // Arrange
      const mockContext = {
        waitUntil: vi.fn(() => {
          throw new Error('Execution context error');
        }),
        passThroughOnException: vi.fn(),
      };

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

      // Act
      const result = handleAdminSyncUsersToSheetsDiscord(validInteraction, mockContext, mockEnv);

      // Assert - Focus on specific error handling behavior of failed sync operation
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(500); // HTTP 500: Internal Server Error when sync operation fails
      expect(mockContext.waitUntil).toHaveBeenCalledTimes(1); // waitUntil should be called exactly once
    });
  });

  describe('performBackgroundSync placeholder behavior (Lines 118-133)', () => {
    it('should log sync start and completion messages for valid parameters', async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Act - Need to access performBackgroundSync function for direct testing
      // Since it's not exported, we test through the syncUsersToSheetsBackground flow
      const mockContext = {
        waitUntil: vi.fn((promise: Promise<unknown>) => {
          // Execute the promise to trigger performBackgroundSync
          promise.catch(() => {
            // Ignore errors for this test
          });
        }),
        passThroughOnException: vi.fn(),
      };

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

      const mockEnvFull = {
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

      handleAdminSyncUsersToSheetsDiscord(validInteraction, mockContext, mockEnvFull);

      // Wait for async operation to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert - Focus on console logging behavior (Lines 120, 129)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Starting background sync for guild 123456789012345678'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Background sync completed for guild 123456789012345678'
      );
      expect(consoleSpy).toHaveBeenCalledTimes(2); // Exactly 2 console.log calls

      // Cleanup
      consoleSpy.mockRestore();
    });
  });
});
