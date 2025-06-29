/**
 * End-to-End tests for complete Discord command workflows
 * Using integration testing approach with direct handler testing
 * Tests complete request/response cycles through the Worker runtime
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InteractionResponseType } from '../../utils/discord';
import { createMockDiscordRequest, createMockCommandInteraction } from '../helpers/discord-helpers';
import {
  EnvFactory,
  ExecutionContextFactory,
  getRequestChannelId,
} from '../helpers/test-factories';
import { handleRegisterCommand } from '../../application_commands/register';
import workerModule from '../../index';
import type { Env } from '../../index';
import type { DiscordInteraction } from '../../types/discord';

// Type guard for Discord response data
function isDiscordResponse(
  data: unknown
): data is { type: number; data: { content: string; flags: number } } {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj['type'] !== 'number') {
    return false;
  }

  if (typeof obj['data'] !== 'object' || obj['data'] === null) {
    return false;
  }

  const dataObj = obj['data'] as Record<string, unknown>;

  return typeof dataObj['content'] === 'string' && typeof dataObj['flags'] === 'number';
}

// Mock the security middleware to control validation results
vi.mock('../../middleware/security', async () => {
  const actual = await vi.importActual('../../middleware/security');
  return {
    ...actual,
    verifyDiscordRequestSecure: vi.fn().mockResolvedValue({ isValid: true }),
    cleanupRateLimits: vi.fn(),
  };
});

describe('Discord Command Workflows E2E', () => {
  let mockEnv: Env;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock environment for testing with channel restrictions
    mockEnv = EnvFactory.create();
  });

  describe('Complete Command Processing Workflows', () => {
    it('should process successful /register command with valid tracker URLs', async () => {
      // Use deterministic known values for predictable testing
      const knownSteamId = '76561198144145654';
      const knownEpicUser = 'test-player';
      const interaction = createMockCommandInteraction(
        'register',
        [
          {
            name: 'tracker1',
            type: 3,
            value: `https://rocketleague.tracker.network/rocket-league/profile/steam/${knownSteamId}/overview`,
          },
          {
            name: 'tracker2',
            type: 3,
            value: `https://rocketleague.tracker.network/rocket-league/profile/epic/${knownEpicUser}/overview`,
          },
        ],
        {
          channel_id: getRequestChannelId(mockEnv), // Correct channel for testing
        }
      );

      const request = createMockDiscordRequest(interaction);

      const mockCtx = ExecutionContextFactory.create();
      const response = await workerModule.fetch(request, mockEnv, mockCtx);
      expect(response.status).toBe(200);

      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;
      expect(responseData.type).toBe(InteractionResponseType.ChannelMessageWithSource);
      expect(responseData.data.content).toContain('✅ Registration received!');
      expect(responseData.data.flags).toBe(64); // Ephemeral flag
    });

    it('should process /register command with invalid tracker URLs', async () => {
      // Use deterministic invalid URLs for predictable testing
      const interaction = createMockCommandInteraction(
        'register',
        [
          {
            name: 'tracker1',
            type: 3,
            value: 'https://invalid-domain.com/profile/steam/testuser/overview',
          },
          {
            name: 'tracker2',
            type: 3,
            value: 'https://rocketleague.tracker.network/wrong/path/format',
          },
        ],
        {
          channel_id: getRequestChannelId(mockEnv),
        }
      );

      const mockCtx = ExecutionContextFactory.create();
      const response = await handleRegisterCommand(interaction, mockEnv, mockCtx);
      expect(response.status).toBe(200);

      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;
      expect(responseData.type).toBe(InteractionResponseType.ChannelMessageWithSource);
      expect(responseData.data.content).toContain('Invalid tracker URLs:');
      expect(responseData.data.content).toContain('rocketleague.tracker.network');
      expect(responseData.data.flags).toBe(64); // Ephemeral flag
    });

    it('should process /register command with mixed valid/invalid URLs', async () => {
      // Use deterministic known values for predictable testing
      const knownPsnUser = 'validuser123';
      const knownXblUser = 'ValidGamer';
      const interaction = createMockCommandInteraction(
        'register',
        [
          {
            name: 'tracker1',
            type: 3,
            value: `https://rocketleague.tracker.network/rocket-league/profile/psn/${knownPsnUser}/overview`,
          },
          {
            name: 'tracker2',
            type: 3,
            value: `https://rocketleague.tracker.network/rocket-league/profile/xbl/${knownXblUser}/overview`,
          },
          {
            name: 'tracker3',
            type: 3,
            value: 'https://invalid-domain.com/profile/steam/testuser/overview', // Invalid URL
          },
        ],
        {
          channel_id: getRequestChannelId(mockEnv),
        }
      );

      const mockCtx = ExecutionContextFactory.create();
      const response = await handleRegisterCommand(interaction, mockEnv, mockCtx);
      expect(response.status).toBe(200);

      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;
      expect(responseData.type).toBe(InteractionResponseType.ChannelMessageWithSource);
      expect(responseData.data.content).toContain('✅ Registration received!');
      expect(responseData.data.flags).toBe(64); // Ephemeral flag
    });

    it('should handle /register command with no tracker URLs provided', async () => {
      const interaction = createMockCommandInteraction('register', [], {
        channel_id: getRequestChannelId(mockEnv),
      });

      const mockCtx = ExecutionContextFactory.create();
      const response = await handleRegisterCommand(interaction, mockEnv, mockCtx);
      expect(response.status).toBe(200);

      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;
      expect(responseData.type).toBe(InteractionResponseType.ChannelMessageWithSource);
      expect(responseData.data.content).toContain('Please provide at least one tracker URL');
      expect(responseData.data.flags).toBe(64); // Ephemeral flag
    });

    it('should handle missing user information gracefully', async () => {
      // Use deterministic known tracker URL for predictable testing
      const knownSteamId = '76561198999999999';
      const { member: _member, ...interactionWithoutMember } = createMockCommandInteraction(
        'register',
        [
          {
            name: 'tracker1',
            type: 3,
            value: `https://rocketleague.tracker.network/rocket-league/profile/steam/${knownSteamId}/overview`,
          },
        ],
        {
          channel_id: getRequestChannelId(mockEnv),
        }
      );
      const interaction = interactionWithoutMember as DiscordInteraction;

      const mockCtx = ExecutionContextFactory.create();
      const response = await handleRegisterCommand(interaction, mockEnv, mockCtx);
      expect(response.status).toBe(200);

      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;
      expect(responseData.type).toBe(InteractionResponseType.ChannelMessageWithSource);
      expect(responseData.data.content).toContain('Could not identify user');
      expect(responseData.data.flags).toBe(64); // Ephemeral flag
    });
  });

  describe('URL Validation Workflow Integration', () => {
    it('should validate Steam platform URLs correctly', async () => {
      // Use deterministic known Steam ID for predictable testing
      const knownSteamId = '76561198144145654';
      const interaction = createMockCommandInteraction(
        'register',
        [
          {
            name: 'tracker1',
            type: 3,
            value: `https://rocketleague.tracker.network/rocket-league/profile/steam/${knownSteamId}/overview`,
          },
        ],
        {
          channel_id: getRequestChannelId(mockEnv),
        }
      );

      const mockCtx = ExecutionContextFactory.create();
      const response = await handleRegisterCommand(interaction, mockEnv, mockCtx);
      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;

      expect(responseData.data.content).toContain('✅ Registration received!');
    });

    it('should validate Epic platform URLs correctly', async () => {
      // Use deterministic known Epic user for predictable testing
      const knownEpicUser = 'test-epic-user';
      const interaction = createMockCommandInteraction(
        'register',
        [
          {
            name: 'tracker1',
            type: 3,
            value: `https://rocketleague.tracker.network/rocket-league/profile/epic/${knownEpicUser}/overview`,
          },
        ],
        {
          channel_id: getRequestChannelId(mockEnv),
        }
      );

      const mockCtx = ExecutionContextFactory.create();
      const response = await handleRegisterCommand(interaction, mockEnv, mockCtx);
      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;

      expect(responseData.data.content).toContain('✅ Registration received!');
    });

    it('should validate PSN platform URLs correctly', async () => {
      // Use deterministic known PSN user for predictable testing
      const knownPsnUser = 'testpsnuser';
      const interaction = createMockCommandInteraction(
        'register',
        [
          {
            name: 'tracker1',
            type: 3,
            value: `https://rocketleague.tracker.network/rocket-league/profile/psn/${knownPsnUser}/overview`,
          },
        ],
        {
          channel_id: getRequestChannelId(mockEnv),
        }
      );

      const mockCtx = ExecutionContextFactory.create();
      const response = await handleRegisterCommand(interaction, mockEnv, mockCtx);
      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;

      expect(responseData.data.content).toContain('✅ Registration received!');
    });

    it('should validate Xbox platform URLs correctly', async () => {
      // Use deterministic known Xbox user for predictable testing
      const knownXblUser = 'TestGamer';
      const interaction = createMockCommandInteraction(
        'register',
        [
          {
            name: 'tracker1',
            type: 3,
            value: `https://rocketleague.tracker.network/rocket-league/profile/xbl/${knownXblUser}/overview`,
          },
        ],
        {
          channel_id: getRequestChannelId(mockEnv),
        }
      );

      const mockCtx = ExecutionContextFactory.create();
      const response = await handleRegisterCommand(interaction, mockEnv, mockCtx);
      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;

      expect(responseData.data.content).toContain('✅ Registration received!');
    });

    it('should validate Switch platform URLs correctly', async () => {
      // Use deterministic known Switch user for predictable testing
      const knownSwitchUser = 'test-switch-user';
      const interaction = createMockCommandInteraction(
        'register',
        [
          {
            name: 'tracker1',
            type: 3,
            value: `https://rocketleague.tracker.network/rocket-league/profile/switch/${knownSwitchUser}/overview`,
          },
        ],
        {
          channel_id: getRequestChannelId(mockEnv),
        }
      );

      const mockCtx = ExecutionContextFactory.create();
      const response = await handleRegisterCommand(interaction, mockEnv, mockCtx);
      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;

      expect(responseData.data.content).toContain('✅ Registration received!');
    });
  });

  describe('Error Handling Workflows', () => {
    it('should handle command execution errors gracefully', async () => {
      const invalidInteraction = createMockCommandInteraction('register', [], {
        data: {
          id: '987654321098765432',
          name: 'register',
          type: 1,
        },
        channel_id: getRequestChannelId(mockEnv),
      });

      const mockCtx = ExecutionContextFactory.create();
      const response = await handleRegisterCommand(invalidInteraction, mockEnv, mockCtx);
      expect(response.status).toBe(200);

      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;
      expect(responseData.type).toBe(InteractionResponseType.ChannelMessageWithSource);
      expect(responseData.data.content).toContain('Please provide at least one tracker URL');
      expect(responseData.data.flags).toBe(64); // Ephemeral flag
    });

    it('should handle all invalid URLs scenario', async () => {
      // Use deterministic invalid URLs for predictable testing
      const interaction = createMockCommandInteraction(
        'register',
        [
          {
            name: 'tracker1',
            type: 3,
            value: 'https://invalid-domain.com/profile/steam/testuser/overview',
          },
          {
            name: 'tracker2',
            type: 3,
            value: 'https://another-invalid.com/profile/epic/testuser/overview',
          },
        ],
        {
          channel_id: getRequestChannelId(mockEnv),
        }
      );

      const mockCtx = ExecutionContextFactory.create();
      const response = await handleRegisterCommand(interaction, mockEnv, mockCtx);
      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;

      expect(responseData.data.content).toContain('Invalid tracker URLs:');
      expect(responseData.data.content).not.toContain('Successfully registered');
    });
  });

  describe('Performance Validation in E2E Context', () => {
    it('should process commands efficiently', async () => {
      // Use deterministic known tracker URL for predictable testing
      const knownSteamId = '76561198123456789';
      const interaction = createMockCommandInteraction(
        'register',
        [
          {
            name: 'tracker1',
            type: 3,
            value: `https://rocketleague.tracker.network/rocket-league/profile/steam/${knownSteamId}/overview`,
          },
        ],
        {
          channel_id: getRequestChannelId(mockEnv),
        }
      );

      const startTime = performance.now();
      const mockCtx = ExecutionContextFactory.create();
      const response = await handleRegisterCommand(interaction, mockEnv, mockCtx);
      const endTime = performance.now();

      const processingTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(processingTime).toBeLessThan(100); // Should process quickly
    });

    it('should handle multiple tracker URLs efficiently', async () => {
      // Use deterministic known tracker URLs for predictable testing
      const knownSteamId = '76561198123456789';
      const knownEpicUser = 'test-epic-user';
      const knownPsnUser = 'test-psn-user';
      const knownXblUser = 'TestXblUser';
      const interaction = createMockCommandInteraction(
        'register',
        [
          {
            name: 'tracker1',
            type: 3,
            value: `https://rocketleague.tracker.network/rocket-league/profile/steam/${knownSteamId}/overview`,
          },
          {
            name: 'tracker2',
            type: 3,
            value: `https://rocketleague.tracker.network/rocket-league/profile/epic/${knownEpicUser}/overview`,
          },
          {
            name: 'tracker3',
            type: 3,
            value: `https://rocketleague.tracker.network/rocket-league/profile/psn/${knownPsnUser}/overview`,
          },
          {
            name: 'tracker4',
            type: 3,
            value: `https://rocketleague.tracker.network/rocket-league/profile/xbl/${knownXblUser}/overview`,
          },
        ],
        {
          channel_id: getRequestChannelId(mockEnv),
        }
      );

      const startTime = performance.now();
      const mockCtx = ExecutionContextFactory.create();
      const response = await handleRegisterCommand(interaction, mockEnv, mockCtx);
      const endTime = performance.now();

      const processingTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(processingTime).toBeLessThan(150); // Should handle multiple URLs efficiently

      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;
      expect(responseData.data.content).toContain('✅ Registration received!');
    });
  });
});
