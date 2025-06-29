/**
 * Tests for admin channel validation
 * Ensures admin commands only work in TEST_CHANNEL_ID
 */

import { describe, it, expect } from 'vitest';
import type { DiscordInteraction } from '../../../types/discord';
import type { Env } from '../../../index';
import { validateAdminChannelRestriction } from '../../../application_commands/shared/admin-channel-validator';

describe('validateAdminChannelRestriction', () => {
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

  const createMockInteraction = (channelId?: string): DiscordInteraction => {
    const baseInteraction: DiscordInteraction = {
      id: 'test-interaction-id',
      application_id: 'test-app-id',
      type: 2,
      token: 'test-token',
      version: 1,
    };

    if (channelId !== undefined) {
      return { ...baseInteraction, channel_id: channelId };
    }

    return baseInteraction;
  };

  describe('when TEST_CHANNEL_ID is configured', () => {
    it('should return allowed=true for TEST_CHANNEL_ID', () => {
      // Arrange
      const interaction = createMockInteraction('1388177835331424386');

      // Act
      const result = validateAdminChannelRestriction(interaction, mockEnv);

      // Assert
      expect(result.isAllowed).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return allowed=false for wrong channel', () => {
      // Arrange
      const wrongChannelId = '9999999999999999999';
      const interaction = createMockInteraction(wrongChannelId);

      // Act
      const result = validateAdminChannelRestriction(interaction, mockEnv);

      // Assert
      expect(result.isAllowed).toBe(false);
      expect(result.error).toBe(
        'This admin command can only be used in the designated test channel.'
      );
    });

    it('should return allowed=false when interaction has no channel_id', () => {
      // Arrange
      const interaction = createMockInteraction(undefined);

      // Act
      const result = validateAdminChannelRestriction(interaction, mockEnv);

      // Assert
      expect(result.isAllowed).toBe(false);
      expect(result.error).toBe('Unable to determine channel. Please try again.');
    });
  });

  describe('when TEST_CHANNEL_ID is not configured', () => {
    it('should return allowed=false when TEST_CHANNEL_ID is undefined', () => {
      // Arrange
      const envWithoutTestChannel = {
        ...mockEnv,
        TEST_CHANNEL_ID: undefined,
      } as unknown as Env;
      const interaction = createMockInteraction('1388177835331424386');

      // Act
      const result = validateAdminChannelRestriction(interaction, envWithoutTestChannel);

      // Assert
      expect(result.isAllowed).toBe(false);
      expect(result.error).toBe('Admin command channel not configured.');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string channel_id', () => {
      // Arrange
      const interaction = createMockInteraction('');

      // Act
      const result = validateAdminChannelRestriction(interaction, mockEnv);

      // Assert
      expect(result.isAllowed).toBe(false);
      expect(result.error).toBe('Unable to determine channel. Please try again.');
    });

    it('should be case sensitive for channel IDs', () => {
      // Arrange
      const interaction = createMockInteraction('1388177835331424386'); // Correct case

      // Act
      const result = validateAdminChannelRestriction(interaction, mockEnv);

      // Assert
      expect(result.isAllowed).toBe(true);
    });
  });
});
