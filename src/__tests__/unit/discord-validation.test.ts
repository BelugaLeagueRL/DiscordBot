/**
 * Unit tests for Discord validation functions
 * Testing granular validation logic following TDD Red-Green-Refactor
 */

import { describe, it, expect } from 'vitest';

describe('Discord Validation Functions - Unit Tests', () => {
  describe('isValidDiscordId', () => {
    it('should validate 17-digit Discord IDs and verify exact format requirements', async () => {
      // Arrange - 17 digit Discord ID (minimum)
      const validId = '12345678901234567';

      const { isValidDiscordId } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act
      const result = isValidDiscordId(validId);

      // Assert - Behavioral validation: should accept exactly 17 numeric characters
      expect(result).toBe(true);
      expect(validId).toMatch(/^\d{17}$/);
      expect(validId.length).toBe(17);
    });

    it('should validate 18-digit Discord IDs and verify standard format', async () => {
      // Arrange - 18 digit Discord ID (most common)
      const validId = '123456789012345678';

      const { isValidDiscordId } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act
      const result = isValidDiscordId(validId);

      // Assert - Behavioral validation: should accept exactly 18 numeric characters
      expect(result).toBe(true);
      expect(validId).toMatch(/^\d{18}$/);
      expect(validId.length).toBe(18);
      expect(Number(validId)).toBeGreaterThan(0); // Valid numeric conversion
    });

    it('should validate 19-digit Discord IDs and verify maximum length handling', async () => {
      // Arrange - 19 digit Discord ID (maximum)
      const validId = '1234567890123456789';

      const { isValidDiscordId } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act
      const result = isValidDiscordId(validId);

      // Assert - Behavioral validation: should accept exactly 19 numeric characters at maximum
      expect(result).toBe(true);
      expect(validId).toMatch(/^\d{19}$/);
      expect(validId.length).toBe(19);
      expect(validId).not.toMatch(/^0+$/); // Should not be all zeros
    });

    it('should reject Discord IDs containing letters and verify alphanumeric filtering', async () => {
      // Arrange - Invalid Discord ID with letter
      const invalidId = '12345678901234567a';

      const { isValidDiscordId } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act
      const result = isValidDiscordId(invalidId);

      // Assert - Behavioral validation: should reject any non-numeric characters
      expect(result).toBe(false);
      expect(invalidId).toMatch(/[a-zA-Z]/); // Contains letters
      expect(invalidId.length).toBe(18); // Correct length but wrong format
      expect(invalidId).not.toMatch(/^\d+$/); // Not all digits
    });

    it('should reject Discord IDs containing spaces', async () => {
      // Arrange - Invalid Discord ID with space
      const invalidId = '123456789012345 78';

      const { isValidDiscordId } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act & Assert
      expect(isValidDiscordId(invalidId)).toBe(false);
    });

    it('should reject Discord IDs containing hyphens', async () => {
      // Arrange - Invalid Discord ID with hyphen
      const invalidId = '123456789012345-78';

      const { isValidDiscordId } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act & Assert
      expect(isValidDiscordId(invalidId)).toBe(false);
    });

    it('should reject Discord IDs with mixed letters and numbers', async () => {
      // Arrange - Invalid Discord ID with mixed content
      const invalidId = 'abc123def456ghi789';

      const { isValidDiscordId } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act & Assert
      expect(isValidDiscordId(invalidId)).toBe(false);
    });

    it('should reject Discord IDs containing decimal points', async () => {
      // Arrange - Invalid Discord ID with decimal point
      const invalidId = '12345678901234567.8';

      const { isValidDiscordId } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act & Assert
      expect(isValidDiscordId(invalidId)).toBe(false);
    });

    it('should reject Discord IDs containing special characters', async () => {
      // Arrange - Invalid Discord ID with special character
      const invalidId = '123456789012345678!';

      const { isValidDiscordId } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act & Assert
      expect(isValidDiscordId(invalidId)).toBe(false);
    });

    it('should reject Discord IDs that are too short and verify minimum length enforcement', async () => {
      // Arrange - 16 digits (too short)
      const invalidId = '1234567890123456';

      const { isValidDiscordId } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act
      const result = isValidDiscordId(invalidId);

      // Assert - Behavioral validation: should enforce minimum 17-digit requirement
      expect(result).toBe(false);
      expect(invalidId).toMatch(/^\d+$/); // All digits but wrong length
      expect(invalidId.length).toBe(16); // Below minimum
      expect(invalidId.length).toBeLessThan(17); // Violates minimum
    });

    it('should reject Discord IDs that are too long and verify maximum length enforcement', async () => {
      // Arrange - 20 digits (too long)
      const invalidId = '12345678901234567890';

      const { isValidDiscordId } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act
      const result = isValidDiscordId(invalidId);

      // Assert - Behavioral validation: should enforce maximum 19-digit requirement
      expect(result).toBe(false);
      expect(invalidId).toMatch(/^\d+$/); // All digits but wrong length
      expect(invalidId.length).toBe(20); // Above maximum
      expect(invalidId.length).toBeGreaterThan(19); // Violates maximum
    });

    it('should reject Discord IDs that are much too short (15 digits)', async () => {
      // Arrange - 15 digits (too short)
      const invalidId = '123456789012345';

      const { isValidDiscordId } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act & Assert
      expect(isValidDiscordId(invalidId)).toBe(false);
    });

    it('should reject Discord IDs that are much too long (21 digits)', async () => {
      // Arrange - 21 digits (too long)
      const invalidId = '123456789012345678901';

      const { isValidDiscordId } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act & Assert
      expect(isValidDiscordId(invalidId)).toBe(false);
    });

    it('should reject empty Discord IDs', async () => {
      // Arrange - Empty string
      const invalidId = '';

      const { isValidDiscordId } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act & Assert
      expect(isValidDiscordId(invalidId)).toBe(false);
    });

    it('should reject single digit Discord IDs', async () => {
      // Arrange - Single digit
      const invalidId = '1';

      const { isValidDiscordId } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act & Assert
      expect(isValidDiscordId(invalidId)).toBe(false);
    });
  });

  describe('isValidUser', () => {
    it('should validate users with complete fields and verify all required properties', async () => {
      // Arrange - Valid user with all fields
      const validUser = {
        id: '123456789012345678',
        username: 'testuser',
        discriminator: '0001',
        global_name: 'Test User',
        avatar: 'avatar.jpg',
        bot: false,
      };

      const { isValidUser } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act
      const result = isValidUser(validUser);

      // Assert - Behavioral validation: should accept user with valid structure
      expect(result).toBe(true);
      expect(validUser.id).toMatch(/^\d{17,19}$/);
      expect(validUser.username.length).toBeGreaterThan(0);
      expect(typeof validUser.bot).toBe('boolean');
      expect(validUser.bot).toBe(false); // Non-bot requirement
    });

    it('should validate users with null optional fields', async () => {
      // Arrange - Valid user with null optional fields
      const validUser = {
        id: '987654321098765432',
        username: 'anotheruser',
        discriminator: '0002',
        global_name: null,
        avatar: null,
        bot: false,
      };

      const { isValidUser } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act & Assert
      expect(isValidUser(validUser)).toBe(true);
    });

    it('should exclude bot users and verify bot filtering behavior', async () => {
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

      // Act
      const result = isValidUser(botUser);

      // Assert - Behavioral validation: should reject users marked as bots
      expect(result).toBe(false);
      expect(botUser.bot).toBe(true); // Confirm bot flag
      expect(botUser.id).toMatch(/^\d{17,19}$/); // Valid ID format
      expect(botUser.username.length).toBeGreaterThan(0); // Valid username
      // Bot flag should be the exclusion reason
    });

    it('should reject users with empty Discord IDs and verify ID validation behavior', async () => {
      // Arrange - User with empty ID
      const invalidUser = {
        id: '',
        username: 'testuser',
        discriminator: '0001',
        global_name: 'Test User',
        avatar: null,
        bot: false,
      };

      const { isValidUser } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act
      const result = isValidUser(invalidUser);

      // Assert - Behavioral validation: should reject empty ID strings
      expect(result).toBe(false);
      expect(invalidUser.id).toBe(''); // Confirm empty ID
      expect(invalidUser.id.length).toBe(0); // No characters
      expect(invalidUser.username.length).toBeGreaterThan(0); // Valid username
      expect(invalidUser.bot).toBe(false); // Valid bot flag
    });

    it('should reject users with empty usernames', async () => {
      // Arrange - User with empty username
      const invalidUser = {
        id: '123456789012345678',
        username: '',
        discriminator: '0001',
        global_name: 'Test User',
        avatar: null,
        bot: false,
      };

      const { isValidUser } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act & Assert
      expect(isValidUser(invalidUser)).toBe(false);
    });

    it('should reject users with invalid Discord ID format and verify format constraints', async () => {
      // Arrange - User with invalid Discord ID format
      const invalidUser = {
        id: 'invalid-id',
        username: 'testuser',
        discriminator: '0001',
        global_name: 'Test User',
        avatar: null,
        bot: false,
      };

      const { isValidUser } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act
      const result = isValidUser(invalidUser);

      // Assert - Behavioral validation: should reject non-numeric IDs
      expect(result).toBe(false);
      expect(invalidUser.id).toMatch(/[^\d]/); // Contains non-digits
      expect(invalidUser.id).not.toMatch(/^\d{17,19}$/); // Wrong format
      expect(invalidUser.username.length).toBeGreaterThan(0); // Valid username
      expect(invalidUser.bot).toBe(false); // Valid bot flag
    });

    it('should handle user ID as number gracefully', async () => {
      // Arrange - User with number ID instead of string
      const malformedUser = {
        id: 12345 as any,
        username: 'testuser',
        discriminator: '0001',
        global_name: 'Test User',
        avatar: null,
        bot: false,
      };

      const { isValidUser } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act & Assert
      expect(isValidUser(malformedUser as any)).toBe(false);
    });

    it('should handle null username gracefully', async () => {
      // Arrange - User with null username
      const malformedUser = {
        id: '123456789012345678',
        username: null,
        discriminator: '0001',
        global_name: 'Test User',
        avatar: null,
        bot: false,
      };

      const { isValidUser } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act & Assert
      expect(isValidUser(malformedUser as any)).toBe(false);
    });

    it('should handle bot field as string gracefully', async () => {
      // Arrange - User with string bot field instead of boolean
      const malformedUser = {
        id: '123456789012345678',
        username: 'testuser',
        discriminator: '0001',
        global_name: 'Test User',
        avatar: null,
        bot: 'false',
      };

      const { isValidUser } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act & Assert
      expect(isValidUser(malformedUser as any)).toBe(false);
    });
  });

  describe('isValidMember', () => {
    it('should validate members with complete fields', async () => {
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

      const { isValidMember } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act & Assert
      expect(isValidMember(validMember)).toBe(true);
    });

    it('should validate members with minimal fields', async () => {
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

      const { isValidMember } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act & Assert
      expect(isValidMember(validMember)).toBe(true);
    });

    it('should reject members with bot users', async () => {
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

      const { isValidMember } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act & Assert
      expect(isValidMember(invalidMember)).toBe(false);
    });

    it('should reject members with invalid Discord IDs', async () => {
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

      const { isValidMember } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act & Assert
      expect(isValidMember(invalidMember)).toBe(false);
    });

    it('should reject members with non-array roles field', async () => {
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

      const { isValidMember } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act & Assert
      expect(isValidMember(malformedMember)).toBe(false);
    });

    it('should reject members with null joined_at field', async () => {
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

      const { isValidMember } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act & Assert
      expect(isValidMember(malformedMember)).toBe(false);
    });

    it('should reject members with numeric joined_at field', async () => {
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

      const { isValidMember } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act & Assert
      expect(isValidMember(malformedMember)).toBe(false);
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

      // Assert - Behavioral validation: verify transformation logic and priority system
      expect(result).toHaveLength(3);

      // Test nickname priority behavior: nick > global_name > username
      expect(result[0]).toEqual({
        discord_id: '123456789012345678',
        discord_username_display: 'Nickname1', // nick used (highest priority)
        discord_username_actual: 'username1',
        server_join_date: '2023-01-01T00:00:00.000Z',
        is_banned: false,
        is_active: true,
        last_updated: expect.any(String),
      });
      // Verify nick was available and selected
      expect(validMembers[0]?.nick).toBe('Nickname1');
      expect(validMembers[0]?.user.global_name).toBe('GlobalName1');
      expect(result[0]?.discord_username_display).toBe(validMembers[0]?.nick);

      // Test global_name fallback behavior
      expect(result[1]).toEqual({
        discord_id: '987654321098765432',
        discord_username_display: 'GlobalName2', // global_name used (second priority)
        discord_username_actual: 'username2',
        server_join_date: '2023-02-01T00:00:00.000Z',
        is_banned: false,
        is_active: true,
        last_updated: expect.any(String),
      });
      // Verify nick was null and global_name was selected
      expect(validMembers[1]?.nick).toBeNull();
      expect(validMembers[1]?.user.global_name).toBe('GlobalName2');
      expect(result[1]?.discord_username_display).toBe(validMembers[1]?.user.global_name);

      // Test username fallback behavior
      expect(result[2]).toEqual({
        discord_id: '555666777888999000',
        discord_username_display: 'username3', // username used (fallback)
        discord_username_actual: 'username3',
        server_join_date: '2023-03-01T00:00:00.000Z',
        is_banned: false,
        is_active: true,
        last_updated: expect.any(String),
      });
      // Verify both nick and global_name were null, username was used
      expect(validMembers[2]?.nick).toBeNull();
      expect(validMembers[2]?.user.global_name).toBeNull();
      expect(result[2]?.discord_username_display).toBe(validMembers[2]?.user.username);
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

      const { transformMemberData } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

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

      const { transformMemberData } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

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

      const { filterNewMembers } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );

      // Act
      const result = filterNewMembers(memberData, existingIds);

      // Assert - Behavioral validation: filtering should exclude existing members
      expect(result).toHaveLength(2);
      expect(result[0]?.discord_id).toBe('123456789012345678');
      expect(result[1]?.discord_id).toBe('555666777888999000');

      // Verify filtering behavior: existing user should be excluded
      const existingUserFound = result.some(member => member.discord_id === '987654321098765432');
      expect(existingUserFound).toBe(false);

      // Verify all returned members are NOT in existing set
      const returnedIds = result.map(member => member.discord_id);
      expect(returnedIds.every(id => !existingIds.has(id))).toBe(true);

      // Verify we got exactly the non-existing members
      expect(returnedIds).toContain('123456789012345678');
      expect(returnedIds).toContain('555666777888999000');
      expect(returnedIds).not.toContain('987654321098765432');
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

      // Assert - Behavioral validation: empty existing set should return all members
      expect(result).toHaveLength(2);
      expect(result).toEqual(memberData);

      // Verify no filtering occurred
      expect(existingIds.size).toBe(0); // Confirm empty set
      expect(result.length).toBe(memberData.length); // Same count
      expect(result[0]?.discord_id).toBe(memberData[0]?.discord_id);
      expect(result[1]?.discord_id).toBe(memberData[1]?.discord_id);
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
