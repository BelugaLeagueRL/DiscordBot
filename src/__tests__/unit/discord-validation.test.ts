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
});
