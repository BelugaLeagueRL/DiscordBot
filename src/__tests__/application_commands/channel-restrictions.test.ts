/**
 * Tests for Discord application command channel restrictions
 * Following TDD Red-Green-Refactor cycle
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { validateChannelRestriction } from '../../application_commands/shared/channel-validator';
import { createMockCommandInteraction } from '../helpers/discord-helpers';
import type { Env } from '../../index';

describe('Channel Restriction Validation', () => {
  let mockEnv: Env;

  beforeEach(() => {
    mockEnv = {
      DISCORD_TOKEN: 'test-token',
      DISCORD_PUBLIC_KEY: 'test-key',
      DISCORD_APPLICATION_ID: 'test-app-id',
      DATABASE_URL: 'sqlite://test.db',
      GOOGLE_SHEETS_API_KEY: 'test-sheets-key',
      ENVIRONMENT: 'test',
      SERVER_CHANNEL_ID_TEST_COMMAND_ISSUE: '1388177835331424386',
      SERVER_CHANNEL_ID_TEST_COMMAND_RECEIVE: '1388177835331424386',
    } as const;
  });

  describe('validateChannelRestriction', () => {
    it('should allow commands in the configured channel', () => {
      const interaction = createMockCommandInteraction('register', [], {
        channel_id: '1388177835331424386',
      });

      const result = validateChannelRestriction(interaction, mockEnv);

      expect(result.isAllowed).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject commands from wrong channel', () => {
      const interaction = createMockCommandInteraction('register', [], {
        channel_id: '999999999999999999', // Different channel ID
      });

      const result = validateChannelRestriction(interaction, mockEnv);

      expect(result.isAllowed).toBe(false);
      expect(result.error).toBe(
        'This command can only be used in the designated register channel.'
      );
    });

    it('should reject commands with missing channel_id', () => {
      const interaction = createMockCommandInteraction('register', []);
      // Remove channel_id to simulate missing channel
      const interactionWithoutChannel = { ...interaction };
      delete (interactionWithoutChannel as { channel_id?: unknown }).channel_id;

      const result = validateChannelRestriction(interactionWithoutChannel, mockEnv);

      expect(result.isAllowed).toBe(false);
      expect(result.error).toBe('Unable to determine channel. Please try again.');
    });

    it('should handle missing environment configuration', () => {
      const envWithoutChannelConfig: Env = {
        ...mockEnv,
      };
      // Remove the channel configuration to simulate missing config
      delete (envWithoutChannelConfig as { SERVER_CHANNEL_ID_TEST_COMMAND_ISSUE?: unknown })
        .SERVER_CHANNEL_ID_TEST_COMMAND_ISSUE;

      const interaction = createMockCommandInteraction('register', [], {
        channel_id: '1388177835331424386',
      });

      const result = validateChannelRestriction(interaction, envWithoutChannelConfig);

      expect(result.isAllowed).toBe(false);
      expect(result.error).toBe('Channel restriction not configured.');
    });
  });
});
