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
});
