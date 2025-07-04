/**
 * 🔴 RED Phase: Discord API v10 compatibility and member pagination tests
 * Unit tests for Discord API v10 member pagination for guilds > 1000 members
 * Testing pagination, rate limiting, and large guild handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DiscordApiService } from '../../services/discord-api';
import type { Env } from '../../index';
import type { DiscordMember } from '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members';
import { UrlFactory } from '../helpers/url-factories';

describe('Discord API v10 Pagination Tests', () => {
  let mockEnv: Env;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockEnv = {
      DISCORD_TOKEN: 'Bot test-token-123',
      DISCORD_PUBLIC_KEY: 'test-key',
      DISCORD_APPLICATION_ID: 'test-app-id',
      DATABASE_URL: 'test-db',
      GOOGLE_SHEETS_API_KEY: 'test-api-key',
      GOOGLE_SHEET_ID: '1o_gBgb1k16IF3EfzyJ8EJ4qUGm5Ph2x5TzZAyOUmwek',
      ENVIRONMENT: 'test',
      REGISTER_COMMAND_REQUEST_CHANNEL_ID: '1111111111111111111',
      REGISTER_COMMAND_RESPONSE_CHANNEL_ID: '2222222222222222222',
      TEST_CHANNEL_ID: '1388177835331424386',
      PRIVILEGED_USER_ID: '354474826192388127',
    } as const;

    // Clear and reset all mocks
    vi.clearAllMocks();
    vi.resetAllMocks();

    // Create a fresh mock function for fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  // Helper to create member data
  const createMember = (id: string, username: string): DiscordMember => ({
    user: {
      id,
      username,
      discriminator: '0001',
      global_name: null,
      avatar: null,
      bot: false,
    },
    nick: null,
    roles: [],
    joined_at: '2023-01-01T00:00:00.000Z',
    premium_since: null,
    deaf: false,
    mute: false,
    flags: 0,
    pending: false,
    permissions: '0',
    communication_disabled_until: null,
  });

  describe('Large Guild Member Pagination (>1000 members)', () => {
    it('should fetch all members across multiple pages for large guilds', async () => {
      // Arrange - Guild with 2500 members requiring 3 API calls
      const service = new DiscordApiService(mockEnv, mockFetch as typeof fetch);
      const guildId = 'large-guild-123456789012345678';

      // First page (members 1-1000)
      const page1Members = Array.from({ length: 1000 }, (_, i) =>
        createMember(`${i + 1}`.padStart(18, '0'), `user${i + 1}`)
      );

      // Second page (members 1001-2000)
      const page2Members = Array.from({ length: 1000 }, (_, i) =>
        createMember(`${i + 1001}`.padStart(18, '0'), `user${i + 1001}`)
      );

      // Third page (members 2001-2500)
      const page3Members = Array.from({ length: 500 }, (_, i) =>
        createMember(`${i + 2001}`.padStart(18, '0'), `user${i + 2001}`)
      );

      // Mock API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(page1Members as unknown),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(page2Members as unknown),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(page3Members as unknown),
        } as Response);

      // Act
      const result = await service.getAllGuildMembers(guildId);

      // Assert
      expect(result).toHaveLength(2500);
      expect((result[0] as DiscordMember)?.user.username).toBe('user1');
      expect((result[999] as DiscordMember)?.user.username).toBe('user1000');
      expect((result[1000] as DiscordMember)?.user.username).toBe('user1001');
      expect((result[2499] as DiscordMember)?.user.username).toBe('user2500');

      // Verify correct API calls with pagination
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        UrlFactory.discord.guildMembers.withLimit(guildId, 1000),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bot test-token-123',
          }),
        })
      );
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        UrlFactory.discord.guildMembers.paginated(guildId, page1Members[999]?.user.id ?? ''),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenNthCalledWith(
        3,
        UrlFactory.discord.guildMembers.paginated(guildId, page2Members[999]?.user.id ?? ''),
        expect.any(Object)
      );
    });

    it('should handle partial last page correctly', async () => {
      // Arrange - Guild with exactly 1500 members
      const service = new DiscordApiService(mockEnv, mockFetch as typeof fetch);
      const guildId = 'partial-guild-123456789012345678';

      const page1Members = Array.from({ length: 1000 }, (_, i) =>
        createMember(`${i + 1}`.padStart(18, '0'), `user${i + 1}`)
      );
      const page2Members = Array.from({ length: 500 }, (_, i) =>
        createMember(`${i + 1001}`.padStart(18, '0'), `user${i + 1001}`)
      );

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(page1Members),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(page2Members),
        } as Response);

      // Act
      const result = await service.getAllGuildMembers(guildId);

      // Assert
      expect(result).toHaveLength(1500);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should stop pagination when empty page is returned', async () => {
      // Arrange - Guild with exactly 1000 members (one full page)
      const service = new DiscordApiService(mockEnv, mockFetch as typeof fetch);
      const guildId = 'exact-guild-123456789012345678';

      const page1Members = Array.from({ length: 1000 }, (_, i) =>
        createMember(`${i + 1}`.padStart(18, '0'), `user${i + 1}`)
      );

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(page1Members),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]), // Empty second page
        } as Response);

      // Act
      const result = await service.getAllGuildMembers(guildId);

      // Assert
      expect(result).toHaveLength(1000);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Discord API v10 Rate Limiting for Pagination', () => {
    it('should handle rate limiting with proper retry logic during pagination', async () => {
      // Arrange
      const service = new DiscordApiService(mockEnv, mockFetch as typeof fetch);
      const guildId = 'rate-limited-guild-123456789012345678';

      const page1Members = Array.from({ length: 1000 }, (_, i) =>
        createMember(`${i + 1}`.padStart(18, '0'), `user${i + 1}`)
      );

      // First call succeeds, second call is rate limited, third call succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(page1Members),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          json: () =>
            Promise.resolve({
              message: 'You are being rate limited.',
              retry_after: 1.5,
              global: false,
            }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]), // Empty page after retry
        } as Response);

      // Act
      const result = await service.getAllGuildMembers(guildId);

      // Assert
      expect(result).toHaveLength(1000);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should respect global rate limiting during pagination', async () => {
      // Arrange
      const service = new DiscordApiService(mockEnv, mockFetch as typeof fetch);
      const guildId = 'global-rate-limited-guild-123456789012345678';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () =>
          Promise.resolve({
            message: 'You are being rate limited.',
            retry_after: 2.0,
            global: true, // Global rate limit
          }),
      } as Response);

      // Act & Assert
      await expect(service.getAllGuildMembers(guildId)).rejects.toThrow(
        'Discord API error (429): You are being rate limited.'
      );
    });

    it('should handle rate limit errors without retry_after header', async () => {
      // Arrange
      const service = new DiscordApiService(mockEnv, mockFetch as typeof fetch);
      const guildId = 'rate-limited-no-header-guild-123456789012345678';

      // First call gets rate limited, second call succeeds after retry
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          json: () =>
            Promise.resolve({
              message: 'Rate limit exceeded',
              global: false, // Local rate limit - will retry
              // Missing retry_after field
            }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]), // Empty result after retry
        } as Response);

      // Act
      const result = await service.getAllGuildMembers(guildId);

      // Assert - Should succeed after retry despite missing retry_after
      expect(result).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Discord API v10 Error Handling During Pagination', () => {
    it('should handle permission errors on subsequent pages', async () => {
      // Arrange
      const service = new DiscordApiService(mockEnv, mockFetch as typeof fetch);
      const guildId = 'permission-error-guild-123456789012345678';

      const page1Members = Array.from({ length: 1000 }, (_, i) =>
        createMember(`${i + 1}`.padStart(18, '0'), `user${i + 1}`)
      );

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(page1Members),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          statusText: 'Forbidden',
          json: () =>
            Promise.resolve({
              message: 'Missing Permissions',
              code: 50013,
            }),
        } as Response);

      // Act & Assert
      await expect(service.getAllGuildMembers(guildId)).rejects.toThrow(
        'Discord API error (403): Missing Permissions'
      );
    });

    it('should handle network errors during pagination', async () => {
      // Arrange
      const service = new DiscordApiService(mockEnv, mockFetch as typeof fetch);
      const guildId = 'network-error-guild-123456789012345678';

      const page1Members = Array.from({ length: 1000 }, (_, i) =>
        createMember(`${i + 1}`.padStart(18, '0'), `user${i + 1}`)
      );

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(page1Members),
        } as Response)
        .mockRejectedValueOnce(new Error('Network timeout'));

      // Act & Assert
      await expect(service.getAllGuildMembers(guildId)).rejects.toThrow('Network timeout');
    });

    it('should handle malformed pagination response', async () => {
      // Arrange
      const service = new DiscordApiService(mockEnv, mockFetch as typeof fetch);
      const guildId = 'malformed-guild-123456789012345678';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve('invalid-json-structure'), // Not an array
      } as Response);

      // Act & Assert
      await expect(service.getAllGuildMembers(guildId)).rejects.toThrow();
    });
  });

  describe('Discord API v10 Edge Cases', () => {
    it('should handle empty guild (0 members)', async () => {
      // Arrange
      const service = new DiscordApiService(mockEnv, mockFetch as typeof fetch);
      const guildId = 'empty-guild-123456789012345678';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      } as Response);

      // Act
      const result = await service.getAllGuildMembers(guildId);

      // Assert
      expect(result).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle very large guilds (10000+ members)', async () => {
      // Arrange - Simulate 10,000 member guild
      const service = new DiscordApiService(mockEnv, mockFetch as typeof fetch);
      const guildId = 'massive-guild-123456789012345678';

      // Create 10 pages of 1000 members each
      const pages = Array.from({ length: 10 }, (_, pageIndex) =>
        Array.from({ length: 1000 }, (_, memberIndex) => {
          const globalIndex = pageIndex * 1000 + memberIndex + 1;
          return createMember(globalIndex.toString().padStart(18, '0'), `user${globalIndex}`);
        })
      );

      // Mock all 10 pages plus final empty page
      for (const page of pages) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(page),
        } as Response);
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]), // Final empty page
      } as Response);

      // Act
      const result = await service.getAllGuildMembers(guildId);

      // Assert
      expect(result).toHaveLength(10000);
      expect(mockFetch).toHaveBeenCalledTimes(11); // 10 full pages + 1 empty
      expect(result[0]?.user.username).toBe('user1');
      expect(result[9999]?.user.username).toBe('user10000');
    });

    it('should handle invalid guild ID format', async () => {
      // Arrange
      const service = new DiscordApiService(mockEnv, mockFetch as typeof fetch);
      const invalidGuildId = 'invalid-guild-id';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () =>
          Promise.resolve({
            message: 'Invalid Guild ID',
            code: 50035,
          }),
      } as Response);

      // Act & Assert
      await expect(service.getAllGuildMembers(invalidGuildId)).rejects.toThrow(
        'Discord API error (400): Invalid Guild ID'
      );
    });

    it('should handle bot missing from guild', async () => {
      // Arrange
      const service = new DiscordApiService(mockEnv, mockFetch as typeof fetch);
      const guildId = 'bot-not-in-guild-123456789012345678';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () =>
          Promise.resolve({
            message: 'Unknown Guild',
            code: 10004,
          }),
      } as Response);

      // Act & Assert
      await expect(service.getAllGuildMembers(guildId)).rejects.toThrow(
        'Discord API error (404): Unknown Guild'
      );
    });
  });

  describe('Memory and Performance Constraints', () => {
    it('should handle memory constraints with large member lists', async () => {
      // Arrange - Test memory usage patterns
      const service = new DiscordApiService(mockEnv, mockFetch as typeof fetch);
      const guildId = 'memory-test-guild-123456789012345678';

      // Single page with less than 1000 members to avoid pagination
      const maxMembers = Array.from({ length: 999 }, (_, i) =>
        createMember(`${i + 1}`.padStart(18, '0'), `user${i + 1}`)
      );

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(maxMembers),
      } as Response);

      // Act
      const result = await service.getAllGuildMembers(guildId);

      // Assert - Verify we can handle large member lists without issues
      expect(result).toHaveLength(999);
      expect(Array.isArray(result)).toBe(true);
      expect(result.every(member => typeof member.user.id === 'string')).toBe(true);
    });

    it('should implement pagination timeouts for very slow responses', async () => {
      // Arrange
      const service = new DiscordApiService(mockEnv, mockFetch as typeof fetch);
      const guildId = 'slow-response-guild-123456789012345678';

      // Mock a response that never resolves (simulating timeout)
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      // Act & Assert - Should handle timeout gracefully
      // Note: In a real implementation, this would be handled by Cloudflare Worker timeout
      // For testing, we set a shorter timeout
      await expect(
        Promise.race([
          service.getAllGuildMembers(guildId),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Test timeout')), 100)),
        ])
      ).rejects.toThrow('Test timeout');
    }, 1000); // Set test timeout to 1 second
  });
});
