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
          Authorization: `Bot ${mockEnv.DISCORD_TOKEN}`,
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
});
