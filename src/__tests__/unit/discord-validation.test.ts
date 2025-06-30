/**
 * Unit tests for Discord validation functions
 * Testing granular validation logic following TDD Red-Green-Refactor
 */

import { describe, it, expect } from 'vitest';

describe('Discord Validation Functions - Unit Tests', () => {
  describe('isValidDiscordId', () => {
    it('should validate Discord IDs with 17-19 digits', async () => {
      // Arrange - Valid Discord ID formats (17-19 digits)
      const validIds = [
        '123456789012345678', // 18 digits (most common)
        '12345678901234567', // 17 digits (minimum)
        '1234567890123456789', // 19 digits (maximum)
      ];

      const { isValidDiscordId } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      validIds.forEach(id => {
        // Act & Assert
        expect(isValidDiscordId(id)).toBe(true);
      });
    });

    it('should reject Discord IDs with invalid formats', async () => {
      // Current implementation already handles these correctly with regex /^\d{17,19}$/

      // Arrange - Invalid Discord ID formats
      const invalidIds = [
        '12345678901234567a', // Contains letter
        '123456789012345 78', // Contains space
        '123456789012345-78', // Contains hyphen
        'abc123def456ghi789', // Mixed letters and numbers
        '12345678901234567.8', // Contains decimal point
        '123456789012345678!', // Contains special character
      ];

      const { isValidDiscordId } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      invalidIds.forEach(id => {
        // Act & Assert
        expect(isValidDiscordId(id)).toBe(false);
      });
    });

    it('should reject Discord IDs with invalid lengths', async () => {
      // Testing the length boundaries of the 17-19 digit requirement

      // Arrange - Invalid lengths
      const invalidLengthIds = [
        '1234567890123456', // 16 digits (too short)
        '12345678901234567890', // 20 digits (too long)
        '123456789012345', // 15 digits (too short)
        '123456789012345678901', // 21 digits (too long)
        '', // Empty string
        '1', // Single digit
      ];

      const { isValidDiscordId } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      invalidLengthIds.forEach(id => {
        // Act & Assert
        expect(isValidDiscordId(id)).toBe(false);
      });
    });
  });

  describe('isValidUser', () => {
    it('should validate users with required fields', async () => {
      // RED: This will fail because isValidUser is not exported yet

      // Arrange - Valid user objects
      const validUsers = [
        {
          id: '123456789012345678',
          username: 'testuser',
          discriminator: '0001',
          global_name: 'Test User',
          avatar: 'avatar.jpg',
          bot: false,
        },
        {
          id: '987654321098765432',
          username: 'anotheruser',
          discriminator: '0002',
          global_name: null,
          avatar: null,
          bot: false,
        },
      ];

      const { isValidUser } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      validUsers.forEach(user => {
        // Act & Assert
        expect(isValidUser(user)).toBe(true);
      });
    });

    it('should exclude bot users', async () => {
      // Arrange - Bot user
      const botUser = {
        id: '123456789012345678',
        username: 'botuser',
        discriminator: '0000',
        global_name: 'Bot User',
        avatar: null,
        bot: true, // This should make it invalid
      };

      const { isValidUser } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act & Assert
      expect(isValidUser(botUser)).toBe(false);
    });

    it('should reject users with missing required fields', async () => {
      // Arrange - Invalid user objects
      const invalidUsers = [
        {
          id: '', // Empty ID
          username: 'testuser',
          discriminator: '0001',
          global_name: 'Test User',
          avatar: null,
          bot: false,
        },
        {
          id: '123456789012345678',
          username: '', // Empty username
          discriminator: '0001',
          global_name: 'Test User',
          avatar: null,
          bot: false,
        },
        {
          id: 'invalid-id', // Invalid Discord ID format
          username: 'testuser',
          discriminator: '0001',
          global_name: 'Test User',
          avatar: null,
          bot: false,
        },
      ];

      const { isValidUser } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      invalidUsers.forEach(user => {
        // Act & Assert
        expect(isValidUser(user)).toBe(false);
      });
    });

    it('should handle malformed user data gracefully', async () => {
      // Arrange - Malformed user objects
      const malformedUsers = [
        {
          id: 12345 as any, // Number instead of string
          username: 'testuser',
          discriminator: '0001',
          global_name: 'Test User',
          avatar: null,
          bot: false,
        },
        {
          id: '123456789012345678',
          username: null, // Null username
          discriminator: '0001',
          global_name: 'Test User',
          avatar: null,
          bot: false,
        },
        {
          id: '123456789012345678',
          username: 'testuser',
          discriminator: '0001',
          global_name: 'Test User',
          avatar: null,
          bot: 'false', // String instead of boolean
        },
      ];

      const { isValidUser } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      malformedUsers.forEach(user => {
        // Act & Assert
        expect(isValidUser(user as any)).toBe(false);
      });
    });
  });

  describe('isValidMember', () => {
    it('should validate members with required fields and valid users', async () => {
      // RED: This will fail because isValidMember is not exported yet

      // Arrange - Valid member objects
      const validMembers = [
        {
          user: {
            id: '123456789012345678',
            username: 'testuser',
            discriminator: '0001',
            global_name: 'Test User',
            avatar: 'avatar.jpg',
            bot: false,
          },
          nick: 'TestNick',
          roles: ['role1', 'role2'],
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
            username: 'anotheruser',
            discriminator: '0002',
            global_name: null,
            avatar: null,
            bot: false,
          },
          nick: null,
          roles: [], // Empty roles array should still be valid
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

      const { isValidMember } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      validMembers.forEach(member => {
        // Act & Assert
        expect(isValidMember(member)).toBe(true);
      });
    });

    it('should reject members with invalid user objects', async () => {
      // Arrange - Members with invalid users (bots, invalid IDs, etc.)
      const invalidUserMembers = [
        {
          user: {
            id: '123456789012345678',
            username: 'botuser',
            discriminator: '0000',
            global_name: 'Bot User',
            avatar: null,
            bot: true, // Bot user should make member invalid
          },
          nick: null,
          roles: ['role1'],
          joined_at: '2023-01-01T00:00:00.000Z',
          premium_since: null,
          deaf: false,
          mute: false,
          flags: 0,
          pending: false,
          permissions: '0',
          communication_disabled_until: null,
        },
        {
          user: {
            id: 'invalid-id', // Invalid Discord ID
            username: 'testuser',
            discriminator: '0001',
            global_name: 'Test User',
            avatar: null,
            bot: false,
          },
          nick: null,
          roles: ['role1'],
          joined_at: '2023-01-01T00:00:00.000Z',
          premium_since: null,
          deaf: false,
          mute: false,
          flags: 0,
          pending: false,
          permissions: '0',
          communication_disabled_until: null,
        },
      ];

      const { isValidMember } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      invalidUserMembers.forEach(member => {
        // Act & Assert
        expect(isValidMember(member)).toBe(false);
      });
    });

    it('should reject members with malformed required fields', async () => {
      // Arrange - Members with invalid roles or joined_at fields
      const malformedMembers = [
        {
          user: {
            id: '123456789012345678',
            username: 'testuser',
            discriminator: '0001',
            global_name: 'Test User',
            avatar: null,
            bot: false,
          },
          nick: null,
          roles: 'not-an-array' as any, // Should be array
          joined_at: '2023-01-01T00:00:00.000Z',
          premium_since: null,
          deaf: false,
          mute: false,
          flags: 0,
          pending: false,
          permissions: '0',
          communication_disabled_until: null,
        },
        {
          user: {
            id: '987654321098765432',
            username: 'anotheruser',
            discriminator: '0002',
            global_name: null,
            avatar: null,
            bot: false,
          },
          nick: null,
          roles: ['role1'],
          joined_at: null as any, // Should be string
          premium_since: null,
          deaf: false,
          mute: false,
          flags: 0,
          pending: false,
          permissions: '0',
          communication_disabled_until: null,
        },
        {
          user: {
            id: '555666777888999000',
            username: 'thirduser',
            discriminator: '0003',
            global_name: 'Third User',
            avatar: null,
            bot: false,
          },
          nick: null,
          roles: ['role1'],
          joined_at: 123456789 as any, // Should be string, not number
          premium_since: null,
          deaf: false,
          mute: false,
          flags: 0,
          pending: false,
          permissions: '0',
          communication_disabled_until: null,
        },
      ];

      const { isValidMember } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      malformedMembers.forEach(member => {
        // Act & Assert
        expect(isValidMember(member)).toBe(false);
      });
    });
  });

  describe('transformMemberData', () => {
    it('should transform valid members with nickname priority logic', async () => {
      // Testing the core transformation logic with nickname > global_name > username priority

      // Arrange - Valid members with different name scenarios
      const validMembers = [
        {
          user: {
            id: '123456789012345678',
            username: 'username1',
            discriminator: '0001',
            global_name: 'GlobalName1',
            avatar: 'avatar1.jpg',
            bot: false,
          },
          nick: 'Nickname1', // Should use this (highest priority)
          roles: ['role1', 'role2'],
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
            username: 'username2',
            discriminator: '0002',
            global_name: 'GlobalName2',
            avatar: null,
            bot: false,
          },
          nick: null, // Should use global_name (second priority)
          roles: ['role3'],
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
            id: '555666777888999000',
            username: 'username3',
            discriminator: '0003',
            global_name: null,
            avatar: null,
            bot: false,
          },
          nick: null, // Should use username (fallback)
          roles: [],
          joined_at: '2023-03-01T00:00:00.000Z',
          premium_since: null,
          deaf: false,
          mute: false,
          flags: 0,
          pending: false,
          permissions: '0',
          communication_disabled_until: null,
        },
      ];

      const { transformMemberData } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act
      const result = transformMemberData(validMembers);

      // Assert
      expect(result).toHaveLength(3);

      // Test nickname priority
      expect(result[0]).toEqual({
        discord_id: '123456789012345678',
        discord_username_display: 'Nickname1', // nick used
        discord_username_actual: 'username1',
        server_join_date: '2023-01-01T00:00:00.000Z',
        is_banned: false,
        is_active: true,
        last_updated: expect.any(String),
      });

      // Test global_name fallback
      expect(result[1]).toEqual({
        discord_id: '987654321098765432',
        discord_username_display: 'GlobalName2', // global_name used
        discord_username_actual: 'username2',
        server_join_date: '2023-02-01T00:00:00.000Z',
        is_banned: false,
        is_active: true,
        last_updated: expect.any(String),
      });

      // Test username fallback
      expect(result[2]).toEqual({
        discord_id: '555666777888999000',
        discord_username_display: 'username3', // username used
        discord_username_actual: 'username3',
        server_join_date: '2023-03-01T00:00:00.000Z',
        is_banned: false,
        is_active: true,
        last_updated: expect.any(String),
      });
    });

    it('should filter out invalid members during transformation', async () => {
      // Testing that invalid members are automatically filtered out

      // Arrange - Mix of valid and invalid members
      const mixedMembers = [
        {
          user: {
            id: '123456789012345678',
            username: 'validuser',
            discriminator: '0001',
            global_name: 'Valid User',
            avatar: null,
            bot: false, // Valid user
          },
          nick: null,
          roles: ['role1'],
          joined_at: '2023-01-01T00:00:00.000Z',
          premium_since: null,
          deaf: false,
          mute: false,
          flags: 0,
          pending: false,
          permissions: '0',
          communication_disabled_until: null,
        },
        {
          user: {
            id: '987654321098765432',
            username: 'botuser',
            discriminator: '0000',
            global_name: 'Bot User',
            avatar: null,
            bot: true, // Invalid - bot user
          },
          nick: null,
          roles: ['role1'],
          joined_at: '2023-01-01T00:00:00.000Z',
          premium_since: null,
          deaf: false,
          mute: false,
          flags: 0,
          pending: false,
          permissions: '0',
          communication_disabled_until: null,
        },
        {
          user: {
            id: 'invalid-id', // Invalid - bad Discord ID
            username: 'invaliduser',
            discriminator: '0002',
            global_name: 'Invalid User',
            avatar: null,
            bot: false,
          },
          nick: null,
          roles: ['role1'],
          joined_at: '2023-01-01T00:00:00.000Z',
          premium_since: null,
          deaf: false,
          mute: false,
          flags: 0,
          pending: false,
          permissions: '0',
          communication_disabled_until: null,
        },
      ];

      const { transformMemberData } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act
      const result = transformMemberData(mixedMembers);

      // Assert - Only valid member should remain
      expect(result).toHaveLength(1);
      expect(result[0]?.discord_id).toBe('123456789012345678');
      expect(result[0]?.discord_username_actual).toBe('validuser');
    });

    it('should handle empty input arrays gracefully', async () => {
      // Testing edge case of empty input

      const { transformMemberData } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act
      const result = transformMemberData([]);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should generate consistent last_updated timestamps', async () => {
      // Testing that timestamp generation works correctly

      // Arrange
      const validMember = {
        user: {
          id: '123456789012345678',
          username: 'testuser',
          discriminator: '0001',
          global_name: 'Test User',
          avatar: null,
          bot: false,
        },
        nick: null,
        roles: ['role1'],
        joined_at: '2023-01-01T00:00:00.000Z',
        premium_since: null,
        deaf: false,
        mute: false,
        flags: 0,
        pending: false,
        permissions: '0',
        communication_disabled_until: null,
      };

      const { transformMemberData } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act
      const result = transformMemberData([validMember]);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]?.last_updated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/); // ISO format

      // Timestamp should be recent (within last few seconds)
      const timestamp = new Date(result[0]?.last_updated ?? '');
      const now = new Date();
      const diffMs = now.getTime() - timestamp.getTime();
      expect(diffMs).toBeLessThan(5000); // Within 5 seconds
    });
  });

  describe('filterNewMembers', () => {
    it('should filter out members that already exist in Google Sheets', async () => {
      // RED: This will fail because filterNewMembers is exported but test doesn't pass yet

      // Arrange - Member data with some existing IDs
      const memberData = [
        {
          discord_id: '123456789012345678',
          discord_username_display: 'NewUser1',
          discord_username_actual: 'newuser1',
          server_join_date: '2023-01-01T00:00:00.000Z',
          is_banned: false,
          is_active: true,
          last_updated: '2023-01-01T00:00:00.000Z',
        },
        {
          discord_id: '987654321098765432',
          discord_username_display: 'ExistingUser',
          discord_username_actual: 'existinguser',
          server_join_date: '2023-02-01T00:00:00.000Z',
          is_banned: false,
          is_active: true,
          last_updated: '2023-02-01T00:00:00.000Z',
        },
        {
          discord_id: '555666777888999000',
          discord_username_display: 'NewUser2',
          discord_username_actual: 'newuser2',
          server_join_date: '2023-03-01T00:00:00.000Z',
          is_banned: false,
          is_active: true,
          last_updated: '2023-03-01T00:00:00.000Z',
        },
      ];

      // Set of existing IDs (middle user already exists)
      const existingIds = new Set(['987654321098765432']);

      const { filterNewMembers } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act
      const result = filterNewMembers(memberData, existingIds);

      // Assert - Should only return members not in existingIds
      expect(result).toHaveLength(2);
      expect(result[0]?.discord_id).toBe('123456789012345678');
      expect(result[1]?.discord_id).toBe('555666777888999000');

      // Should not contain the existing user
      const existingUserFound = result.some(member => member.discord_id === '987654321098765432');
      expect(existingUserFound).toBe(false);
    });

    it('should return all members when no existing IDs provided', async () => {
      // Testing the case where Google Sheets is empty (no existing members)

      // Arrange - Member data with empty existing IDs set
      const memberData = [
        {
          discord_id: '123456789012345678',
          discord_username_display: 'User1',
          discord_username_actual: 'user1',
          server_join_date: '2023-01-01T00:00:00.000Z',
          is_banned: false,
          is_active: true,
          last_updated: '2023-01-01T00:00:00.000Z',
        },
        {
          discord_id: '987654321098765432',
          discord_username_display: 'User2',
          discord_username_actual: 'user2',
          server_join_date: '2023-02-01T00:00:00.000Z',
          is_banned: false,
          is_active: true,
          last_updated: '2023-02-01T00:00:00.000Z',
        },
      ];

      const existingIds = new Set<string>(); // Empty set

      const { filterNewMembers } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act
      const result = filterNewMembers(memberData, existingIds);

      // Assert - Should return all members
      expect(result).toHaveLength(2);
      expect(result).toEqual(memberData);
    });

    it('should return empty array when all members already exist', async () => {
      // Testing the case where all Discord members are already in Google Sheets

      // Arrange - Member data where all IDs already exist
      const memberData = [
        {
          discord_id: '123456789012345678',
          discord_username_display: 'ExistingUser1',
          discord_username_actual: 'existinguser1',
          server_join_date: '2023-01-01T00:00:00.000Z',
          is_banned: false,
          is_active: true,
          last_updated: '2023-01-01T00:00:00.000Z',
        },
        {
          discord_id: '987654321098765432',
          discord_username_display: 'ExistingUser2',
          discord_username_actual: 'existinguser2',
          server_join_date: '2023-02-01T00:00:00.000Z',
          is_banned: false,
          is_active: true,
          last_updated: '2023-02-01T00:00:00.000Z',
        },
      ];

      // All IDs exist in sheets
      const existingIds = new Set(['123456789012345678', '987654321098765432']);

      const { filterNewMembers } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act
      const result = filterNewMembers(memberData, existingIds);

      // Assert - Should return empty array
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('should handle empty input arrays gracefully', async () => {
      // Testing edge case of empty member data input

      // Arrange - Empty member data
      const memberData: any[] = [];
      const existingIds = new Set(['123456789012345678', '987654321098765432']);

      const { filterNewMembers } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act
      const result = filterNewMembers(memberData, existingIds);

      // Assert - Should return empty array
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });
  });
});
