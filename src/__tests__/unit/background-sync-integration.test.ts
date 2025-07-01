/**
 * Integration tests for Background Sync functionality
 * Testing syncUsersToSheetsBackground + performBackgroundSync integration
 * Following TDD Red-Green-Refactor with anti-pattern prevention
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from '../../index';

// Import the Discord handler that uses background sync functions
import { handleAdminSyncUsersToSheetsDiscord } from '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler';

describe('Background Sync Integration', () => {
  let mockContext: { waitUntil: any; passThroughOnException: any };

  beforeEach(() => {
    vi.resetAllMocks();
    mockContext = {
      waitUntil: vi.fn(),
      passThroughOnException: vi.fn(),
    };
  });

  describe('Discord handler background sync integration', () => {
    it('should schedule background sync work via context.waitUntil when processing valid request', () => {
      // Arrange - Create valid interaction and environment for background sync
      const validInteraction = {
        id: 'interaction-123',
        application_id: 'app-456',
        type: 2,
        guild_id: 'test-guild-123',
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

      const validEnv = {
        TEST_CHANNEL_ID: 'test-channel-id',
        PRIVILEGED_USER_ID: 'privileged-user-id',
        GOOGLE_SHEET_ID: 'sheet-123',
        GOOGLE_SHEETS_TYPE: 'service_account',
        GOOGLE_SHEETS_PROJECT_ID: 'project-123',
        GOOGLE_SHEETS_PRIVATE_KEY_ID: 'key-id-123',
        GOOGLE_SHEETS_CLIENT_EMAIL: 'test@service.com',
        GOOGLE_SHEETS_PRIVATE_KEY:
          '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n',
        GOOGLE_SHEETS_CLIENT_ID: 'client-123',
      } as Env;

      // Act - Process Discord command which should trigger background sync
      const result = handleAdminSyncUsersToSheetsDiscord(validInteraction, mockContext, validEnv);

      // Assert - Should schedule background work via context.waitUntil (Line 504 calls Line 100)
      expect(mockContext.waitUntil).toHaveBeenCalledWith(expect.any(Promise));
      expect(mockContext.waitUntil).toHaveBeenCalledTimes(1);

      // Assert - Should return Discord ephemeral response indicating sync started
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(200);
    });
  });
});
