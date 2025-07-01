/**
 * RED Phase: convertErrorToUserMessage() comprehensive error type testing
 * Tests all predefined error mappings and unknown error scenarios
 * Following TDD Red-Green-Refactor with anti-pattern prevention
 */

import { describe, it, expect } from 'vitest';

// Import the function under test - this will fail initially (RED phase)
import { convertErrorToUserMessage } from '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler';

describe('convertErrorToUserMessage', () => {
  describe('Discord Permission Errors', () => {
    it('should convert "Bot lacks permission" error to user-friendly message', () => {
      // Arrange
      const error = new Error('Bot lacks permission to access server members');

      // Act
      const result = convertErrorToUserMessage(error);

      // Assert
      expect(result).toBe('Bot needs "View Server Members" permission');
    });

    it('should handle variations of bot permission errors', () => {
      // Arrange - Different variations of the same error type
      const variations = [
        'Bot lacks permission',
        'The bot lacks permission to view members',
        'Error: Bot lacks permission in this server',
      ];

      // Act & Assert
      for (const variation of variations) {
        const error = new Error(variation);
        const result = convertErrorToUserMessage(error);
        expect(result, `Failed for variation: ${variation}`).toBe(
          'Bot needs "View Server Members" permission'
        );
      }
    });
  });

  describe('Google Sheets Authentication Errors', () => {
    it('should convert "authentication failed" error to configuration message', () => {
      // Arrange
      const error = new Error('Google Sheets authentication failed: Invalid credentials');

      // Act
      const result = convertErrorToUserMessage(error);

      // Assert
      expect(result).toBe('Google Sheets configuration error');
    });

    it('should convert "OAuth failed" error to configuration message', () => {
      // Arrange
      const error = new Error('OAuth failed: Token expired');

      // Act
      const result = convertErrorToUserMessage(error);

      // Assert
      expect(result).toBe('Google Sheets configuration error');
    });

    it('should handle variations of authentication errors', () => {
      // Arrange - Different variations of auth errors
      const variations = [
        'authentication failed',
        'OAuth failed',
        'Google authentication failed to complete',
        'OAuth failed with status 401',
      ];

      // Act & Assert
      for (const variation of variations) {
        const error = new Error(variation);
        const result = convertErrorToUserMessage(error);
        expect(result, `Failed for variation: ${variation}`).toBe(
          'Google Sheets configuration error'
        );
      }
    });
  });

  describe('Discord API Errors', () => {
    it('should convert "Discord API error" to service unavailable message', () => {
      // Arrange
      const error = new Error('Discord API error: 503 Service Unavailable');

      // Act
      const result = convertErrorToUserMessage(error);

      // Assert
      expect(result).toBe('Discord service temporarily unavailable');
    });

    it('should handle variations of Discord API errors', () => {
      // Arrange - Different Discord API error variations
      const variations = [
        'Discord API error: Rate limited',
        'Discord API error (500): Internal Server Error',
        'Received Discord API error during request',
      ];

      // Act & Assert
      for (const variation of variations) {
        const error = new Error(variation);
        const result = convertErrorToUserMessage(error);
        expect(result, `Failed for variation: ${variation}`).toBe(
          'Discord service temporarily unavailable'
        );
      }
    });
  });

  describe('Discord Member Fetch Errors', () => {
    it('should convert "Failed to fetch members" error to access message', () => {
      // Arrange
      const error = new Error('Failed to fetch members: Guild not found');

      // Act
      const result = convertErrorToUserMessage(error);

      // Assert
      expect(result).toBe('Could not access Discord server members');
    });

    it('should handle variations of member fetch errors', () => {
      // Arrange - Different member fetch error variations
      const variations = [
        'Failed to fetch members',
        'Failed to fetch members from Discord',
        'Operation failed: Failed to fetch members',
      ];

      // Act & Assert
      for (const variation of variations) {
        const error = new Error(variation);
        const result = convertErrorToUserMessage(error);
        expect(result, `Failed for variation: ${variation}`).toBe(
          'Could not access Discord server members'
        );
      }
    });
  });

  describe('Google Sheets Append Errors', () => {
    it('should convert "Failed to append members" error to update message', () => {
      // Arrange
      const error = new Error('Failed to append members: Quota exceeded');

      // Act
      const result = convertErrorToUserMessage(error);

      // Assert
      expect(result).toBe('Could not update Google Sheets');
    });

    it('should handle variations of append errors', () => {
      // Arrange - Different append error variations
      const variations = [
        'Failed to append members',
        'Failed to append members to spreadsheet',
        'Google Sheets operation failed: Failed to append members',
      ];

      // Act & Assert
      for (const variation of variations) {
        const error = new Error(variation);
        const result = convertErrorToUserMessage(error);
        expect(result, `Failed for variation: ${variation}`).toBe('Could not update Google Sheets');
      }
    });
  });

  describe('Unknown and Edge Case Errors', () => {
    it('should convert unknown Error objects to generic message', () => {
      // Arrange
      const error = new Error('Some completely unknown error message');

      // Act
      const result = convertErrorToUserMessage(error);

      // Assert
      expect(result).toBe('Unexpected error - check server logs');
    });

    it('should convert non-Error objects to generic message', () => {
      // Arrange - Non-Error objects that might be thrown
      const nonErrorObjects = [
        'string error',
        42,
        { message: 'object error' },
        null,
        undefined,
        ['array', 'error'],
      ];

      // Act & Assert
      for (const nonError of nonErrorObjects) {
        const result = convertErrorToUserMessage(nonError);
        expect(result, `Failed for non-error: ${JSON.stringify(nonError)}`).toBe(
          'Unexpected error - check server logs'
        );
      }
    });

    it('should handle Error objects with empty messages', () => {
      // Arrange
      const error = new Error('');

      // Act
      const result = convertErrorToUserMessage(error);

      // Assert
      expect(result).toBe('Unexpected error - check server logs');
    });

    it('should handle Error objects with only whitespace messages', () => {
      // Arrange
      const error = new Error('   \n\t  ');

      // Act
      const result = convertErrorToUserMessage(error);

      // Assert
      expect(result).toBe('Unexpected error - check server logs');
    });
  });

  describe('Case Sensitivity and Pattern Matching', () => {
    it('should be case-sensitive for error pattern matching', () => {
      // Arrange - Test case sensitivity
      const caseVariations = [
        'BOT LACKS PERMISSION',
        'Bot Lacks Permission',
        'oauth FAILED',
        'DISCORD API ERROR',
      ];

      // Act & Assert - Should all fall through to generic message due to case sensitivity
      for (const variation of caseVariations) {
        const error = new Error(variation);
        const result = convertErrorToUserMessage(error);
        expect(result, `Failed for case variation: ${variation}`).toBe(
          'Unexpected error - check server logs'
        );
      }
    });

    it('should handle partial matches correctly', () => {
      // Arrange - Test partial pattern matching
      const partialMatches = [
        'authentication', // Missing "failed"
        'Discord API', // Missing "error"
        'Bot lacks', // Missing "permission"
        'Failed to fetch', // Missing "members"
      ];

      // Act & Assert - Should all fall through to generic message due to incomplete patterns
      for (const partial of partialMatches) {
        const result = convertErrorToUserMessage(partial);
        expect(result, `Failed for partial match: ${partial}`).toBe(
          'Unexpected error - check server logs'
        );
      }
    });
  });

  describe('Error Message Priority and Precedence', () => {
    it('should prioritize first matching pattern when multiple patterns match', () => {
      // Arrange - Error message that could match multiple patterns
      const error = new Error('Bot lacks permission and authentication failed');

      // Act
      const result = convertErrorToUserMessage(error);

      // Assert - Should match the first pattern (Bot lacks permission)
      expect(result).toBe('Bot needs "View Server Members" permission');
    });

    it('should handle errors with multiple keywords correctly', () => {
      // Arrange - Complex error messages with multiple keywords
      const complexErrors = [
        'Discord API error occurred while checking if bot lacks permission',
        'OAuth failed during Discord API error response',
        'Failed to fetch members due to authentication failed',
      ];

      // Expected results based on priority order in function
      const expectedResults = [
        'Bot needs "View Server Members" permission', // "Bot lacks permission" comes first
        'Google Sheets configuration error', // "authentication failed" comes before "Discord API error"
        'Google Sheets configuration error', // "authentication failed" comes before "Failed to fetch members"
      ];

      // Act & Assert
      for (let i = 0; i < complexErrors.length; i++) {
        const error = new Error(complexErrors[i] as string);
        const result = convertErrorToUserMessage(error);
        expect(result, `Failed for complex error: ${complexErrors[i]}`).toBe(expectedResults[i]);
      }
    });
  });

  describe('Performance and Input Validation', () => {
    it('should handle very long error messages efficiently', () => {
      // Arrange - Very long error message
      const longMessage = 'Discord API error: ' + 'x'.repeat(10000);
      const error = new Error(longMessage);

      // Act
      const startTime = Date.now();
      const result = convertErrorToUserMessage(error);
      const endTime = Date.now();

      // Assert - Should be fast and return correct result
      expect(endTime - startTime).toBeLessThan(100); // Should complete in < 100ms
      expect(result).toBe('Discord service temporarily unavailable');
    });

    it('should handle unicode characters in error messages', () => {
      // Arrange - Error messages with unicode characters
      const unicodeErrors = [
        'Bot lacks permission 🤖',
        'OAuth failed: 認証エラー',
        'Discord API error: Ñot found',
      ];

      // Expected results
      const expectedResults = [
        'Bot needs "View Server Members" permission',
        'Google Sheets configuration error',
        'Discord service temporarily unavailable',
      ];

      // Act & Assert
      for (let i = 0; i < unicodeErrors.length; i++) {
        const error = new Error(unicodeErrors[i] as string);
        const result = convertErrorToUserMessage(error);
        expect(result, `Failed for unicode error: ${unicodeErrors[i]}`).toBe(expectedResults[i]);
      }
    });
  });
});
