import { describe, it, expect } from 'vitest';
import { handleRegisterCommand } from '../application_commands/register/handler';
import {
  createMockCommandInteraction,
  createValidTrackerUrl,
  createInvalidTrackerUrl,
} from './helpers/discord-helpers';
import { EnvFactory, ExecutionContextFactory, getRequestChannelId } from './helpers/test-factories';
import type { Env } from '../index';

// Type guard for Discord response data
function isDiscordResponse(
  data: unknown
): data is { type: number; data: { content: string; flags?: number } } {
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

  return typeof dataObj['content'] === 'string';
}

// Mock environment using factory
const mockEnv: Env = EnvFactory.create();

describe('Register command handler', () => {
  it('should validate tracker URLs correctly', async () => {
    // Use a specific known Steam ID for deterministic testing
    const knownSteamId = '76561198144145654';
    const knownTrackerUrl = `https://rocketleague.tracker.network/rocket-league/profile/steam/${knownSteamId}/overview`;

    const validInteraction = createMockCommandInteraction(
      'register',
      [
        {
          name: 'tracker1',
          type: 3,
          value: knownTrackerUrl,
        },
      ],
      {
        channel_id: getRequestChannelId(mockEnv),
      }
    );

    const mockCtx = ExecutionContextFactory.create();
    const response = await handleRegisterCommand(validInteraction, mockEnv, mockCtx);
    const rawData = await response.json();

    if (!isDiscordResponse(rawData)) {
      throw new Error('Invalid response format');
    }
    const data = rawData;

    expect(response.status).toBe(200);
    expect(data.type).toBe(4); // CHANNEL_MESSAGE_WITH_SOURCE
    expect(data.data.content).toContain('✅ Registration received!');
  });

  it('should reject invalid tracker URLs', async () => {
    const invalidInteraction = createMockCommandInteraction(
      'register',
      [
        {
          name: 'tracker1',
          type: 3,
          value: createInvalidTrackerUrl(),
        },
      ],
      {
        channel_id: getRequestChannelId(mockEnv),
      }
    );

    const mockCtx = ExecutionContextFactory.create();
    const response = await handleRegisterCommand(invalidInteraction, mockEnv, mockCtx);
    const rawData = await response.json();

    if (!isDiscordResponse(rawData)) {
      throw new Error('Invalid response format');
    }
    const data = rawData;

    expect(response.status).toBe(200);
    expect(data.type).toBe(4); // CHANNEL_MESSAGE_WITH_SOURCE
    expect(data.data.content).toContain('Invalid tracker URLs');
    expect(data.data.flags).toBe(64); // Ephemeral
  });

  it('should handle missing user ID', async () => {
    // Create interaction without member info
    const { member: _member, ...noUserInteraction } = createMockCommandInteraction(
      'register',
      [
        {
          name: 'tracker1',
          type: 3,
          value: createValidTrackerUrl('steam'),
        },
      ],
      {
        channel_id: getRequestChannelId(mockEnv),
      }
    );

    const mockCtx = ExecutionContextFactory.create();
    const response = await handleRegisterCommand(noUserInteraction, mockEnv, mockCtx);
    const rawData = await response.json();

    if (!isDiscordResponse(rawData)) {
      throw new Error('Invalid response format');
    }
    const data = rawData;

    expect(data.data.content).toContain('❌ Could not identify user');
    expect(data.data.flags).toBe(64); // Ephemeral
  });

  it('should handle missing tracker URLs', async () => {
    const noOptionsInteraction = createMockCommandInteraction('register', [], {
      channel_id: getRequestChannelId(mockEnv),
    });

    const mockCtx = ExecutionContextFactory.create();
    const response = await handleRegisterCommand(noOptionsInteraction, mockEnv, mockCtx);
    const rawData = await response.json();

    if (!isDiscordResponse(rawData)) {
      throw new Error('Invalid response format');
    }
    const data = rawData;

    expect(data.data.content).toContain('❌ Please provide at least one tracker URL');
    expect(data.data.flags).toBe(64); // Ephemeral
  });
});
