/**
 * Unit tests for channel permissions validation
 * Testing admin command security validation following TDD Red-Green-Refactor
 */

import { describe, it, expect } from 'vitest';
import { validateChannelPermissions } from '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler';

// Object Mother pattern for Discord interaction and environment test data
const ChannelPermissionsMother = {
  // Valid admin interaction with all permissions
  validAdminInteraction() {
    return {
      id: 'interaction_123',
      application_id: 'app_123',
      type: 2,
      guild_id: 'guild_123456789',
      channel_id: 'admin_channel_id',
      user: {
        id: 'privileged_user_id',
        username: 'admin_user',
      },
      data: {
        id: 'command_123',
        name: 'admin_sync_users_to_sheets',
        type: 1,
      },
    };
  },

  // Interaction missing guild_id (DM context)
  dmInteraction() {
    return {
      id: 'interaction_456',
      application_id: 'app_123',
      type: 2,
      guild_id: undefined, // No guild (DM)
      channel_id: 'dm_channel_id',
      user: {
        id: 'privileged_user_id',
        username: 'admin_user',
      },
      data: {
        id: 'command_123',
        name: 'admin_sync_users_to_sheets',
        type: 1,
      },
    };
  },

  // Interaction in wrong channel
  wrongChannelInteraction() {
    return {
      id: 'interaction_789',
      application_id: 'app_123',
      type: 2,
      guild_id: 'guild_123456789',
      channel_id: 'wrong_channel_id',
      user: {
        id: 'privileged_user_id',
        username: 'admin_user',
      },
      data: {
        id: 'command_123',
        name: 'admin_sync_users_to_sheets',
        type: 1,
      },
    };
  },

  // Interaction from non-privileged user
  unprivilegedUserInteraction() {
    return {
      id: 'interaction_101',
      application_id: 'app_123',
      type: 2,
      guild_id: 'guild_123456789',
      channel_id: 'admin_channel_id',
      user: {
        id: 'regular_user_id',
        username: 'regular_user',
      },
      data: {
        id: 'command_123',
        name: 'admin_sync_users_to_sheets',
        type: 1,
      },
    };
  },

  // Interaction with member instead of user (alternative user access pattern)
  memberBasedInteraction() {
    return {
      id: 'interaction_202',
      application_id: 'app_123',
      type: 2,
      guild_id: 'guild_123456789',
      channel_id: 'admin_channel_id',
      user: undefined, // No direct user
      member: {
        user: {
          id: 'privileged_user_id',
          username: 'admin_user',
        },
      },
      data: {
        id: 'command_123',
        name: 'admin_sync_users_to_sheets',
        type: 1,
      },
    };
  },

  // Valid environment configuration
  validEnvironment() {
    return {
      TEST_CHANNEL_ID: 'admin_channel_id',
      PRIVILEGED_USER_ID: 'privileged_user_id',
      GOOGLE_SHEET_ID: 'sheet_123',
      GOOGLE_SHEETS_CLIENT_EMAIL: 'test@example.com',
      GOOGLE_SHEETS_PRIVATE_KEY: 'key_123',
    };
  },
};

describe('Channel Permissions Validation - Unit Tests', () => {
  describe('validateChannelPermissions', () => {
    it('should accept valid admin interaction with all permissions', () => {
      // Arrange
      const validInteraction = ChannelPermissionsMother.validAdminInteraction();
      const validEnv = ChannelPermissionsMother.validEnvironment();

      // Act
      const result = validateChannelPermissions(validInteraction as any, validEnv as any);

      // Assert - Focus on behavior: permission validation succeeds
      expect(result.success).toBe(true);
    });

    it('should reject interactions outside Discord servers', () => {
      // Testing the behavioral requirement: DM interactions are forbidden
      const dmInteraction = ChannelPermissionsMother.dmInteraction();
      const validEnv = ChannelPermissionsMother.validEnvironment();

      // Act
      const result = validateChannelPermissions(dmInteraction as any, validEnv as any);

      // Assert - Focus on behavior: validation fails for server requirement
      expect(result.success).toBe(false);
    });

    it('should reject interactions from wrong channels', () => {
      // Arrange
      const wrongChannelInteraction = ChannelPermissionsMother.wrongChannelInteraction();
      const validEnv = ChannelPermissionsMother.validEnvironment();

      // Act
      const result = validateChannelPermissions(wrongChannelInteraction as any, validEnv as any);

      // Assert - Focus on behavior: validation fails for channel restrictions
      expect(result.success).toBe(false);
    });

    it('should reject interactions from unauthorized users', () => {
      // Arrange
      const unprivilegedInteraction = ChannelPermissionsMother.unprivilegedUserInteraction();
      const validEnv = ChannelPermissionsMother.validEnvironment();

      // Act
      const result = validateChannelPermissions(unprivilegedInteraction as any, validEnv as any);

      // Assert - Focus on behavior: validation fails for user restrictions
      expect(result.success).toBe(false);
    });

    it('should handle member-based user identification correctly', () => {
      // Testing the behavioral requirement: alternative user access patterns work
      const memberInteraction = ChannelPermissionsMother.memberBasedInteraction();
      const validEnv = ChannelPermissionsMother.validEnvironment();

      // Act
      const result = validateChannelPermissions(memberInteraction as any, validEnv as any);

      // Assert - Focus on behavior: validation succeeds with member-based access
      expect(result.success).toBe(true);
    });
  });
});
