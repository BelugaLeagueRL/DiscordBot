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
    describe('Bot Permission Message Validation', () => {
      const error = new Error('Bot lacks permission');
      const expectedMessage = 'Bot needs "View Server Members" permission';

      it('should return exact bot permission message', () => {
        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result).toBe(expectedMessage);
      });

      it('should have correct character count for bot permission message', () => {
        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result.length).toBe(expectedMessage.length);
      });

      it('should include quoted View Server Members text', () => {
        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result.includes('"View Server Members"')).toBe(true);
      });

      it('should start with Bot needs prefix', () => {
        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result.startsWith('Bot needs')).toBe(true);
      });

      it('should end with permission suffix', () => {
        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result.endsWith('permission')).toBe(true);
      });
    });

    describe('Google Sheets Configuration Message Validation', () => {
      const error = new Error('authentication failed');
      const expectedMessage = 'Google Sheets configuration error';

      it('should return exact Google Sheets configuration message', () => {
        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result).toBe(expectedMessage);
      });

      it('should have correct character count for Google Sheets message', () => {
        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result.length).toBe(expectedMessage.length);
      });

      it('should include Google Sheets text', () => {
        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result.includes('Google Sheets')).toBe(true);
      });

      it('should include configuration text', () => {
        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result.includes('configuration')).toBe(true);
      });

      it('should include error text', () => {
        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result.includes('error')).toBe(true);
      });
    });

    describe('Discord Service Message Validation', () => {
      const error = new Error('Discord API error');
      const expectedMessage = 'Discord service temporarily unavailable';

      it('should return exact Discord service message', () => {
        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result).toBe(expectedMessage);
      });

      it('should have correct character count for Discord service message', () => {
        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result.length).toBe(expectedMessage.length);
      });

      it('should include Discord service text', () => {
        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result.includes('Discord service')).toBe(true);
      });

      it('should include temporarily text', () => {
        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result.includes('temporarily')).toBe(true);
      });

      it('should include unavailable text', () => {
        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result.includes('unavailable')).toBe(true);
      });
    });

    describe('Member Access Message Validation', () => {
      const error = new Error('Failed to fetch members');
      const expectedMessage = 'Could not access Discord server members';

      it('should return exact member access message', () => {
        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result).toBe(expectedMessage);
      });

      it('should have correct character count for member access message', () => {
        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result.length).toBe(expectedMessage.length);
      });

      it('should start with Could not access prefix', () => {
        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result.startsWith('Could not access')).toBe(true);
      });

      it('should include Discord server members text', () => {
        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result.includes('Discord server members')).toBe(true);
      });
    });

    describe('Sheets Update Message Validation', () => {
      const error = new Error('Failed to append members');
      const expectedMessage = 'Could not update Google Sheets';

      it('should return exact sheets update message', () => {
        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result).toBe(expectedMessage);
      });

      it('should have correct character count for sheets update message', () => {
        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result.length).toBe(expectedMessage.length);
      });

      it('should start with Could not update prefix', () => {
        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result.startsWith('Could not update')).toBe(true);
      });

      it('should include Google Sheets text', () => {
        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result.includes('Google Sheets')).toBe(true);
      });
    });

    describe('Fallback Message Validation', () => {
      const error = new Error('unknown error type');
      const expectedMessage = 'Unexpected error - check server logs';

      it('should return exact fallback message', () => {
        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result).toBe(expectedMessage);
      });

      it('should have correct character count for fallback message', () => {
        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result.length).toBe(expectedMessage.length);
      });

      it('should include Unexpected error text', () => {
        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result.includes('Unexpected error')).toBe(true);
      });

      it('should include separator dash', () => {
        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result.includes(' - ')).toBe(true);
      });

      it('should include check server logs text', () => {
        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result.includes('check server logs')).toBe(true);
      });
    });
  });

  describe('Message Immutability and Consistency', () => {
    describe('Identical Input Consistency', () => {
      const error = new Error('Bot lacks permission');
      const expectedMessage = 'Bot needs "View Server Members" permission';

      it('should return exact message on first call', () => {
        // Act
        const result1 = convertErrorToUserMessage(error);

        // Assert
        expect(result1).toBe(expectedMessage);
      });

      it('should return exact message on second call', () => {
        // Act
        const result2 = convertErrorToUserMessage(error);

        // Assert
        expect(result2).toBe(expectedMessage);
      });

      it('should return exact message on third call', () => {
        // Act
        const result3 = convertErrorToUserMessage(error);

        // Assert
        expect(result3).toBe(expectedMessage);
      });

      it('should return consistent results across multiple calls', () => {
        // Act
        const result1 = convertErrorToUserMessage(error);
        const result2 = convertErrorToUserMessage(error);

        // Assert
        expect(result1).toBe(result2);
      });

      it('should maintain consistency across three calls', () => {
        // Act
        const result1 = convertErrorToUserMessage(error);
        const result2 = convertErrorToUserMessage(error);
        const result3 = convertErrorToUserMessage(error);

        // Assert
        expect(result1).toBe(result2);
        expect(result2).toBe(result3);
      });
    });

    describe('Different Error Instance Consistency', () => {
      const expectedMessage = 'Google Sheets configuration error';

      it('should return exact message for first error instance', () => {
        // Arrange
        const error1 = new Error('authentication failed');

        // Act
        const result1 = convertErrorToUserMessage(error1);

        // Assert
        expect(result1).toBe(expectedMessage);
      });

      it('should return exact message for second error instance', () => {
        // Arrange
        const error2 = new Error('authentication failed');

        // Act
        const result2 = convertErrorToUserMessage(error2);

        // Assert
        expect(result2).toBe(expectedMessage);
      });

      it('should maintain consistency across different error instances', () => {
        // Arrange
        const error1 = new Error('authentication failed');
        const error2 = new Error('authentication failed');

        // Act
        const result1 = convertErrorToUserMessage(error1);
        const result2 = convertErrorToUserMessage(error2);

        // Assert
        expect(result1).toBe(result2);
      });
    });
  });

  describe('Flow 3 Specification Compliance', () => {
    describe('Exact Message Validation', () => {
      it('should return exact message for bot permission error', () => {
        // Act
        const result = convertErrorToUserMessage(new Error('Bot lacks permission'));

        // Assert
        expect(result).toBe('Bot needs "View Server Members" permission');
      });

      it('should return exact message for authentication error', () => {
        // Act
        const result = convertErrorToUserMessage(new Error('authentication failed'));

        // Assert
        expect(result).toBe('Google Sheets configuration error');
      });

      it('should return exact message for Discord API error', () => {
        // Act
        const result = convertErrorToUserMessage(new Error('Discord API error'));

        // Assert
        expect(result).toBe('Discord service temporarily unavailable');
      });

      it('should return exact message for member fetch error', () => {
        // Act
        const result = convertErrorToUserMessage(new Error('Failed to fetch members'));

        // Assert
        expect(result).toBe('Could not access Discord server members');
      });

      it('should return exact message for append members error', () => {
        // Act
        const result = convertErrorToUserMessage(new Error('Failed to append members'));

        // Assert
        expect(result).toBe('Could not update Google Sheets');
      });

      it('should return exact message for unknown error', () => {
        // Act
        const result = convertErrorToUserMessage(new Error('unknown'));

        // Assert
        expect(result).toBe('Unexpected error - check server logs');
      });
    });

    describe('Technical Detail Exclusion', () => {
      it('should not contain Error: prefix in any message', () => {
        // Act & Assert
        expect(convertErrorToUserMessage(new Error('Bot lacks permission'))).not.toContain(
          'Error:'
        );
        expect(convertErrorToUserMessage(new Error('authentication failed'))).not.toContain(
          'Error:'
        );
        expect(convertErrorToUserMessage(new Error('Discord API error'))).not.toContain('Error:');
      });

      it('should not contain Exception text in any message', () => {
        // Act & Assert
        expect(convertErrorToUserMessage(new Error('Bot lacks permission'))).not.toContain(
          'Exception'
        );
        expect(convertErrorToUserMessage(new Error('authentication failed'))).not.toContain(
          'Exception'
        );
        expect(convertErrorToUserMessage(new Error('Discord API error'))).not.toContain(
          'Exception'
        );
      });

      it('should not contain Stack trace text in any message', () => {
        // Act & Assert
        expect(convertErrorToUserMessage(new Error('Bot lacks permission'))).not.toContain(
          'Stack trace'
        );
        expect(convertErrorToUserMessage(new Error('authentication failed'))).not.toContain(
          'Stack trace'
        );
        expect(convertErrorToUserMessage(new Error('Discord API error'))).not.toContain(
          'Stack trace'
        );
      });

      it('should not contain undefined text in any message', () => {
        // Act & Assert
        expect(convertErrorToUserMessage(new Error('Bot lacks permission'))).not.toContain(
          'undefined'
        );
        expect(convertErrorToUserMessage(new Error('authentication failed'))).not.toContain(
          'undefined'
        );
        expect(convertErrorToUserMessage(new Error('Discord API error'))).not.toContain(
          'undefined'
        );
      });

      it('should not contain null text in any message', () => {
        // Act & Assert
        expect(convertErrorToUserMessage(new Error('Bot lacks permission'))).not.toContain('null');
        expect(convertErrorToUserMessage(new Error('authentication failed'))).not.toContain('null');
        expect(convertErrorToUserMessage(new Error('Discord API error'))).not.toContain('null');
      });
    });

    describe('Message Format Requirements', () => {
      it('should have meaningful length for all error types', () => {
        // Act & Assert
        expect(convertErrorToUserMessage(new Error('Bot lacks permission')).length).toBeGreaterThan(
          10
        );
        expect(
          convertErrorToUserMessage(new Error('authentication failed')).length
        ).toBeGreaterThan(10);
        expect(convertErrorToUserMessage(new Error('Discord API error')).length).toBeGreaterThan(
          10
        );
        expect(convertErrorToUserMessage(new Error('unknown')).length).toBeGreaterThan(10);
      });

      it('should be string type for all error types', () => {
        // Act & Assert
        expect(typeof convertErrorToUserMessage(new Error('Bot lacks permission'))).toBe('string');
        expect(typeof convertErrorToUserMessage(new Error('authentication failed'))).toBe('string');
        expect(typeof convertErrorToUserMessage(new Error('Discord API error'))).toBe('string');
        expect(typeof convertErrorToUserMessage(new Error('unknown'))).toBe('string');
      });
    });

    describe('Technical Implementation Detail Sanitization', () => {
      it('should not contain TypeError in technical error messages', () => {
        // Arrange
        const error1 = new Error('Bot lacks permission: TypeError in fetchMembers()');
        const error2 = new Error('authentication failed: JWT token expired at line 42');

        // Act & Assert
        expect(convertErrorToUserMessage(error1)).not.toContain('TypeError');
        expect(convertErrorToUserMessage(error2)).not.toContain('TypeError');
      });

      it('should not contain line numbers in technical error messages', () => {
        // Arrange
        const error = new Error('authentication failed: JWT token expired at line 42');

        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result).not.toContain('line 42');
      });

      it('should not contain HTTP status codes in technical error messages', () => {
        // Arrange
        const error = new Error('Discord API error: HTTP 503 with stack trace');

        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result).not.toContain('HTTP 503');
      });

      it('should not contain database details in technical error messages', () => {
        // Arrange
        const error = new Error('Failed to fetch members: Database connection timeout');

        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result).not.toContain('Database connection');
      });

      it('should not contain API quota details in technical error messages', () => {
        // Arrange
        const error = new Error('Failed to append members: Google Sheets API quota exceeded');

        // Act
        const result = convertErrorToUserMessage(error);

        // Assert
        expect(result).not.toContain('API quota');
      });

      it('should not contain stack trace in technical error messages', () => {
        // Arrange
        const error1 = new Error('Discord API error: HTTP 503 with stack trace');
        const error2 = new Error('Failed to append members: Google Sheets API quota exceeded');

        // Act & Assert
        expect(convertErrorToUserMessage(error1)).not.toContain('stack trace');
        expect(convertErrorToUserMessage(error2)).not.toContain('stack trace');
      });

      it('should return predefined user-friendly messages for technical errors', () => {
        // Arrange
        const validMessages = [
          'Bot needs "View Server Members" permission',
          'Google Sheets configuration error',
          'Discord service temporarily unavailable',
          'Could not access Discord server members',
          'Could not update Google Sheets',
          'Unexpected error - check server logs',
        ];

        // Act & Assert
        expect(validMessages).toContain(
          convertErrorToUserMessage(new Error('Bot lacks permission: TypeError in fetchMembers()'))
        );
        expect(validMessages).toContain(
          convertErrorToUserMessage(
            new Error('authentication failed: JWT token expired at line 42')
          )
        );
        expect(validMessages).toContain(
          convertErrorToUserMessage(new Error('Discord API error: HTTP 503 with stack trace'))
        );
        expect(validMessages).toContain(
          convertErrorToUserMessage(
            new Error('Failed to fetch members: Database connection timeout')
          )
        );
        expect(validMessages).toContain(
          convertErrorToUserMessage(
            new Error('Failed to append members: Google Sheets API quota exceeded')
          )
        );
      });
    });
  });
});
