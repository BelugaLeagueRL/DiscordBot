/**
 * Integration tests for admin validation system
 * Tests combined channel + permission validation
 */

import { describe, it, expect } from 'vitest';
import type { DiscordInteraction } from '../../../types/discord';
import type { Env } from '../../../index';
import {
  validateAdminChannelRestriction,
  validateAdminPermissions,
  type AdminChannelValidationResult,
  type AdminPermissionResult,
} from '../../../application_commands/shared';

describe('Admin Validation Integration', () => {
  const mockEnv: Env = {
    DISCORD_TOKEN: 'test-token',
    DISCORD_PUBLIC_KEY: 'test-key',
    DISCORD_APPLICATION_ID: 'test-app-id',
    DATABASE_URL: 'test-db',
    GOOGLE_SHEETS_API_KEY: 'test-api-key',
    GOOGLE_SHEET_ID: 'test-sheet-id',
    ENVIRONMENT: 'test',
    REGISTER_COMMAND_REQUEST_CHANNEL_ID: '1111111111111111111',
    REGISTER_COMMAND_RESPONSE_CHANNEL_ID: '2222222222222222222',
    TEST_CHANNEL_ID: '1388177835331424386',
    PRIVILEGED_USER_ID: '354474826192388127',
  } as const;

  const createAdminUserInCorrectChannel = (): DiscordInteraction => ({
    id: 'test-interaction-id',
    application_id: 'test-app-id',
    type: 2,
    token: 'test-token',
    version: 1,
    channel_id: '1388177835331424386', // Correct TEST_CHANNEL_ID
    guild_id: 'test-guild-id',
    member: {
      user: {
        id: 'admin-user-123',
        username: 'admin-user',
      },
      roles: ['8'], // Administrator role
    },
  });

  const createPrivilegedUserInCorrectChannel = (): DiscordInteraction => ({
    id: 'test-interaction-id',
    application_id: 'test-app-id',
    type: 2,
    token: 'test-token',
    version: 1,
    channel_id: '1388177835331424386', // Correct TEST_CHANNEL_ID
    guild_id: 'test-guild-id',
    member: {
      user: {
        id: '354474826192388127', // PRIVILEGED_USER_ID
        username: 'privileged-user',
      },
    },
  });

  const createRegularUserInCorrectChannel = (): DiscordInteraction => ({
    id: 'test-interaction-id',
    application_id: 'test-app-id',
    type: 2,
    token: 'test-token',
    version: 1,
    channel_id: '1388177835331424386', // Correct TEST_CHANNEL_ID
    guild_id: 'test-guild-id',
    member: {
      user: {
        id: 'regular-user-123',
        username: 'regular-user',
      },
      roles: ['999999999'], // Regular role
    },
  });

  const createAdminUserInWrongChannel = (): DiscordInteraction => ({
    id: 'test-interaction-id',
    application_id: 'test-app-id',
    type: 2,
    token: 'test-token',
    version: 1,
    channel_id: '9999999999999999999', // Wrong channel
    guild_id: 'test-guild-id',
    member: {
      user: {
        id: 'admin-user-123',
        username: 'admin-user',
      },
      roles: ['8'], // Administrator role
    },
  });

  /**
   * Helper function to validate complete admin access
   * Combines both channel and permission validation
   */
  function validateCompleteAdminAccess(
    interaction: Readonly<DiscordInteraction>,
    env: Readonly<Env>
  ): {
    readonly isFullyAuthorized: boolean;
    readonly channelResult: AdminChannelValidationResult;
    readonly permissionResult: AdminPermissionResult;
    readonly blockingError?: string;
  } {
    const channelResult: AdminChannelValidationResult = validateAdminChannelRestriction(
      interaction,
      env
    );
    const permissionResult: AdminPermissionResult = validateAdminPermissions(interaction, env);

    // Both must pass for full authorization
    const isFullyAuthorized: boolean = channelResult.isAllowed && permissionResult.isAuthorized;

    // Priority: Channel restriction error comes first
    const blockingError: string | undefined = channelResult.error ?? permissionResult.error;

    const result = {
      isFullyAuthorized,
      channelResult,
      permissionResult,
    };

    if (blockingError !== undefined) {
      return { ...result, blockingError };
    }

    return result;
  }

  describe('successful admin command scenarios', () => {
    it('should fully authorize admin user in correct channel', () => {
      // Arrange
      const interaction = createAdminUserInCorrectChannel();

      // Act
      const result = validateCompleteAdminAccess(interaction, mockEnv);

      // Assert
      expect(result.isFullyAuthorized).toBe(true);
    });

    it('should pass channel validation for admin user in correct channel', () => {
      // Arrange
      const interaction = createAdminUserInCorrectChannel();

      // Act
      const result = validateCompleteAdminAccess(interaction, mockEnv);

      // Assert
      expect(result.channelResult.isAllowed).toBe(true);
    });

    it('should pass permission validation for admin user in correct channel', () => {
      // Arrange
      const interaction = createAdminUserInCorrectChannel();

      // Act
      const result = validateCompleteAdminAccess(interaction, mockEnv);

      // Assert
      expect(result.permissionResult.isAuthorized).toBe(true);
    });

    it('should identify admin role user type for admin user in correct channel', () => {
      // Arrange
      const interaction = createAdminUserInCorrectChannel();

      // Act
      const result = validateCompleteAdminAccess(interaction, mockEnv);

      // Assert
      expect(result.permissionResult.userType).toBe('admin_role');
    });

    it('should not return blocking error for admin user in correct channel', () => {
      // Arrange
      const interaction = createAdminUserInCorrectChannel();

      // Act
      const result = validateCompleteAdminAccess(interaction, mockEnv);

      // Assert
      expect(result.blockingError).toBeUndefined();
    });

    it('should allow privileged user in correct channel', () => {
      // Arrange
      const interaction = createPrivilegedUserInCorrectChannel();

      // Act
      const result = validateCompleteAdminAccess(interaction, mockEnv);

      // Assert
      expect(result.isFullyAuthorized).toBe(true);
      expect(result.channelResult.isAllowed).toBe(true);
      expect(result.permissionResult.isAuthorized).toBe(true);
      expect(result.permissionResult.userType).toBe('privileged_user');
      expect(result.blockingError).toBeUndefined();
    });
  });

  describe('blocked admin command scenarios', () => {
    it('should deny full authorization for regular user in correct channel', () => {
      // Arrange
      const interaction = createRegularUserInCorrectChannel();

      // Act
      const result = validateCompleteAdminAccess(interaction, mockEnv);

      // Assert
      expect(result.isFullyAuthorized).toBe(false);
    });

    it('should pass channel validation for regular user in correct channel', () => {
      // Arrange
      const interaction = createRegularUserInCorrectChannel();

      // Act
      const result = validateCompleteAdminAccess(interaction, mockEnv);

      // Assert
      expect(result.channelResult.isAllowed).toBe(true); // Channel is correct
    });

    it('should fail permission validation for regular user in correct channel', () => {
      // Arrange
      const interaction = createRegularUserInCorrectChannel();

      // Act
      const result = validateCompleteAdminAccess(interaction, mockEnv);

      // Assert
      expect(result.permissionResult.isAuthorized).toBe(false); // But no permissions
    });

    it('should return access denied error for regular user in correct channel', () => {
      // Arrange
      const interaction = createRegularUserInCorrectChannel();

      // Act
      const result = validateCompleteAdminAccess(interaction, mockEnv);

      // Assert
      expect(result.blockingError).toBe(
        'Access denied. Admin role or special permissions required.'
      );
    });

    it('should block admin user in wrong channel (channel issue takes priority)', () => {
      // Arrange
      const interaction = createAdminUserInWrongChannel();

      // Act
      const result = validateCompleteAdminAccess(interaction, mockEnv);

      // Assert
      expect(result.isFullyAuthorized).toBe(false);
      expect(result.channelResult.isAllowed).toBe(false); // Channel is wrong
      expect(result.permissionResult.isAuthorized).toBe(true); // But permissions are correct
      expect(result.blockingError).toBe(
        'This admin command can only be used in the designated test channel.'
      );
    });
  });

  describe('validation order and error precedence', () => {
    it('should prioritize channel errors over permission errors', () => {
      // Arrange
      const wrongChannelInteraction: DiscordInteraction = {
        id: 'test-interaction-id',
        application_id: 'test-app-id',
        type: 2,
        token: 'test-token',
        version: 1,
        channel_id: '9999999999999999999', // Wrong channel
        guild_id: 'test-guild-id',
        member: {
          user: {
            id: 'regular-user-123',
            username: 'regular-user',
          },
          roles: ['999999999'], // Also no admin permissions
        },
      };

      // Act
      const result = validateCompleteAdminAccess(wrongChannelInteraction, mockEnv);

      // Assert
      expect(result.isFullyAuthorized).toBe(false);
      expect(result.channelResult.isAllowed).toBe(false);
      expect(result.permissionResult.isAuthorized).toBe(false);
      // Channel error should take priority
      expect(result.blockingError).toBe(
        'This admin command can only be used in the designated test channel.'
      );
    });
  });

  describe('configuration edge cases', () => {
    it('should handle missing TEST_CHANNEL_ID configuration', () => {
      // Arrange
      const envWithoutChannel = {
        ...mockEnv,
        TEST_CHANNEL_ID: undefined,
      } as unknown as Env;
      const interaction = createAdminUserInCorrectChannel();

      // Act
      const result = validateCompleteAdminAccess(interaction, envWithoutChannel);

      // Assert
      expect(result.isFullyAuthorized).toBe(false);
      expect(result.channelResult.isAllowed).toBe(false);
      expect(result.blockingError).toBe('Admin command channel not configured.');
    });

    it('should handle missing PRIVILEGED_USER_ID configuration', () => {
      // Arrange
      const envWithoutPrivilegedUser = {
        ...mockEnv,
        PRIVILEGED_USER_ID: undefined,
      } as unknown as Env;
      const interaction = createPrivilegedUserInCorrectChannel();

      // Act
      const result = validateCompleteAdminAccess(interaction, envWithoutPrivilegedUser);

      // Assert
      expect(result.isFullyAuthorized).toBe(false);
      expect(result.channelResult.isAllowed).toBe(true); // Channel still works
      expect(result.permissionResult.isAuthorized).toBe(false); // But privileged user check fails
      expect(result.blockingError).toBe(
        'Access denied. Admin role or special permissions required.'
      );
    });
  });
});
