/**
 * Tests for Discord application command response routing
 * Following TDD Red-Green-Refactor cycle
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { routeResponseToChannel } from '../../application_commands/register/response-router';
import type { Env } from '../../index';

// Mock fetch for Discord API calls
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('Response Routing', () => {
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

    mockFetch.mockClear();
  });

  describe('routeResponseToChannel', () => {
    it('should send message to configured response channel', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'message-123' }),
      });

      const message = 'Test response message';
      const result = await routeResponseToChannel(message, mockEnv);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://discord.com/api/v10/channels/1388177835331424386/messages',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bot test-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: message,
          }),
        }
      );
    });

    it('should handle Discord API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: async () => 'Missing permissions',
      });

      const message = 'Test response message';
      const result = await routeResponseToChannel(message, mockEnv);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to send message: 403 Forbidden - Missing permissions');
    });

    it('should handle missing response channel configuration', async () => {
      const envWithoutResponseChannel: Env = {
        ...mockEnv,
      };
      delete (envWithoutResponseChannel as { SERVER_CHANNEL_ID_TEST_COMMAND_RECEIVE?: unknown })
        .SERVER_CHANNEL_ID_TEST_COMMAND_RECEIVE;

      const message = 'Test response message';
      const result = await routeResponseToChannel(message, envWithoutResponseChannel);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Response channel not configured.');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const message = 'Test response message';
      const result = await routeResponseToChannel(message, mockEnv);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error occurred while sending message.');
    });
  });
});