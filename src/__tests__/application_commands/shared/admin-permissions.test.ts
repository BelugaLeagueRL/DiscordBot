/**
 * Tests for admin permissions validation
 * Ensures admin commands work for users with Admin role or PRIVILEGED_USER_ID
 */

import { describe, it, expect } from 'vitest';
import type { DiscordInteraction } from '../../../types/discord';
import type { Env } from '../../../index';
import { validateAdminPermissions } from '../../../application_commands/shared/admin-permissions';

describe('validateAdminPermissions', () => {
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

  const createInteractionWithMember = (
    userId: string,
    roles?: readonly string[]
  ): DiscordInteraction => {
    const baseInteraction: DiscordInteraction = {
      id: 'test-interaction-id',
      application_id: 'test-app-id',
      type: 2,
      token: 'test-token',
      version: 1,
    };

    const member: DiscordInteraction['member'] = {
      user: {
        id: userId,
        username: 'test-user',
      },
    };

    if (roles !== undefined) {
      return {
        ...baseInteraction,
        member: { ...member, roles },
        guild_id: 'test-guild-id',
      };
    }

    return {
      ...baseInteraction,
      member,
      guild_id: 'test-guild-id',
    };
  };

  const createDirectUserInteraction = (userId: string): DiscordInteraction => ({
    id: 'test-interaction-id',
    application_id: 'test-app-id',
    type: 2,
    token: 'test-token',
    version: 1,
    user: {
      id: userId,
      username: 'test-user',
    },
  });

  describe('admin role validation', () => {
    it('should authorize user with Administrator role', () => {
      // Arrange
      const adminRoleId = '8'; // Administrator permission
      const interaction = createInteractionWithMember('regular-user-123', [adminRoleId]);

      // Act
      const result = validateAdminPermissions(interaction, mockEnv);

      // Assert
      expect(result.isAuthorized).toBe(true);
    });

    it('should identify user type as admin_role for Administrator role', () => {
      // Arrange
      const adminRoleId = '8'; // Administrator permission
      const interaction = createInteractionWithMember('regular-user-123', [adminRoleId]);

      // Act
      const result = validateAdminPermissions(interaction, mockEnv);

      // Assert
      expect(result.userType).toBe('admin_role');
    });

    it('should not return error for user with Administrator role', () => {
      // Arrange
      const adminRoleId = '8'; // Administrator permission
      const interaction = createInteractionWithMember('regular-user-123', [adminRoleId]);

      // Act
      const result = validateAdminPermissions(interaction, mockEnv);

      // Assert
      expect(result.error).toBeUndefined();
    });

    it('should deny authorization for user without admin role', () => {
      // Arrange
      const regularRoleId = '123456789';
      const interaction = createInteractionWithMember('regular-user-123', [regularRoleId]);

      // Act
      const result = validateAdminPermissions(interaction, mockEnv);

      // Assert
      expect(result.isAuthorized).toBe(false);
    });

    it('should return access denied error for user without admin role', () => {
      // Arrange
      const regularRoleId = '123456789';
      const interaction = createInteractionWithMember('regular-user-123', [regularRoleId]);

      // Act
      const result = validateAdminPermissions(interaction, mockEnv);

      // Assert
      expect(result.error).toBe('Access denied. Admin role or special permissions required.');
    });

    it('should not set user type for user without admin role', () => {
      // Arrange
      const regularRoleId = '123456789';
      const interaction = createInteractionWithMember('regular-user-123', [regularRoleId]);

      // Act
      const result = validateAdminPermissions(interaction, mockEnv);

      // Assert
      expect(result.userType).toBeUndefined();
    });

    it('should return authorized=false for user with no roles', () => {
      // Arrange
      const interaction = createInteractionWithMember('regular-user-123', []);

      // Act
      const result = validateAdminPermissions(interaction, mockEnv);

      // Assert
      expect(result.isAuthorized).toBe(false);
      expect(result.error).toBe('Access denied. Admin role or special permissions required.');
    });

    it('should return authorized=false for user with undefined roles', () => {
      // Arrange
      const interaction = createInteractionWithMember('regular-user-123');

      // Act
      const result = validateAdminPermissions(interaction, mockEnv);

      // Assert
      expect(result.isAuthorized).toBe(false);
      expect(result.error).toBe('Access denied. Admin role or special permissions required.');
    });
  });

  describe('privileged user validation', () => {
    it('should authorize PRIVILEGED_USER_ID', () => {
      // Arrange
      const interaction = createInteractionWithMember('354474826192388127');

      // Act
      const result = validateAdminPermissions(interaction, mockEnv);

      // Assert
      expect(result.isAuthorized).toBe(true);
    });

    it('should identify user type as privileged_user for PRIVILEGED_USER_ID', () => {
      // Arrange
      const interaction = createInteractionWithMember('354474826192388127');

      // Act
      const result = validateAdminPermissions(interaction, mockEnv);

      // Assert
      expect(result.userType).toBe('privileged_user');
    });

    it('should not return error for PRIVILEGED_USER_ID', () => {
      // Arrange
      const interaction = createInteractionWithMember('354474826192388127');

      // Act
      const result = validateAdminPermissions(interaction, mockEnv);

      // Assert
      expect(result.error).toBeUndefined();
    });

    it('should authorize PRIVILEGED_USER_ID in direct user interaction', () => {
      // Arrange
      const interaction = createDirectUserInteraction('354474826192388127');

      // Act
      const result = validateAdminPermissions(interaction, mockEnv);

      // Assert
      expect(result.isAuthorized).toBe(true);
    });

    it('should identify user type as privileged_user in direct user interaction', () => {
      // Arrange
      const interaction = createDirectUserInteraction('354474826192388127');

      // Act
      const result = validateAdminPermissions(interaction, mockEnv);

      // Assert
      expect(result.userType).toBe('privileged_user');
    });

    it('should return authorized=false for non-privileged user ID', () => {
      // Arrange
      const interaction = createInteractionWithMember('999888777666555444');

      // Act
      const result = validateAdminPermissions(interaction, mockEnv);

      // Assert
      expect(result.isAuthorized).toBe(false);
      expect(result.error).toBe('Access denied. Admin role or special permissions required.');
    });
  });

  describe('configuration validation', () => {
    it('should handle missing PRIVILEGED_USER_ID gracefully', () => {
      // Arrange
      const envWithoutPrivilegedUser = {
        ...mockEnv,
        PRIVILEGED_USER_ID: undefined,
      } as unknown as Env;
      const interaction = createInteractionWithMember('354474826192388127');

      // Act
      const result = validateAdminPermissions(interaction, envWithoutPrivilegedUser);

      // Assert
      expect(result.isAuthorized).toBe(false);
      expect(result.error).toBe('Access denied. Admin role or special permissions required.');
    });
  });

  describe('edge cases', () => {
    it('should handle interaction without member or user', () => {
      // Arrange
      const interaction: DiscordInteraction = {
        id: 'test-interaction-id',
        application_id: 'test-app-id',
        type: 2,
        token: 'test-token',
        version: 1,
      };

      // Act
      const result = validateAdminPermissions(interaction, mockEnv);

      // Assert
      expect(result.isAuthorized).toBe(false);
      expect(result.error).toBe('Unable to identify user. Please try again.');
    });

    it('should prioritize admin role over privileged user when both match', () => {
      // Arrange
      const adminRoleId = '8';
      const interaction = createInteractionWithMember('354474826192388127', [adminRoleId]);

      // Act
      const result = validateAdminPermissions(interaction, mockEnv);

      // Assert
      expect(result.isAuthorized).toBe(true);
      expect(result.userType).toBe('admin_role'); // Admin role takes priority
    });
  });
});
