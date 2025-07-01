/**
 * Unit tests for Discord validation functions
 * Testing granular validation logic following TDD Red-Green-Refactor
 */

import { describe, it, expect } from 'vitest';
import {
  isValidDiscordId,
  isValidUser,
  isValidMember,
  transformMemberData,
  filterNewMembers,
} from '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members';

describe('Discord Validation Functions - Unit Tests', () => {
  describe('isValidDiscordId', () => {
    it('should accept 17-digit Discord IDs', () => {
      // Arrange
      const validId = '12345678901234567';

      // Act
      const result = isValidDiscordId(validId);

      // Assert
      expect(result).toBe(true);
    });

    it('should accept minimum length Discord IDs', () => {
      // Arrange
      const minimumLengthId = '12345678901234567';

      // Act
      const result = isValidDiscordId(minimumLengthId);

      // Assert
      expect(result).toBe(true);
    });

    it('should accept 18-digit Discord IDs', () => {
      // Arrange
      const validId = '123456789012345678';

      // Act
      const result = isValidDiscordId(validId);

      // Assert
      expect(result).toBe(true);
    });

    it('should accept standard length Discord IDs', () => {
      // Arrange
      const standardLengthId = '123456789012345678';

      // Act
      const result = isValidDiscordId(standardLengthId);

      // Assert
      expect(result).toBe(true);
    });

    it('should accept numeric Discord IDs', () => {
      // Arrange
      const numericId = '123456789012345678';

      // Act
      const result = isValidDiscordId(numericId);

      // Assert
      expect(result).toBe(true);
    });

    it('should accept 19-digit Discord IDs', () => {
      // Arrange
      const validId = '1234567890123456789';

      // Act
      const result = isValidDiscordId(validId);

      // Assert
      expect(result).toBe(true);
    });

    it('should accept maximum length Discord IDs', () => {
      // Arrange
      const maximumLengthId = '1234567890123456789';

      // Act
      const result = isValidDiscordId(maximumLengthId);

      // Assert
      expect(result).toBe(true);
    });

    it('should reject Discord IDs containing letters', () => {
      // Arrange
      const invalidId = '12345678901234567a';

      // Act
      const result = isValidDiscordId(invalidId);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject Discord IDs containing spaces', () => {
      // Arrange - Invalid Discord ID with space
      const invalidId = '123456789012345 78';

      // Act & Assert
      expect(isValidDiscordId(invalidId)).toBe(false);
    });

    it('should reject Discord IDs containing hyphens', () => {
      // Arrange - Invalid Discord ID with hyphen
      const invalidId = '123456789012345-78';

      // Act & Assert
      expect(isValidDiscordId(invalidId)).toBe(false);
    });

    it('should reject Discord IDs with mixed letters and numbers', () => {
      // Arrange - Invalid Discord ID with mixed content
      const invalidId = 'abc123def456ghi789';

      // Act & Assert
      expect(isValidDiscordId(invalidId)).toBe(false);
    });

    it('should reject Discord IDs containing decimal points', () => {
      // Arrange - Invalid Discord ID with decimal point
      const invalidId = '12345678901234567.8';

      // Act & Assert
      expect(isValidDiscordId(invalidId)).toBe(false);
    });

    it('should reject Discord IDs containing special characters', () => {
      // Arrange - Invalid Discord ID with special character
      const invalidId = '123456789012345678!';

      // Act & Assert
      expect(isValidDiscordId(invalidId)).toBe(false);
    });

    it('should reject Discord IDs that are too short', () => {
      // Arrange
      const invalidId = '1234567890123456'; // 16 digits

      // Act
      const result = isValidDiscordId(invalidId);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject IDs below minimum length', () => {
      // Arrange
      const shortId = '1234567890123456'; // 16 digits

      // Act
      const result = isValidDiscordId(shortId);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject Discord IDs that are too long', () => {
      // Arrange
      const invalidId = '12345678901234567890'; // 20 digits

      // Act
      const result = isValidDiscordId(invalidId);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject IDs above maximum length', () => {
      // Arrange
      const longId = '12345678901234567890'; // 20 digits

      // Act
      const result = isValidDiscordId(longId);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject Discord IDs that are much too short (15 digits)', () => {
      // Arrange - 15 digits (too short)
      const invalidId = '123456789012345';

      // Act & Assert
      expect(isValidDiscordId(invalidId)).toBe(false);
    });

    it('should reject Discord IDs that are much too long (21 digits)', () => {
      // Arrange - 21 digits (too long)
      const invalidId = '123456789012345678901';

      // Act & Assert
      expect(isValidDiscordId(invalidId)).toBe(false);
    });

    it('should reject empty Discord IDs', () => {
      // Arrange - Empty string
      const invalidId = '';

      // Act & Assert
      expect(isValidDiscordId(invalidId)).toBe(false);
    });

    it('should reject single digit Discord IDs', () => {
      // Arrange - Single digit
      const invalidId = '1';

      // Act & Assert
      expect(isValidDiscordId(invalidId)).toBe(false);
    });
  });

  describe('isValidUser', () => {
    it('should accept users with complete fields', () => {
      // Arrange
      const validUser = {
        id: '123456789012345678',
        username: 'testuser',
        discriminator: '0001',
        global_name: 'Test User',
        avatar: 'avatar.jpg',
        bot: false,
      };

      // Act
      const result = isValidUser(validUser);

      // Assert
      expect(result).toBe(true);
    });

    it('should accept users with valid Discord ID format', () => {
      // Arrange
      const userWithValidId = {
        id: '123456789012345678',
        username: 'testuser',
        discriminator: '0001',
        global_name: 'Test User',
        avatar: 'avatar.jpg',
        bot: false,
      };

      // Act
      const result = isValidUser(userWithValidId);

      // Assert
      expect(result).toBe(true);
    });

    it('should accept users with non-empty username', () => {
      // Arrange
      const userWithUsername = {
        id: '123456789012345678',
        username: 'testuser',
        discriminator: '0001',
        global_name: 'Test User',
        avatar: 'avatar.jpg',
        bot: false,
      };

      // Act
      const result = isValidUser(userWithUsername);

      // Assert
      expect(result).toBe(true);
    });

    it('should validate users with null optional fields', () => {
      // Arrange - Valid user with null optional fields
      const validUser = {
        id: '987654321098765432',
        username: 'anotheruser',
        discriminator: '0002',
        global_name: null,
        avatar: null,
        bot: false,
      };

      // Act & Assert
      expect(isValidUser(validUser)).toBe(true);
    });

    it('should reject bot users', () => {
      // Arrange
      const botUser = {
        id: '123456789012345678',
        username: 'botuser',
        discriminator: '0000',
        global_name: 'Bot User',
        avatar: null,
        bot: true,
      };

      // Act
      const result = isValidUser(botUser);

      // Assert
      expect(result).toBe(false);
    });

    it('should filter out users based on bot flag', () => {
      // Arrange
      const botUser = {
        id: '123456789012345678',
        username: 'botuser',
        discriminator: '0000',
        global_name: 'Bot User',
        avatar: null,
        bot: true,
      };

      // Act
      const result = isValidUser(botUser);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject users with empty Discord IDs', () => {
      // Arrange
      const invalidUser = {
        id: '',
        username: 'testuser',
        discriminator: '0001',
        global_name: 'Test User',
        avatar: null,
        bot: false,
      };

      // Act
      const result = isValidUser(invalidUser);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject users with empty usernames', () => {
      // Arrange - User with empty username
      const invalidUser = {
        id: '123456789012345678',
        username: '',
        discriminator: '0001',
        global_name: 'Test User',
        avatar: null,
        bot: false,
      };

      // Act & Assert
      expect(isValidUser(invalidUser)).toBe(false);
    });

    it('should reject users with invalid Discord ID format', () => {
      // Arrange
      const invalidUser = {
        id: 'invalid-id',
        username: 'testuser',
        discriminator: '0001',
        global_name: 'Test User',
        avatar: null,
        bot: false,
      };

      // Act
      const result = isValidUser(invalidUser);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle user ID as number gracefully', () => {
      // Arrange - User with number ID instead of string
      const malformedUser = {
        id: 12345 as any,
        username: 'testuser',
        discriminator: '0001',
        global_name: 'Test User',
        avatar: null,
        bot: false,
      };

      // Act & Assert
      expect(isValidUser(malformedUser as any)).toBe(false);
    });

    it('should handle null username gracefully', () => {
      // Arrange - User with null username
      const malformedUser = {
        id: '123456789012345678',
        username: null,
        discriminator: '0001',
        global_name: 'Test User',
        avatar: null,
        bot: false,
      };

      // Act & Assert
      expect(isValidUser(malformedUser as any)).toBe(false);
    });

    it('should handle bot field as string gracefully', () => {
      // Arrange - User with string bot field instead of boolean
      const malformedUser = {
        id: '123456789012345678',
        username: 'testuser',
        discriminator: '0001',
        global_name: 'Test User',
        avatar: null,
        bot: 'false',
      };

      // Act & Assert
      expect(isValidUser(malformedUser as any)).toBe(false);
    });
  });

  describe('isValidMember', () => {
    it('should validate members with complete fields', () => {
      // Arrange - Valid member with complete fields
      const validMember = {
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
      };

      // Act & Assert
      expect(isValidMember(validMember)).toBe(true);
    });

    it('should validate members with minimal fields', () => {
      // Arrange - Valid member with minimal fields
      const validMember = {
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
      };

      // Act & Assert
      expect(isValidMember(validMember)).toBe(true);
    });

    it('should reject members with bot users', () => {
      // Arrange - Member with bot user
      const invalidMember = {
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
      };

      // Act & Assert
      expect(isValidMember(invalidMember)).toBe(false);
    });

    it('should reject members with invalid Discord IDs', () => {
      // Arrange - Member with invalid Discord ID
      const invalidMember = {
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
      };

      // Act & Assert
      expect(isValidMember(invalidMember)).toBe(false);
    });

    it('should reject members with non-array roles field', () => {
      // Arrange - Member with roles as string instead of array
      const malformedMember = {
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
      };

      // Act & Assert
      expect(isValidMember(malformedMember)).toBe(false);
    });

    it('should reject members with null joined_at field', () => {
      // Arrange - Member with null joined_at
      const malformedMember = {
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
      };

      // Act & Assert
      expect(isValidMember(malformedMember)).toBe(false);
    });

    it('should reject members with numeric joined_at field', () => {
      // Arrange - Member with number joined_at instead of string
      const malformedMember = {
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
      };

      // Act & Assert
      expect(isValidMember(malformedMember)).toBe(false);
    });
  });

  describe('transformMemberData', () => {
    it('should transform valid members into correct format', () => {
      // Arrange
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
          nick: 'Nickname1',
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
      ];

      // Act
      const result = transformMemberData(validMembers);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        discord_id: '123456789012345678',
        discord_username_actual: 'username1',
        server_join_date: '2023-01-01T00:00:00.000Z',
        is_banned: false,
        is_active: true,
      });
    });

    it('should prioritize nickname over global_name and username', () => {
      // Arrange
      const memberWithNick = {
        user: {
          id: '123456789012345678',
          username: 'username1',
          discriminator: '0001',
          global_name: 'GlobalName1',
          avatar: null,
          bot: false,
        },
        nick: 'Nickname1',
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
      const result = transformMemberData([memberWithNick]);

      // Assert
      expect(result[0]?.discord_username_display).toBe('Nickname1');
    });

    it('should use global_name when nickname is null', () => {
      // Arrange
      const memberWithGlobalName = {
        user: {
          id: '987654321098765432',
          username: 'username2',
          discriminator: '0002',
          global_name: 'GlobalName2',
          avatar: null,
          bot: false,
        },
        nick: null,
        roles: [],
        joined_at: '2023-02-01T00:00:00.000Z',
        premium_since: null,
        deaf: false,
        mute: false,
        flags: 0,
        pending: false,
        permissions: '0',
        communication_disabled_until: null,
      };

      // Act
      const result = transformMemberData([memberWithGlobalName]);

      // Assert
      expect(result[0]?.discord_username_display).toBe('GlobalName2');
    });

    it('should fallback to username when nick and global_name are null', () => {
      // Arrange
      const memberWithUsernameOnly = {
        user: {
          id: '555666777888999000',
          username: 'username3',
          discriminator: '0003',
          global_name: null,
          avatar: null,
          bot: false,
        },
        nick: null,
        roles: [],
        joined_at: '2023-03-01T00:00:00.000Z',
        premium_since: null,
        deaf: false,
        mute: false,
        flags: 0,
        pending: false,
        permissions: '0',
        communication_disabled_until: null,
      };

      // Act
      const result = transformMemberData([memberWithUsernameOnly]);

      // Assert
      expect(result[0]?.discord_username_display).toBe('username3');
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

      // Act
      const result = transformMemberData(mixedMembers);

      // Assert - Behavioral validation: filtering should remove invalid members
      expect(result).toHaveLength(1);
      expect(result[0]?.discord_id).toBe('123456789012345678');
      expect(result[0]?.discord_username_actual).toBe('validuser');

      // Verify filtering behavior: bot user should be excluded
      const botUserFiltered = result.find(member => member.discord_id === '987654321098765432');
      expect(botUserFiltered).toBeUndefined();

      // Verify filtering behavior: invalid ID user should be excluded
      const invalidIdFiltered = result.find(
        member => member.discord_username_actual === 'invaliduser'
      );
      expect(invalidIdFiltered).toBeUndefined();

      // Verify only valid non-bot users remain
      expect(result.every(member => member.is_active === true)).toBe(true);
      expect(result.every(member => member.is_banned === false)).toBe(true);
    });

    it('should handle empty input arrays gracefully', async () => {
      // Testing edge case of empty input

      // Act
      const result = transformMemberData([]);

      // Assert - Behavioral validation: empty input should produce empty output
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true); // Should be array
      expect(result.length).toBe(0); // Explicitly check length
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

      // Act
      const result = transformMemberData([validMember]);

      // Assert - Behavioral validation: timestamp generation behavior
      expect(result).toHaveLength(1);
      expect(result[0]?.last_updated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/); // ISO format

      // Verify timestamp generation behavior
      const timestamp = new Date(result[0]?.last_updated ?? '');
      const now = new Date();
      const diffMs = now.getTime() - timestamp.getTime();
      expect(diffMs).toBeLessThan(5000); // Within 5 seconds
      expect(timestamp).toBeInstanceOf(Date); // Valid date object
      expect(timestamp.getTime()).toBeGreaterThan(0); // Valid timestamp
      expect(result[0]?.last_updated).toContain('T'); // Contains time separator
      expect(result[0]?.last_updated?.endsWith('Z')).toBe(true); // UTC timezone
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

      // Act
      const result = filterNewMembers(memberData, existingIds);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]?.discord_id).toBe('123456789012345678');
      expect(result[1]?.discord_id).toBe('555666777888999000');
    });

    it('should return all members when no existing IDs provided', () => {
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

      // Act
      const result = filterNewMembers(memberData, existingIds);

      // Assert - Behavioral validation: empty existing set should return all members
      expect(result).toHaveLength(2);
      expect(result).toEqual(memberData);

      // Verify no filtering occurred
      expect(existingIds.size).toBe(0); // Confirm empty set
      expect(result.length).toBe(memberData.length); // Same count
      expect(result[0]?.discord_id).toBe(memberData[0]?.discord_id);
      expect(result[1]?.discord_id).toBe(memberData[1]?.discord_id);
    });

    it('should return empty array when all members already exist', () => {
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

      // Act
      const result = filterNewMembers(memberData, existingIds);

      // Assert - Behavioral validation: all existing should return empty array
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);

      // Verify all members were in existing set
      expect(existingIds.size).toBe(2); // Both IDs exist
      expect(existingIds.has('123456789012345678')).toBe(true);
      expect(existingIds.has('987654321098765432')).toBe(true);
      expect(memberData.length).toBe(2); // Had 2 members originally
      expect(result.length).toBe(0); // All filtered out
    });

    it('should handle empty input arrays gracefully', () => {
      // Testing edge case of empty member data input

      // Arrange - Empty member data
      const memberData: any[] = [];
      const existingIds = new Set(['123456789012345678', '987654321098765432']);

      // Act
      const result = filterNewMembers(memberData, existingIds);

      // Assert - Behavioral validation: empty input should return empty array
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);

      // Verify empty input handling
      expect(memberData.length).toBe(0); // Confirm empty input
      expect(Array.isArray(result)).toBe(true); // Should be array
      expect(existingIds.size).toBeGreaterThan(0); // Has existing IDs but no input
    });
  });
});
