/**
 * Tests for Discord application command response routing
 * Following TDD Red-Green-Refactor cycle
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { routeResponseToChannel } from '../../application_commands/register';
import { UrlFactory } from '../helpers/url-factories';
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
      REGISTER_COMMAND_REQUEST_CHANNEL_ID: '1388177835331424386',
      REGISTER_COMMAND_RESPONSE_CHANNEL_ID: '1388177835331424386',
    } as const;

    mockFetch.mockClear();
  });

  describe('routeResponseToChannel', () => {
    it('should send message to configured response channel', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => await Promise.resolve({ id: 'message-123' }),
      });

      const message = 'Test response message';
      const result = await routeResponseToChannel(message, mockEnv);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        UrlFactory.discord.channels.specific('1388177835331424386'),
        {
          method: 'POST',
          headers: {
            Authorization: 'Bot test-token',
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
        json: async () => await Promise.resolve({ message: 'Missing permissions' }),
      });

      const message = 'Test response message';
      const result = await routeResponseToChannel(message, mockEnv);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Discord API error (403): Missing permissions');
    });

    it('should handle missing response channel configuration', async () => {
      const envWithoutResponseChannel: Env = {
        ...mockEnv,
        REGISTER_COMMAND_RESPONSE_CHANNEL_ID: undefined as unknown as string,
      };

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
      expect(result.error).toBe('Network error');
    });
  });
});
