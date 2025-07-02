/**
 * RED Phase: Exact Error Message Validation for Flow 3 Specification
 *
 * This test suite validates the EXACT wording of the 8 predefined error messages
 * from convertErrorToUserMessage() to ensure they match Flow 3 requirements.
 *
 * Focus: Precise string matching for user-facing error messages
 * Pattern: RED-GREEN-REFACTOR TDD with strict message validation
 * Anti-patterns: No Free Ride, Liar, Slow Poke, or Happy Path bias
 */

import { describe, it, expect } from 'vitest';
import { convertErrorToUserMessage } from '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler';

describe('Exact Error Message Validation', () => {
  describe('Predefined Error Message #1: Bot Permission Errors', () => {
    it('should return exactly "Bot needs "View Server Members" permission" for bot permission errors', () => {
      // Arrange
      const error = new Error('Bot lacks permission to access server members');

      // Act
      const result = convertErrorToUserMessage(error);

      // Assert - EXACT string match with specific quotes
      expect(result).toBe('Bot needs "View Server Members" permission');
    });

    it('should return exact message for lowercase bot permission errors', () => {
      // Arrange
      const error = new Error('bot lacks permission in this server');

      // Act
      const result = convertErrorToUserMessage(error);

      // Assert - EXACT string match
      expect(result).toBe('Bot needs "View Server Members" permission');
    });
  });

  describe('Predefined Error Message #2: Google Sheets Configuration Errors', () => {
    it('should return exactly "Google Sheets configuration error" for authentication failures', () => {
      // Arrange
      const error = new Error('authentication failed during OAuth process');

      // Act
      const result = convertErrorToUserMessage(error);

      // Assert - EXACT string match
      expect(result).toBe('Google Sheets configuration error');
    });

    it('should return exact message for OAuth failures', () => {
      // Arrange
      const error = new Error('OAuth failed with 401 unauthorized');

      // Act
      const result = convertErrorToUserMessage(error);

      // Assert - EXACT string match
      expect(result).toBe('Google Sheets configuration error');
    });
  });

  describe('Predefined Error Message #3: Discord API Service Errors', () => {
    it('should return exactly "Discord service temporarily unavailable" for Discord API errors', () => {
      // Arrange
      const error = new Error('Discord API error: 503 Service Unavailable');

      // Act
      const result = convertErrorToUserMessage(error);

      // Assert - EXACT string match
      expect(result).toBe('Discord service temporarily unavailable');
    });
  });

  describe('Predefined Error Message #4: Discord Member Access Errors', () => {
    it('should return exactly "Could not access Discord server members" for member fetch failures', () => {
      // Arrange
      const error = new Error('Failed to fetch members from Discord API');

      // Act
      const result = convertErrorToUserMessage(error);

      // Assert - EXACT string match
      expect(result).toBe('Could not access Discord server members');
    });
  });

  describe('Predefined Error Message #5: Google Sheets Update Errors', () => {
    it('should return exactly "Could not update Google Sheets" for append failures', () => {
      // Arrange
      const error = new Error('Failed to append members to spreadsheet');

      // Act
      const result = convertErrorToUserMessage(error);

      // Assert - EXACT string match
      expect(result).toBe('Could not update Google Sheets');
    });
  });

  describe('Predefined Error Message #6: Unknown/Fallback Errors', () => {
    it('should return exactly "Unexpected error - check server logs" for unknown errors', () => {
      // Arrange
      const error = new Error('Some completely unrecognized error type');

      // Act
      const result = convertErrorToUserMessage(error);

      // Assert - EXACT string match
      expect(result).toBe('Unexpected error - check server logs');
    });

    it('should return exact fallback message for empty error messages', () => {
      // Arrange
      const error = new Error('');

      // Act
      const result = convertErrorToUserMessage(error);

      // Assert - EXACT string match
      expect(result).toBe('Unexpected error - check server logs');
    });

    it('should return exact fallback message for whitespace-only error messages', () => {
      // Arrange
      const error = new Error('   \n\t  ');

      // Act
      const result = convertErrorToUserMessage(error);

      // Assert - EXACT string match
      expect(result).toBe('Unexpected error - check server logs');
    });

    it('should return exact fallback message for non-Error objects', () => {
      // Arrange
      const nonErrorInput = 'string error message';

      // Act
      const result = convertErrorToUserMessage(nonErrorInput);

      // Assert - EXACT string match
      expect(result).toBe('Unexpected error - check server logs');
    });

    it('should return exact fallback message for null input', () => {
      // Arrange
      const nullInput = null;

      // Act
      const result = convertErrorToUserMessage(nullInput);

      // Assert - EXACT string match
      expect(result).toBe('Unexpected error - check server logs');
    });

    it('should return exact fallback message for undefined input', () => {
      // Arrange
      const undefinedInput = undefined;

      // Act
      const result = convertErrorToUserMessage(undefinedInput);

      // Assert - EXACT string match
      expect(result).toBe('Unexpected error - check server logs');
    });
  });

  describe('Character-Level Validation of Predefined Messages', () => {
    it('should validate exact character count and content for bot permission message', () => {
      // Arrange
      const error = new Error('Bot lacks permission');
      const expectedMessage = 'Bot needs "View Server Members" permission';

      // Act
      const result = convertErrorToUserMessage(error);

      // Assert - Character-level validation
      expect(result).toBe(expectedMessage);
      expect(result.length).toBe(expectedMessage.length);
      expect(result.includes('"View Server Members"')).toBe(true);
      expect(result.startsWith('Bot needs')).toBe(true);
      expect(result.endsWith('permission')).toBe(true);
    });

    it('should validate exact character content for Google Sheets configuration message', () => {
      // Arrange
      const error = new Error('authentication failed');
      const expectedMessage = 'Google Sheets configuration error';

      // Act
      const result = convertErrorToUserMessage(error);

      // Assert - Character-level validation
      expect(result).toBe(expectedMessage);
      expect(result.length).toBe(expectedMessage.length);
      expect(result.includes('Google Sheets')).toBe(true);
      expect(result.includes('configuration')).toBe(true);
      expect(result.includes('error')).toBe(true);
    });

    it('should validate exact character content for Discord service message', () => {
      // Arrange
      const error = new Error('Discord API error');
      const expectedMessage = 'Discord service temporarily unavailable';

      // Act
      const result = convertErrorToUserMessage(error);

      // Assert - Character-level validation
      expect(result).toBe(expectedMessage);
      expect(result.length).toBe(expectedMessage.length);
      expect(result.includes('Discord service')).toBe(true);
      expect(result.includes('temporarily')).toBe(true);
      expect(result.includes('unavailable')).toBe(true);
    });

    it('should validate exact character content for member access message', () => {
      // Arrange
      const error = new Error('Failed to fetch members');
      const expectedMessage = 'Could not access Discord server members';

      // Act
      const result = convertErrorToUserMessage(error);

      // Assert - Character-level validation
      expect(result).toBe(expectedMessage);
      expect(result.length).toBe(expectedMessage.length);
      expect(result.startsWith('Could not access')).toBe(true);
      expect(result.includes('Discord server members')).toBe(true);
    });

    it('should validate exact character content for sheets update message', () => {
      // Arrange
      const error = new Error('Failed to append members');
      const expectedMessage = 'Could not update Google Sheets';

      // Act
      const result = convertErrorToUserMessage(error);

      // Assert - Character-level validation
      expect(result).toBe(expectedMessage);
      expect(result.length).toBe(expectedMessage.length);
      expect(result.startsWith('Could not update')).toBe(true);
      expect(result.includes('Google Sheets')).toBe(true);
    });

    it('should validate exact character content for fallback message', () => {
      // Arrange
      const error = new Error('unknown error type');
      const expectedMessage = 'Unexpected error - check server logs';

      // Act
      const result = convertErrorToUserMessage(error);

      // Assert - Character-level validation
      expect(result).toBe(expectedMessage);
      expect(result.length).toBe(expectedMessage.length);
      expect(result.includes('Unexpected error')).toBe(true);
      expect(result.includes(' - ')).toBe(true);
      expect(result.includes('check server logs')).toBe(true);
    });
  });

  describe('Message Immutability and Consistency', () => {
    it('should return the same exact message for identical inputs', () => {
      // Arrange
      const error = new Error('Bot lacks permission');

      // Act - Multiple calls
      const result1 = convertErrorToUserMessage(error);
      const result2 = convertErrorToUserMessage(error);
      const result3 = convertErrorToUserMessage(error);

      // Assert - Consistent exact results
      expect(result1).toBe('Bot needs "View Server Members" permission');
      expect(result2).toBe('Bot needs "View Server Members" permission');
      expect(result3).toBe('Bot needs "View Server Members" permission');
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('should maintain message immutability across different error instances', () => {
      // Arrange - Different Error instances with same message
      const error1 = new Error('authentication failed');
      const error2 = new Error('authentication failed');

      // Act
      const result1 = convertErrorToUserMessage(error1);
      const result2 = convertErrorToUserMessage(error2);

      // Assert - Exact consistency
      expect(result1).toBe('Google Sheets configuration error');
      expect(result2).toBe('Google Sheets configuration error');
      expect(result1).toBe(result2);
    });
  });

  describe('Flow 3 Specification Compliance', () => {
    it('should ensure all 6 predefined messages are user-friendly and actionable', () => {
      // Arrange - Error types that map to each predefined message
      const errorScenarios = [
        {
          input: new Error('Bot lacks permission'),
          expected: 'Bot needs "View Server Members" permission',
        },
        {
          input: new Error('authentication failed'),
          expected: 'Google Sheets configuration error',
        },
        {
          input: new Error('Discord API error'),
          expected: 'Discord service temporarily unavailable',
        },
        {
          input: new Error('Failed to fetch members'),
          expected: 'Could not access Discord server members',
        },
        {
          input: new Error('Failed to append members'),
          expected: 'Could not update Google Sheets',
        },
        { input: new Error('unknown'), expected: 'Unexpected error - check server logs' },
      ];

      // Act & Assert - Validate Flow 3 compliance
      for (const scenario of errorScenarios) {
        const result = convertErrorToUserMessage(scenario.input);

        // EXACT message validation
        expect(result).toBe(scenario.expected);

        // Flow 3 requirements: user-friendly, actionable, no technical details
        expect(result).not.toContain('Error:');
        expect(result).not.toContain('Exception');
        expect(result).not.toContain('Stack trace');
        expect(result).not.toContain('undefined');
        expect(result).not.toContain('null');

        // Must be a complete sentence or phrase
        expect(result.length).toBeGreaterThan(10);
        expect(typeof result).toBe('string');
      }
    });

    it('should ensure no message contains technical implementation details', () => {
      // Arrange - Various technical errors that should be sanitized
      const technicalErrors = [
        'Bot lacks permission: TypeError in fetchMembers()',
        'authentication failed: JWT token expired at line 42',
        'Discord API error: HTTP 503 with stack trace',
        'Failed to fetch members: Database connection timeout',
        'Failed to append members: Google Sheets API quota exceeded',
      ];

      // Act & Assert - Ensure technical details are hidden
      for (const technicalError of technicalErrors) {
        const error = new Error(technicalError);
        const result = convertErrorToUserMessage(error);

        // Should not contain technical details
        expect(result).not.toContain('TypeError');
        expect(result).not.toContain('line 42');
        expect(result).not.toContain('HTTP 503');
        expect(result).not.toContain('Database connection');
        expect(result).not.toContain('API quota');
        expect(result).not.toContain('stack trace');

        // Should be one of the 6 predefined user-friendly messages
        const validMessages = [
          'Bot needs "View Server Members" permission',
          'Google Sheets configuration error',
          'Discord service temporarily unavailable',
          'Could not access Discord server members',
          'Could not update Google Sheets',
          'Unexpected error - check server logs',
        ];

        expect(validMessages).toContain(result);
      }
    });
  });
});
