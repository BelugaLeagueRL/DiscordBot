/**
 * Integration tests for Validation Pipeline functionality
 * Testing validateBasics → validateUserAndEnvironment → performValidation integration
 * Following TDD Red-Green-Refactor with anti-pattern prevention
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from '../../index';

// Import the exported function that uses the validation pipeline
import { handleAdminSyncUsersToSheets } from '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler';

describe('Validation Pipeline Integration', () => {
  let mockContext: { waitUntil: any; passThroughOnException: any };

  beforeEach(() => {
    vi.resetAllMocks();
    mockContext = {
      waitUntil: vi.fn(),
      passThroughOnException: vi.fn(),
    };
  });

  describe('validation pipeline integration through handleAdminSyncUsersToSheets', () => {
    it('should complete full validation pipeline and return success result', async () => {
      // Arrange - Create valid interaction and environment for full validation pipeline
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

      // Act - Run through handler which uses full validation pipeline
      const result = await handleAdminSyncUsersToSheets(validInteraction, mockContext, validEnv);

      // Assert - Should successfully complete validation pipeline integration
      expect(result.success).toBe(true);

      // Assert - Should return structured response from successful validation + sync pipeline
      if (result.success) {
        expect(result.message).toBe('Background sync initiated successfully');
        expect(result.requestId).toBeDefined();
        expect(result.estimatedDuration).toBe('30-60 seconds');
        expect(result.metadata).toHaveProperty('guildId', 'test-guild-123');
        expect(result.metadata).toHaveProperty('initiatedBy', 'privileged-user-id');
      }
    });

    it('should propagate validation errors through pipeline when interaction validation fails', async () => {
      // Arrange - Create invalid interaction that will fail validateBasics
      const invalidInteraction = {
        // Missing required 'id' field to trigger validateBasics → validateInteractionStructure failure
        application_id: 'app-456',
        type: 2,
        token: 'token-abc',
        version: 1,
      };

      const validEnv = {
        TEST_CHANNEL_ID: 'test-channel-id',
        PRIVILEGED_USER_ID: 'privileged-user-id',
        GOOGLE_SHEET_ID: 'sheet-123',
      } as Env;

      // Act - Run through handler with invalid interaction
      const result = await handleAdminSyncUsersToSheets(
        invalidInteraction as any,
        mockContext,
        validEnv
      );

      // Assert - Should fail at validateBasics step and propagate error through pipeline
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid interaction format');
      }
    });

    it('should propagate validation errors through pipeline when channel permission validation fails', async () => {
      // Arrange - Create interaction with wrong channel to fail validateUserAndEnvironment
      const wrongChannelInteraction = {
        id: 'interaction-123',
        application_id: 'app-456',
        type: 2,
        guild_id: 'test-guild-123',
        channel_id: 'wrong-channel-id', // Wrong channel will fail permission check
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

      const validEnv = {
        TEST_CHANNEL_ID: 'test-channel-id', // Different from interaction channel
        PRIVILEGED_USER_ID: 'privileged-user-id',
        GOOGLE_SHEET_ID: 'sheet-123',
      } as Env;

      // Act - Run through handler with wrong channel
      const result = await handleAdminSyncUsersToSheets(
        wrongChannelInteraction,
        mockContext,
        validEnv
      );

      // Assert - Should fail at validateUserAndEnvironment step and propagate through pipeline
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('This command can only be used in the designated admin channel');
      }
    });
  });
});
