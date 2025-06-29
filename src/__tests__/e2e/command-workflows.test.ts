/**
 * End-to-End tests for complete Discord command workflows
 * Using integration testing approach with direct handler testing
 * Tests complete request/response cycles through the Worker runtime
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InteractionResponseType } from '../../utils/discord';
import { handleRegisterCommand } from '../../application_commands/register/handler';
import { createMockCommandInteraction } from '../helpers/discord-helpers';
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

// Mock discord-interactions for E2E tests
vi.mock('discord-interactions', () => ({
  verifyKey: vi.fn(() => true), // Always pass verification for E2E tests
}));

describe('Discord Command Workflows E2E', () => {
  let mockEnv: Env;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock environment for testing
    mockEnv = {
      DISCORD_PUBLIC_KEY: 'test_public_key',
      DISCORD_TOKEN: 'test_token',
      DISCORD_APPLICATION_ID: 'test_app_id',
      DATABASE_URL: 'test_db_url',
      GOOGLE_SHEETS_API_KEY: 'test_sheets_key',
      ENVIRONMENT: 'test',
    } as Env;
  });

  describe('Complete Command Processing Workflows', () => {
    it('should process successful /register command with valid tracker URLs', async () => {
      // Use deterministic known values for predictable testing
      const knownSteamId = '76561198144145654';
      const knownEpicUser = 'test-player';
      const interaction = createMockCommandInteraction('register', [
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
      ]);

      const response = handleRegisterCommand(interaction, mockEnv);
      expect(response.status).toBe(200);

      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;
      expect(responseData.type).toBe(InteractionResponseType.ChannelMessageWithSource);
      expect(responseData.data.content).toContain('Successfully registered 2 tracker URL(s)');
      expect(responseData.data.content).toContain(`STEAM: ${knownSteamId}`);
      expect(responseData.data.content).toContain(`EPIC: ${knownEpicUser}`);
      expect(responseData.data.flags).toBe(64); // Ephemeral flag
    });

    it('should process /register command with invalid tracker URLs', async () => {
      // Use deterministic invalid URLs for predictable testing
      const interaction = createMockCommandInteraction('register', [
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
      ]);

      const response = handleRegisterCommand(interaction, mockEnv);
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
      const interaction = createMockCommandInteraction('register', [
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
      ]);

      const response = handleRegisterCommand(interaction, mockEnv);
      expect(response.status).toBe(200);

      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;
      expect(responseData.type).toBe(InteractionResponseType.ChannelMessageWithSource);
      expect(responseData.data.content).toContain('Successfully registered 2 tracker URL(s)');
      expect(responseData.data.content).toContain(`PSN: ${knownPsnUser}`);
      expect(responseData.data.content).toContain(`XBL: ${knownXblUser}`);
      expect(responseData.data.content).toContain('Some URLs were invalid:');
      expect(responseData.data.flags).toBe(64); // Ephemeral flag
    });

    it('should handle /register command with no tracker URLs provided', async () => {
      const interaction = createMockCommandInteraction('register', []);

      const response = handleRegisterCommand(interaction, mockEnv);
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
        ]
      );
      const interaction = interactionWithoutMember as DiscordInteraction;

      const response = handleRegisterCommand(interaction, mockEnv);
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
      const interaction = createMockCommandInteraction('register', [
        {
          name: 'tracker1',
          type: 3,
          value: `https://rocketleague.tracker.network/rocket-league/profile/steam/${knownSteamId}/overview`,
        },
      ]);

      const response = handleRegisterCommand(interaction, mockEnv);
      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;

      expect(responseData.data.content).toContain(`STEAM: ${knownSteamId}`);
    });

    it('should validate Epic platform URLs correctly', async () => {
      // Use deterministic known Epic user for predictable testing
      const knownEpicUser = 'test-epic-user';
      const interaction = createMockCommandInteraction('register', [
        {
          name: 'tracker1',
          type: 3,
          value: `https://rocketleague.tracker.network/rocket-league/profile/epic/${knownEpicUser}/overview`,
        },
      ]);

      const response = handleRegisterCommand(interaction, mockEnv);
      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;

      expect(responseData.data.content).toContain(`EPIC: ${knownEpicUser}`);
    });

    it('should validate PSN platform URLs correctly', async () => {
      // Use deterministic known PSN user for predictable testing
      const knownPsnUser = 'testpsnuser';
      const interaction = createMockCommandInteraction('register', [
        {
          name: 'tracker1',
          type: 3,
          value: `https://rocketleague.tracker.network/rocket-league/profile/psn/${knownPsnUser}/overview`,
        },
      ]);

      const response = handleRegisterCommand(interaction, mockEnv);
      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;

      expect(responseData.data.content).toContain(`PSN: ${knownPsnUser}`);
    });

    it('should validate Xbox platform URLs correctly', async () => {
      // Use deterministic known Xbox user for predictable testing
      const knownXblUser = 'TestGamer';
      const interaction = createMockCommandInteraction('register', [
        {
          name: 'tracker1',
          type: 3,
          value: `https://rocketleague.tracker.network/rocket-league/profile/xbl/${knownXblUser}/overview`,
        },
      ]);

      const response = handleRegisterCommand(interaction, mockEnv);
      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;

      expect(responseData.data.content).toContain(`XBL: ${knownXblUser}`);
    });

    it('should validate Switch platform URLs correctly', async () => {
      // Use deterministic known Switch user for predictable testing
      const knownSwitchUser = 'test-switch-user';
      const interaction = createMockCommandInteraction('register', [
        {
          name: 'tracker1',
          type: 3,
          value: `https://rocketleague.tracker.network/rocket-league/profile/switch/${knownSwitchUser}/overview`,
        },
      ]);

      const response = handleRegisterCommand(interaction, mockEnv);
      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;

      expect(responseData.data.content).toContain(`SWITCH: ${knownSwitchUser}`);
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
      });

      const response = handleRegisterCommand(invalidInteraction, mockEnv);
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
      const interaction = createMockCommandInteraction('register', [
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
      ]);

      const response = handleRegisterCommand(interaction, mockEnv);
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
    it('should process commands efficiently', () => {
      // Use deterministic known tracker URL for predictable testing
      const knownSteamId = '76561198123456789';
      const interaction = createMockCommandInteraction('register', [
        {
          name: 'tracker1',
          type: 3,
          value: `https://rocketleague.tracker.network/rocket-league/profile/steam/${knownSteamId}/overview`,
        },
      ]);

      const startTime = performance.now();
      const response = handleRegisterCommand(interaction, mockEnv);
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
      const interaction = createMockCommandInteraction('register', [
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
      ]);

      const startTime = performance.now();
      const response = handleRegisterCommand(interaction, mockEnv);
      const endTime = performance.now();

      const processingTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(processingTime).toBeLessThan(150); // Should handle multiple URLs efficiently

      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;
      expect(responseData.data.content).toContain('Successfully registered 4 tracker URL(s)');
    });
  });
});
