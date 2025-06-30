/**
 * Integration tests for /register command with channel restrictions and response routing
 * Tests the complete flow from command to response routing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleRegisterCommand } from '../../application_commands/register';
import { createMockCommandInteraction } from '../helpers/discord-helpers';
import {
  EnvFactory,
  ExecutionContextFactory,
  getRequestChannelId,
} from '../helpers/test-factories';
import type { Env } from '../../index';

// Type interface for Discord response body

interface _DiscordResponseBody {
  data: {
    content: string;
  };
}

// Mock fetch for Discord API calls
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Factory for creating register command interactions
function createRegisterInteraction(
  trackerUrl: string,
  channelId?: string
): ReturnType<typeof createMockCommandInteraction> {
  return createMockCommandInteraction(
    'register',
    [{ name: 'tracker1', type: 3, value: trackerUrl }],
    channelId ? { channel_id: channelId } : {}
  );
}

describe('Register Command Integration', () => {
  let mockEnv: Env;

  beforeEach(() => {
    mockEnv = EnvFactory.create();
    mockFetch.mockClear();
  });

  describe('Channel Restriction Integration', () => {
    it('should reject command from wrong channel', async () => {
      const interaction = createMockCommandInteraction(
        'register',
        [
          {
            name: 'tracker1',
            type: 3,
            value:
              'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198123456789/overview',
          },
        ],
        {
          channel_id: '9999999999999999999', // Wrong channel
        }
      );

      const mockCtx = ExecutionContextFactory.create();
      const response = await handleRegisterCommand(interaction, mockEnv, mockCtx);

      expect(response.status).toBe(200);
      // Should not call Discord API for response routing
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should allow command from correct channel', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => await Promise.resolve({ id: 'message-123' }),
      });

      const interaction = createMockCommandInteraction(
        'register',
        [
          {
            name: 'tracker1',
            type: 3,
            value:
              'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198123456789/overview',
          },
        ],
        {
          channel_id: getRequestChannelId(mockEnv), // Correct channel
        }
      );

      const mockCtx = ExecutionContextFactory.create();
      const response = await handleRegisterCommand(interaction, mockEnv, mockCtx);

      expect(response.status).toBe(200);
      // Should call Discord API for response routing
      expect(mockFetch).toHaveBeenCalledWith(
        `https://discord.com/api/v10/channels/${mockEnv.REGISTER_COMMAND_RESPONSE_CHANNEL_ID ?? 'default'}/messages`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Bot ${mockEnv.DISCORD_TOKEN}`,
            'Content-Type': 'application/json',
          }) as Record<string, string>,
        }) as RequestInit
      );
    });
  });

  describe('Response Routing Integration', () => {
    it('should route success message to response channel', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => await Promise.resolve({ id: 'message-123' }),
      });

      const interaction = createMockCommandInteraction(
        'register',
        [
          {
            name: 'tracker1',
            type: 3,
            value:
              'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198123456789/overview',
          },
        ],
        {
          channel_id: getRequestChannelId(mockEnv),
        }
      );

      const mockCtx = ExecutionContextFactory.create();
      const response = await handleRegisterCommand(interaction, mockEnv, mockCtx);

      expect(response.status).toBe(200);

      // Should return immediate acknowledgment

      const responseBody = (await response.json()) as _DiscordResponseBody;
      expect(responseBody.data.content).toContain('✅ Registration received!');
      expect(responseBody.data.content).not.toContain('Check the response channel');

      // Should route detailed message to response channel
      const fetchCall = mockFetch.mock.calls[0] as [string, RequestInit];
      const bodyObj = JSON.parse(fetchCall[1].body as string) as { content: string };
      expect(bodyObj.content).toContain('has registered the following trackers');
      expect(bodyObj.content).toContain(
        'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198123456789/overview'
      );
    });

    it('should handle invalid URLs without routing', async () => {
      const interaction = createMockCommandInteraction(
        'register',
        [{ name: 'tracker1', type: 3, value: 'https://invalid-url.com' }],
        {
          channel_id: getRequestChannelId(mockEnv),
        }
      );

      const mockCtx = ExecutionContextFactory.create();
      const response = await handleRegisterCommand(interaction, mockEnv, mockCtx);

      expect(response.status).toBe(200);
      // Should not call Discord API for invalid URLs
      expect(mockFetch).not.toHaveBeenCalled();

      // Should return error response immediately

      const responseBody = (await response.json()) as _DiscordResponseBody;
      expect(responseBody.data.content).toContain('Invalid tracker URLs');
    });
  });

  describe('Environment Configuration', () => {
    it('should handle missing channel configuration', async () => {
      const envWithoutChannels: Env = {
        ...mockEnv,
        REGISTER_COMMAND_REQUEST_CHANNEL_ID: undefined as unknown as string,
      };

      const interaction = createRegisterInteraction(
        'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198123456789/overview'
      );

      const mockCtx = ExecutionContextFactory.create();
      const response = await handleRegisterCommand(interaction, envWithoutChannels, mockCtx);

      expect(response.status).toBe(200);

      const responseBody = (await response.json()) as _DiscordResponseBody;
      expect(responseBody.data.content).toContain('Channel restriction not configured');
    });
  });
});
