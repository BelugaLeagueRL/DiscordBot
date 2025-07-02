/**
 * Tests for Discord API Service
 */

import { describe, it, expect, vi } from 'vitest';
import { DiscordApiService } from '../../services/discord-api';
import { EnvFactory } from '../helpers/test-factories';

describe('Discord API Service', () => {
  it('should make authenticated requests with Bot prefix', async () => {
    // Arrange
    const mockEnv = EnvFactory.create();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 'test' }]),
    });

    // Act
    const service = new DiscordApiService(mockEnv, mockFetch);
    await service.getGuildMembers('123456789012345678');

    // Assert
    expect(mockFetch).toHaveBeenCalledWith(
      'https://discord.com/api/v10/guilds/123456789012345678/members?limit=1000',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: mockEnv.DISCORD_TOKEN,
        }),
      })
    );
  });

  it('should handle API errors correctly', async () => {
    // Arrange
    const mockEnv = EnvFactory.create();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Unauthorized' }),
    });

    // Act & Assert
    const service = new DiscordApiService(mockEnv, mockFetch);
    await expect(service.getGuildMembers('123456789012345678')).rejects.toThrow(
      'Discord API error (401): Unauthorized'
    );
  });

  describe('Edge Cases and Error Scenarios', () => {
    const createServiceWithMockResponse = (response: unknown) => {
      const mockEnv = EnvFactory.create();
      const mockFetch = vi.fn().mockResolvedValue(response);
      return new DiscordApiService(mockEnv, mockFetch);
    };

    const createServiceWithMockError = (error: Error) => {
      const mockEnv = EnvFactory.create();
      const mockFetch = vi.fn().mockRejectedValue(error);
      return new DiscordApiService(mockEnv, mockFetch);
    };

    it('should handle Discord API rate limits (429) with proper error', async () => {
      const service = createServiceWithMockResponse({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ message: 'You are being rate limited.', retry_after: 5 }),
      });

      await expect(service.getGuildMembers('123456789012345678')).rejects.toThrow(
        'Discord API error (429): You are being rate limited.'
      );
    });

    it('should handle network timeouts gracefully', async () => {
      const service = createServiceWithMockError(new Error('Request timeout'));

      await expect(service.getGuildMembers('123456789012345678')).rejects.toThrow(
        'Request timeout'
      );
    });

    it('should handle malformed JSON responses from Discord API', async () => {
      const service = createServiceWithMockResponse({
        ok: true,
        json: () => Promise.reject(new SyntaxError('Unexpected token in JSON')),
      });

      await expect(service.getGuildMembers('123456789012345678')).rejects.toThrow(
        'Unexpected token in JSON'
      );
    });

    it('should handle Discord API server errors (500)', async () => {
      const service = createServiceWithMockResponse({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal Server Error' }),
      });

      await expect(service.getGuildMembers('123456789012345678')).rejects.toThrow(
        'Discord API error (500): Internal Server Error'
      );
    });

    it('should handle missing permissions (403) for guild access', async () => {
      const service = createServiceWithMockResponse({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ message: 'Missing Permissions', code: 50013 }),
      });

      await expect(service.getGuildMembers('123456789012345678')).rejects.toThrow(
        'Discord API error (403): Missing Permissions'
      );
    });

    it('should handle guild not found (404) errors', async () => {
      const service = createServiceWithMockResponse({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Unknown Guild', code: 10004 }),
      });

      await expect(service.getGuildMembers('123456789012345678')).rejects.toThrow(
        'Discord API error (404): Unknown Guild'
      );
    });

    it('should handle empty response bodies gracefully', async () => {
      const service = createServiceWithMockResponse({
        ok: true,
        json: () => Promise.resolve(null),
      });

      const result = await service.getGuildMembers('123456789012345678');
      expect(result).toBeNull();
    });
  });
});
