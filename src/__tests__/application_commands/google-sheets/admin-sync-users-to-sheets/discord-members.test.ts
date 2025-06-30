/**
 * Tests for Discord guild member fetching and data transformation
 * Ensures proper API handling, rate limiting, and data formatting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from '../../../../index';
import {
  fetchGuildMembers,
  transformMemberData,
  filterNewMembers,
  type DiscordMember,
  type MemberData,
  type GuildMemberResponse,
} from '../../../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members';
import { MemberDataFactory } from '../../../helpers/test-factories';

// Mock Discord API response for guild members
const mockGuildMembersResponse: GuildMemberResponse = {
  ok: true,
  status: 200,
  json: () =>
    Promise.resolve([
      {
        user: {
          id: '123456789012345678',
          username: 'testuser1',
          discriminator: '0001',
          global_name: 'Test User One',
          avatar: 'avatar1.jpg',
          bot: false,
        },
        nick: 'TestNick1',
        roles: ['8', '123456789012345679'], // Admin role + custom role
        joined_at: '2023-01-01T00:00:00.000Z',
        premium_since: null,
        deaf: false,
        mute: false,
        flags: 0,
        pending: false,
        permissions: '2147483647',
        communication_disabled_until: null,
      },
      {
        user: {
          id: '987654321098765432',
          username: 'testuser2',
          discriminator: '0002',
          global_name: 'Test User Two',
          avatar: 'avatar2.jpg',
          bot: false,
        },
        nick: null,
        roles: ['123456789012345680'], // Regular role
        joined_at: '2023-02-01T00:00:00.000Z',
        premium_since: '2023-03-01T00:00:00.000Z',
        deaf: false,
        mute: false,
        flags: 0,
        pending: false,
        permissions: '104324673',
        communication_disabled_until: null,
      },
      {
        user: {
          id: '111222333444555666',
          username: 'botuser',
          discriminator: '0000',
          global_name: null,
          avatar: null,
          bot: true, // Bot user - should be filtered out
        },
        nick: 'BotNick',
        roles: ['123456789012345681'],
        joined_at: '2023-03-01T00:00:00.000Z',
        premium_since: null,
        deaf: false,
        mute: false,
        flags: 0,
        pending: false,
        permissions: '0',
        communication_disabled_until: null,
      },
    ]),
};

describe('Discord Guild Member Operations', () => {
  const mockEnv: Env = {
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

  const mockGuildId = 'test-guild-123456789012345678';

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('fetchGuildMembers', () => {
    it('should fetch guild members from Discord API', async () => {
      // Arrange
      vi.mocked(global.fetch).mockResolvedValue(mockGuildMembersResponse as Response);

      // Act
      const result = await fetchGuildMembers(mockGuildId, mockEnv);

      // Assert
      expect(result.success).toBe(true);
      expect(result.members).toHaveLength(3);
      expect(result.members?.[0]).toEqual({
        user: {
          id: '123456789012345678',
          username: 'testuser1',
          discriminator: '0001',
          global_name: 'Test User One',
          avatar: 'avatar1.jpg',
          bot: false,
        },
        nick: 'TestNick1',
        roles: ['8', '123456789012345679'],
        joined_at: '2023-01-01T00:00:00.000Z',
        premium_since: null,
        deaf: false,
        mute: false,
        flags: 0,
        pending: false,
        permissions: '2147483647',
        communication_disabled_until: null,
      });
    });

    it('should handle Discord API errors gracefully', async () => {
      // Arrange
      const errorResponse = {
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ message: 'Missing Permissions', code: 50013 }),
      };
      vi.mocked(global.fetch).mockResolvedValue(errorResponse as Response);

      // Act
      const result = await fetchGuildMembers(mockGuildId, mockEnv);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Discord API error (403): Missing Permissions');
      expect(result.members).toBeUndefined();
    });

    it('should handle network errors gracefully', async () => {
      // Arrange
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

      // Act
      const result = await fetchGuildMembers(mockGuildId, mockEnv);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch guild members: Network error');
      expect(result.members).toBeUndefined();
    });

    it('should include proper authorization header', async () => {
      // Arrange
      vi.mocked(global.fetch).mockResolvedValue(mockGuildMembersResponse as Response);

      // Act
      await fetchGuildMembers(mockGuildId, mockEnv);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        `https://discord.com/api/v10/guilds/${mockGuildId}/members?limit=1000`,
        {
          method: 'GET',
          headers: {
            Authorization: 'Bot test-token-123',
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('should handle rate limiting with proper error message', async () => {
      // Arrange
      const rateLimitResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () =>
          Promise.resolve({
            message: 'You are being rate limited.',
            retry_after: 5.0,
            global: false,
          }),
      };
      vi.mocked(global.fetch).mockResolvedValue(rateLimitResponse as Response);

      // Act
      const result = await fetchGuildMembers(mockGuildId, mockEnv);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Discord API error (429): You are being rate limited.');
    });
  });

  describe('transformMemberData', () => {
    const mockMembers: DiscordMember[] = [
      {
        user: {
          id: '123456789012345678',
          username: 'testuser1',
          discriminator: '0001',
          global_name: 'Test User One',
          avatar: 'avatar1.jpg',
          bot: false,
        },
        nick: 'TestNick1',
        roles: ['8', '123456789012345679'],
        joined_at: '2023-01-01T00:00:00.000Z',
        premium_since: null,
        deaf: false,
        mute: false,
        flags: 0,
        pending: false,
        permissions: '2147483647',
        communication_disabled_until: null,
      },
      {
        user: {
          id: '987654321098765432',
          username: 'testuser2',
          discriminator: '0002',
          global_name: 'Test User Two',
          avatar: 'avatar2.jpg',
          bot: false,
        },
        nick: null,
        roles: ['123456789012345680'],
        joined_at: '2023-02-01T00:00:00.000Z',
        premium_since: '2023-03-01T00:00:00.000Z',
        deaf: false,
        mute: false,
        flags: 0,
        pending: false,
        permissions: '104324673',
        communication_disabled_until: null,
      },
    ];

    it('should transform Discord members to User sheet data format', () => {
      // Act
      const result = transformMemberData(mockMembers);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        discord_id: '123456789012345678',
        discord_username_display: 'TestNick1', // nickname > global_name > username
        discord_username_actual: 'testuser1', // actual username
        server_join_date: '2023-01-01T00:00:00.000Z',
        is_banned: false,
        is_active: true,
        last_updated: expect.any(String) as string, // ISO timestamp
      });
      expect(result[1]).toEqual({
        discord_id: '987654321098765432',
        discord_username_display: 'Test User Two', // global_name or fallback to username
        discord_username_actual: 'testuser2', // actual username
        server_join_date: '2023-02-01T00:00:00.000Z',
        is_banned: false,
        is_active: true,
        last_updated: expect.any(String) as string, // ISO timestamp
      });
    });

    it('should handle members with minimal data', () => {
      // Arrange
      const minimalMember: DiscordMember = {
        user: {
          id: '555666777888999000',
          username: 'minimaluser',
          discriminator: '0000',
          global_name: null,
          avatar: null,
          bot: false,
        },
        nick: null,
        roles: [],
        joined_at: '2023-04-01T00:00:00.000Z',
        premium_since: null,
        deaf: false,
        mute: false,
        flags: 0,
        pending: false,
        permissions: '0',
        communication_disabled_until: null,
      };

      // Act
      const result = transformMemberData([minimalMember]);

      // Assert
      expect(result[0]).toEqual({
        discord_id: '555666777888999000',
        discord_username_display: 'minimaluser', // Falls back to username when global_name is null
        discord_username_actual: 'minimaluser',
        server_join_date: '2023-04-01T00:00:00.000Z',
        is_banned: false,
        is_active: true,
        last_updated: expect.any(String) as string, // ISO timestamp
      });
    });

    it('should filter out bot users', () => {
      // Arrange
      const membersWithBot: DiscordMember[] = [
        mockMembers[0] as DiscordMember, // Regular user
        {
          ...(mockMembers[1] as DiscordMember),
          user: { ...(mockMembers[1] as DiscordMember).user, bot: true }, // Bot user
        },
      ];

      // Act
      const result = transformMemberData(membersWithBot);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]?.discord_id).toBe('123456789012345678');
    });

    it('should handle different nickname scenarios correctly', () => {
      // Arrange - Test priority: nickname > global_name > username
      const memberWithNick: DiscordMember = {
        ...(mockMembers[0] as DiscordMember),
        nick: 'CustomNickname',
      };
      const memberWithoutNick: DiscordMember = {
        ...(mockMembers[1] as DiscordMember),
        nick: null, // Should use global_name
      };

      // Act
      const result = transformMemberData([memberWithNick, memberWithoutNick]);

      // Assert
      expect(result[0]?.discord_username_display).toBe('CustomNickname');
      expect(result[1]?.discord_username_display).toBe('Test User Two'); // global_name
    });
  });

  describe('filterNewMembers', () => {
    const mockMemberData: MemberData[] = [
      MemberDataFactory.create({
        discord_id: '123456789012345678',
        discord_username_display: 'TestNick1',
        discord_username_actual: 'testuser1',
        server_join_date: '2023-01-01T00:00:00.000Z',
      }),
      MemberDataFactory.create({
        discord_id: '987654321098765432',
        discord_username_display: 'Test User Two',
        discord_username_actual: 'testuser2',
        server_join_date: '2023-02-01T00:00:00.000Z',
      }),
      MemberDataFactory.create({
        discord_id: '555666777888999000',
        discord_username_display: 'New User',
        discord_username_actual: 'newuser',
        server_join_date: '2023-03-01T00:00:00.000Z',
      }),
    ];

    it('should filter out existing members', () => {
      // Arrange
      const existingIds = new Set(['123456789012345678', '987654321098765432']);

      // Act
      const result = filterNewMembers(mockMemberData, existingIds);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]?.discord_id).toBe('555666777888999000');
      expect(result[0]?.discord_username_actual).toBe('newuser');
    });

    it('should return all members when no existing IDs', () => {
      // Arrange
      const existingIds = new Set<string>();

      // Act
      const result = filterNewMembers(mockMemberData, existingIds);

      // Assert
      expect(result).toHaveLength(3);
      expect(result).toEqual(mockMemberData);
    });

    it('should return empty array when all members exist', () => {
      // Arrange
      const existingIds = new Set([
        '123456789012345678',
        '987654321098765432',
        '555666777888999000',
      ]);

      // Act
      const result = filterNewMembers(mockMemberData, existingIds);

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should handle empty member data gracefully', () => {
      // Arrange
      const existingIds = new Set(['123456789012345678']);

      // Act
      const result = filterNewMembers([], existingIds);

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('data validation and edge cases', () => {
    it('should handle malformed Discord API response', async () => {
      // Arrange
      const malformedResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve('invalid-json-structure'),
      };
      vi.mocked(global.fetch).mockResolvedValue(malformedResponse as Response);

      // Act
      const result = await fetchGuildMembers(mockGuildId, mockEnv);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid response format');
    });

    it('should handle missing required fields in member data', () => {
      // Arrange
      const incompleteMember = {
        user: {
          id: '123456789012345678',
          username: 'testuser',
          // Missing discriminator and other fields
        },
        // Missing other required fields
      } as unknown as DiscordMember;

      // Act & Assert
      expect(() => transformMemberData([incompleteMember])).not.toThrow();
    });

    it('should validate Discord ID format in member data', () => {
      // Arrange
      const invalidIdMember: DiscordMember = {
        user: {
          id: 'invalid-id', // Invalid Discord ID format
          username: 'testuser',
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
      };

      // Act
      const result = transformMemberData([invalidIdMember]);

      // Assert
      expect(result).toHaveLength(0); // Should filter out invalid IDs
    });
  });
});
