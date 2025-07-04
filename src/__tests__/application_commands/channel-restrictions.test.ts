/**
 * Tests for Discord application command channel restrictions
 * Following TDD Red-Green-Refactor cycle
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { validateChannelRestriction } from '../../application_commands/shared';
import { createMockCommandInteraction } from '../helpers/discord-helpers';
import { EnvFactory } from '../helpers/test-factories';
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
      REGISTER_COMMAND_REQUEST_CHANNEL_ID: '1388177835331424386',
      REGISTER_COMMAND_RESPONSE_CHANNEL_ID: '1388177835331424386',
      TEST_CHANNEL_ID: '1234567890123456789',
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
        REGISTER_COMMAND_REQUEST_CHANNEL_ID: undefined as unknown as string,
      };

      const interaction = createMockCommandInteraction('register', [], {
        channel_id: '1388177835331424386',
      });

      const result = validateChannelRestriction(interaction, envWithoutChannelConfig);

      expect(result.isAllowed).toBe(false);
      expect(result.error).toBe(
        'Channel restriction not configured. Missing REGISTER_COMMAND_REQUEST_CHANNEL_ID environment variable.'
      );
    });
  });

  describe('Environment-aware channel validation', () => {
    describe('Development environment', () => {
      it('should allow commands in TEST_CHANNEL_ID when environment is development', () => {
        const devEnv = EnvFactory.development();
        const testChannelId = devEnv.TEST_CHANNEL_ID;
        if (testChannelId === undefined) {
          throw new Error('TEST_CHANNEL_ID should be defined in development environment');
        }
        const interaction = createMockCommandInteraction('register', [], {
          channel_id: testChannelId,
        });

        const result = validateChannelRestriction(interaction, devEnv);

        expect(result.isAllowed).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should reject commands from wrong channel in development environment', () => {
        const devEnv = EnvFactory.development();
        const interaction = createMockCommandInteraction('register', [], {
          channel_id: '999999999999999999', // Different channel ID
        });

        const result = validateChannelRestriction(interaction, devEnv);

        expect(result.isAllowed).toBe(false);
        expect(result.error).toBe('This command can only be used in the test channel.');
      });

      it('should handle missing TEST_CHANNEL_ID in development environment', () => {
        const devEnvWithoutTestChannel = {
          ...EnvFactory.development(),
          TEST_CHANNEL_ID: undefined,
        } as unknown as Env;
        const interaction = createMockCommandInteraction('register', [], {
          channel_id: '1234567890123456789',
        });

        const result = validateChannelRestriction(interaction, devEnvWithoutTestChannel);

        expect(result.isAllowed).toBe(false);
        expect(result.error).toBe(
          'Channel restriction not configured. Missing TEST_CHANNEL_ID environment variable.'
        );
      });
    });

    describe('Production environment', () => {
      it('should allow commands in REGISTER_COMMAND_REQUEST_CHANNEL_ID when environment is production', () => {
        const prodEnv = EnvFactory.production();
        const requestChannelId = prodEnv.REGISTER_COMMAND_REQUEST_CHANNEL_ID;
        if (requestChannelId === undefined) {
          throw new Error(
            'REGISTER_COMMAND_REQUEST_CHANNEL_ID should be defined in production environment'
          );
        }
        const interaction = createMockCommandInteraction('register', [], {
          channel_id: requestChannelId,
        });

        const result = validateChannelRestriction(interaction, prodEnv);

        expect(result.isAllowed).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should reject commands from wrong channel in production environment', () => {
        const prodEnv = EnvFactory.production();
        const interaction = createMockCommandInteraction('register', [], {
          channel_id: '999999999999999999', // Different channel ID
        });

        const result = validateChannelRestriction(interaction, prodEnv);

        expect(result.isAllowed).toBe(false);
        expect(result.error).toBe(
          'This command can only be used in the designated register channel.'
        );
      });

      it('should handle missing REGISTER_COMMAND_REQUEST_CHANNEL_ID in production environment', () => {
        const prodEnvWithoutChannel = {
          ...EnvFactory.production(),
          REGISTER_COMMAND_REQUEST_CHANNEL_ID: undefined,
        } as unknown as Env;
        const interaction = createMockCommandInteraction('register', [], {
          channel_id: '1388177835331424386',
        });

        const result = validateChannelRestriction(interaction, prodEnvWithoutChannel);

        expect(result.isAllowed).toBe(false);
        expect(result.error).toBe(
          'Channel restriction not configured. Missing REGISTER_COMMAND_REQUEST_CHANNEL_ID environment variable.'
        );
      });
    });

    describe('Environment detection', () => {
      it('should use production channel validation when ENVIRONMENT is production', () => {
        const prodEnv = EnvFactory.create({
          ENVIRONMENT: 'production',
          REGISTER_COMMAND_REQUEST_CHANNEL_ID: '1388177835331424386',
          TEST_CHANNEL_ID: '1234567890123456789',
        });

        // Should use production channel, not test channel
        const interaction = createMockCommandInteraction('register', [], {
          channel_id: '1388177835331424386', // Production channel
        });

        const result = validateChannelRestriction(interaction, prodEnv);

        expect(result.isAllowed).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should use development channel validation when ENVIRONMENT is development', () => {
        const devEnv = EnvFactory.create({
          ENVIRONMENT: 'development',
          REGISTER_COMMAND_REQUEST_CHANNEL_ID: '1388177835331424386',
          TEST_CHANNEL_ID: '1234567890123456789',
        });

        // Should use test channel, not production channel
        const interaction = createMockCommandInteraction('register', [], {
          channel_id: '1234567890123456789', // Test channel
        });

        const result = validateChannelRestriction(interaction, devEnv);

        expect(result.isAllowed).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should treat non-development environments as production', () => {
        const testEnv = EnvFactory.create({
          ENVIRONMENT: 'test',
          REGISTER_COMMAND_REQUEST_CHANNEL_ID: '1388177835331424386',
          TEST_CHANNEL_ID: '1234567890123456789',
        });

        // Should use production channel logic for 'test' environment
        const interaction = createMockCommandInteraction('register', [], {
          channel_id: '1388177835331424386', // Production channel
        });

        const result = validateChannelRestriction(interaction, testEnv);

        expect(result.isAllowed).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should handle missing ENVIRONMENT variable gracefully', () => {
        const envWithoutEnvironment = EnvFactory.create({
          ENVIRONMENT: undefined as unknown as string,
          REGISTER_COMMAND_REQUEST_CHANNEL_ID: '1388177835331424386',
          TEST_CHANNEL_ID: '1234567890123456789',
        });

        // Should default to production behavior
        const interaction = createMockCommandInteraction('register', [], {
          channel_id: '1388177835331424386', // Production channel
        });

        const result = validateChannelRestriction(interaction, envWithoutEnvironment);

        expect(result.isAllowed).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    describe('Channel ID validation consistency', () => {
      it('should reject TEST_CHANNEL_ID in production environment', () => {
        const prodEnv = EnvFactory.production();
        const interaction = createMockCommandInteraction('register', [], {
          channel_id: '1234567890123456789', // Test channel ID
        });

        const result = validateChannelRestriction(interaction, prodEnv);

        expect(result.isAllowed).toBe(false);
        expect(result.error).toBe(
          'This command can only be used in the designated register channel.'
        );
      });

      it('should reject REGISTER_COMMAND_REQUEST_CHANNEL_ID in development environment', () => {
        const devEnv = EnvFactory.development();
        const interaction = createMockCommandInteraction('register', [], {
          channel_id: '1388177835331424386', // Production channel ID
        });

        const result = validateChannelRestriction(interaction, devEnv);

        expect(result.isAllowed).toBe(false);
        expect(result.error).toBe('This command can only be used in the test channel.');
      });
    });
  });
});
