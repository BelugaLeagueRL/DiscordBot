/**
 * End-to-End tests for complete Discord command workflows
 * Using integration testing approach with direct handler testing
 * Tests complete request/response cycles through the Worker runtime
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InteractionResponseType } from '../../utils/discord';
import { handleRegisterCommand } from '../../handlers/register';
import { createMockCommandInteraction, createTrackerOptions, createValidTrackerUrl } from '../helpers/discord-helpers';
import type { Env } from '../../index';
import type { DiscordInteraction } from '../../types/discord';

// Type guard for Discord response data
function isDiscordResponse(data: unknown): data is { type: number; data: { content: string; flags: number } } {
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
  
  return (
    typeof dataObj['content'] === 'string' &&
    typeof dataObj['flags'] === 'number'
  );
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
      const interaction = createMockCommandInteraction('register', createTrackerOptions(2));

      const response = handleRegisterCommand(interaction, mockEnv);
      expect(response.status).toBe(200);

      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;
      expect(responseData.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(responseData.data.content).toContain('Successfully registered 2 tracker URL(s)');
      expect(responseData.data.content).toContain('STEAM: 76561198144145654');
      expect(responseData.data.content).toContain('EPIC: test-player');
      expect(responseData.data.flags).toBe(64); // Ephemeral flag
    });

    it('should process /register command with invalid tracker URLs', async () => {
      const interaction = createMockCommandInteraction('register', createTrackerOptions(2, 0)); // 2 total, 0 valid

      const response = handleRegisterCommand(interaction, mockEnv);
      expect(response.status).toBe(200);

      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;
      expect(responseData.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(responseData.data.content).toContain('Invalid tracker URLs:');
      expect(responseData.data.content).toContain('rocketleague.tracker.network');
      expect(responseData.data.flags).toBe(64); // Ephemeral flag
    });

    it('should process /register command with mixed valid/invalid URLs', async () => {
      const interaction = createMockCommandInteraction('register', createTrackerOptions(3, 2)); // 3 total, 2 valid

      const response = handleRegisterCommand(interaction, mockEnv);
      expect(response.status).toBe(200);

      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;
      expect(responseData.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(responseData.data.content).toContain('Successfully registered 2 tracker URL(s)');
      expect(responseData.data.content).toContain('PSN: validuser123');
      expect(responseData.data.content).toContain('XBL: ValidGamer');
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
      expect(responseData.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(responseData.data.content).toContain('Please provide at least one tracker URL');
      expect(responseData.data.flags).toBe(64); // Ephemeral flag
    });

    it('should handle missing user information gracefully', async () => {
      const { member: _member, ...interactionWithoutMember } = createMockCommandInteraction('register', createTrackerOptions(1));
      const interaction = interactionWithoutMember as DiscordInteraction;

      const response = handleRegisterCommand(interaction, mockEnv);
      expect(response.status).toBe(200);

      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;
      expect(responseData.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(responseData.data.content).toContain('Could not identify user');
      expect(responseData.data.flags).toBe(64); // Ephemeral flag
    });
  });

  describe('URL Validation Workflow Integration', () => {
    it('should validate Steam platform URLs correctly', async () => {
      const interaction = createMockCommandInteraction('register', [
        {
          name: 'tracker1',
          type: 3,
          value: createValidTrackerUrl('steam'),
        },
      ]);

      const response = handleRegisterCommand(interaction, mockEnv);
      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;

      expect(responseData.data.content).toContain('STEAM: 76561198144145654');
    });

    it('should validate Epic platform URLs correctly', async () => {
      const interaction = createMockCommandInteraction('register', [
        {
          name: 'tracker1',
          type: 3,
          value: createValidTrackerUrl('epic'),
        },
      ]);

      const response = handleRegisterCommand(interaction, mockEnv);
      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;

      expect(responseData.data.content).toContain('EPIC: test-epic-user');
    });

    it('should validate PSN platform URLs correctly', async () => {
      const interaction = createMockCommandInteraction('register', [
        {
          name: 'tracker1',
          type: 3,
          value: createValidTrackerUrl('psn'),
        },
      ]);

      const response = handleRegisterCommand(interaction, mockEnv);
      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;

      expect(responseData.data.content).toContain('PSN: testpsnuser');
    });

    it('should validate Xbox platform URLs correctly', async () => {
      const interaction = createMockCommandInteraction('register', [
        {
          name: 'tracker1',
          type: 3,
          value: createValidTrackerUrl('xbl'),
        },
      ]);

      const response = handleRegisterCommand(interaction, mockEnv);
      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;

      expect(responseData.data.content).toContain('XBL: TestGamer');
    });

    it('should validate Switch platform URLs correctly', async () => {
      const interaction = createMockCommandInteraction('register', [
        {
          name: 'tracker1',
          type: 3,
          value: createValidTrackerUrl('switch'),
        },
      ]);

      const response = handleRegisterCommand(interaction, mockEnv);
      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;

      expect(responseData.data.content).toContain('SWITCH: test-switch-user');
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
      expect(responseData.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(responseData.data.content).toContain('Please provide at least one tracker URL');
      expect(responseData.data.flags).toBe(64); // Ephemeral flag
    });

    it('should handle all invalid URLs scenario', async () => {
      const interaction = createMockCommandInteraction('register', createTrackerOptions(2, 0));

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
      const interaction = createMockCommandInteraction('register', createTrackerOptions(1));

      const startTime = performance.now();
      const response = handleRegisterCommand(interaction, mockEnv);
      const endTime = performance.now();

      const processingTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(processingTime).toBeLessThan(100); // Should process quickly
    });

    it('should handle multiple tracker URLs efficiently', async () => {
      const interaction = createMockCommandInteraction('register', createTrackerOptions(4));

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
