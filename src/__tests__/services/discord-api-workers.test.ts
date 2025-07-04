/**
 * Workers Environment Tests for Discord API Service
 * Tests specifically designed to catch Cloudflare Workers context binding issues
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DiscordApiService } from '../../services/discord-api';
import { EnvFactory } from '../helpers/test-factories';
import { UrlFactory } from '../helpers/url-factories';
import type { Env } from '../../index';

describe('Discord API Service - Workers Environment', () => {
  let mockEnv: Env;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv = EnvFactory.create();
  });

  describe('fetch context binding issues', () => {
    it('should catch illegal invocation errors when fetch loses this context', async () => {
      // Arrange - Create a fetch function that mimics Workers context loss
      const contextLossFetch = vi.fn().mockImplementation(() => {
        throw new Error(
          `Illegal invocation: function called with incorrect \`this\` reference. See ${UrlFactory.cloudflare.docs.illegalInvocation()} for details.`
        );
      });

      // Act & Assert - This should fail with the exact error we're seeing
      const service = new DiscordApiService(mockEnv, contextLossFetch);

      await expect(service.getGuildMembers('123456789012345678')).rejects.toThrow(
        'Illegal invocation: function called with incorrect `this` reference'
      );
    });

    it('should work with properly bound fetch function', async () => {
      // Arrange - Create a fetch function that maintains proper context
      const boundFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ id: 'member1', user: { id: 'user1' } }]),
      });

      // Act
      const service = new DiscordApiService(mockEnv, boundFetch);
      const result: unknown[] = await service.getGuildMembers('123456789012345678');

      // Assert
      expect(result).toEqual([{ id: 'member1', user: { id: 'user1' } }]);
      expect(boundFetch).toHaveBeenCalledWith(
        UrlFactory.discord.guildMembers.withLimit('123456789012345678', 1000),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: mockEnv.DISCORD_TOKEN,
          }),
        })
      );
    });

    it('should handle globalThis.fetch vs fetch differences', async () => {
      // Arrange - Test the difference between globalThis.fetch and fetch
      const globalThisFetch = vi.fn(() => {
        throw new Error('Illegal invocation: function called with incorrect `this` reference');
      });

      const directFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      // Act & Assert - globalThis.fetch should fail
      const serviceWithGlobalThis = new DiscordApiService(mockEnv, globalThisFetch);
      await expect(serviceWithGlobalThis.getGuildMembers('123')).rejects.toThrow(
        'Illegal invocation'
      );

      // Direct fetch should work
      const serviceWithDirect = new DiscordApiService(mockEnv, directFetch);
      await expect(serviceWithDirect.getGuildMembers('123')).resolves.toEqual([]);
    });
  });

  describe('Workers environment simulation', () => {
    it('should properly handle Discord API errors with correct error propagation', async () => {
      // Arrange - Simulate Discord API 401 error
      const fetchWith401 = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized' }),
      });

      // Act & Assert
      const service = new DiscordApiService(mockEnv, fetchWith401);
      await expect(service.getGuildMembers('123456789012345678')).rejects.toThrow(
        'Discord API error (401): Unauthorized'
      );
    });

    it('should handle rate limiting scenarios', async () => {
      // Arrange - Simulate Discord API rate limit
      const fetchWithRateLimit = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: () =>
          Promise.resolve({
            message: 'Too Many Requests',
            retry_after: 1.5,
          }),
      });

      // Act & Assert
      const service = new DiscordApiService(mockEnv, fetchWithRateLimit);
      await expect(service.getGuildMembers('123456789012345678')).rejects.toThrow(
        'Discord API error (429): Too Many Requests'
      );
    });

    it('should validate authentication header format in Workers environment', async () => {
      // Arrange
      const headerCapturingFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      // Act
      const service = new DiscordApiService(mockEnv, headerCapturingFetch);
      await service.getGuildMembers('123456789012345678');

      // Assert - Verify the exact header format that Works with Discord API
      expect(headerCapturingFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            Authorization: mockEnv.DISCORD_TOKEN,
            'Content-Type': 'application/json',
          },
        })
      );
    });
  });

  describe('Real Workers runtime behavior simulation', () => {
    it('should handle fetch binding correctly in Workers context', async () => {
      // This test simulates the actual Workers environment where fetch
      // needs to be properly bound to maintain context

      // Arrange - Create fetch that behaves like Workers fetch
      const workersFetch = vi.fn().mockImplementation((_url: string, options: RequestInit) => {
        // Simulate Workers fetch validation
        if (!options.headers || typeof options.headers !== 'object') {
          throw new Error('Invalid headers in Workers environment');
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 'test-member' }]),
        });
      });

      // Act
      const service = new DiscordApiService(mockEnv, workersFetch);
      const result = await service.getGuildMembers('123456789012345678');

      // Assert
      expect(result).toEqual([{ id: 'test-member' }]);
      expect(workersFetch).toHaveBeenCalledTimes(1);
    });
  });
});
