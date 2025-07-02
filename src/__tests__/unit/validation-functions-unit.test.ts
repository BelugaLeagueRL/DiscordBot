/**
 * UNIT TESTS: Individual validation function testing
 * Following test pyramid best practices - testing each function in isolation
 * Unit tests should be: Fast, Independent, Repeatable, Self-validating, Timely
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from '../../index';
import type { DiscordInteraction } from '../../types/discord';

// Import individual functions for isolated unit testing
import {
  validateBasics,
  extractUserId,
  validateUserAndEnvironment,
  validateExecutionContext,
  validateInteractionStructure,
  validateChannelPermissions,
} from '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler';

describe('Individual Validation Function Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateExecutionContext Unit Tests', () => {
    it('should return success for valid context with waitUntil method', () => {
      // Arrange
      const validContext = {
        waitUntil: vi.fn(),
        passThroughOnException: vi.fn(),
      };

      // Act
      const result = validateExecutionContext(validContext);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(validContext);
      }
    });

    it('should return failure for null context', () => {
      // Arrange
      const nullContext = null;

      // Act
      const result = validateExecutionContext(nullContext);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Execution context not available');
      }
    });

    it('should return failure for undefined context', () => {
      // Arrange
      const undefinedContext = undefined;

      // Act
      const result = validateExecutionContext(undefinedContext);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Execution context not available');
      }
    });

    it('should return failure for context missing waitUntil method', () => {
      // Arrange
      const invalidContext = {
        passThroughOnException: vi.fn(),
        // waitUntil missing
      };

      // Act
      const result = validateExecutionContext(invalidContext);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Execution context missing required methods');
      }
    });

    it('should return failure for context with non-function waitUntil', () => {
      // Arrange
      const invalidContext = {
        waitUntil: 'not a function',
        passThroughOnException: vi.fn(),
      };

      // Act
      const result = validateExecutionContext(invalidContext);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Execution context missing required methods');
      }
    });
  });

  describe('validateInteractionStructure Unit Tests', () => {
    it('should return success for valid interaction structure', () => {
      // Arrange
      const validInteraction = {
        id: 'interaction-123',
        application_id: 'app-456',
        type: 2,
        data: { id: 'cmd-1', name: 'test', type: 1 },
      };

      // Act
      const result = validateInteractionStructure(validInteraction);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(validInteraction);
      }
    });

    it('should return failure for null interaction', () => {
      // Arrange
      const nullInteraction = null;

      // Act
      const result = validateInteractionStructure(nullInteraction);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid interaction format');
      }
    });

    it('should return failure for undefined interaction', () => {
      // Arrange
      const undefinedInteraction = undefined;

      // Act
      const result = validateInteractionStructure(undefinedInteraction);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid interaction format');
      }
    });

    it('should return failure for non-object interaction', () => {
      // Arrange
      const primitiveInteraction = 'not an object';

      // Act
      const result = validateInteractionStructure(primitiveInteraction);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid interaction format');
      }
    });

    it('should return failure for interaction with empty id', () => {
      // Arrange
      const invalidInteraction = {
        id: '',
        application_id: 'app-456',
        type: 2,
      };

      // Act
      const result = validateInteractionStructure(invalidInteraction);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid interaction format');
      }
    });

    it('should return failure for interaction with non-string application_id', () => {
      // Arrange
      const invalidInteraction = {
        id: 'interaction-123',
        application_id: null,
        type: 2,
      };

      // Act
      const result = validateInteractionStructure(invalidInteraction);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid interaction format');
      }
    });
  });

  describe('extractUserId Unit Tests', () => {
    it('should extract user ID from interaction.user when available', () => {
      // Arrange
      const interaction = {
        user: { id: 'user-123' },
        member: { user: { id: 'member-456' } },
      } as any;

      // Act
      const result = extractUserId(interaction);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('user-123');
      }
    });

    it('should extract user ID from interaction.member.user when user field is missing', () => {
      // Arrange
      const interaction = {
        user: undefined,
        member: { user: { id: 'member-456' } },
      } as any;

      // Act
      const result = extractUserId(interaction);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('member-456');
      }
    });

    it('should return failure when both user sources are missing', () => {
      // Arrange
      const interaction = {
        user: undefined,
        member: undefined,
      } as any;

      // Act
      const result = extractUserId(interaction);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('User information not available');
      }
    });

    it('should return failure when user ID is empty string', () => {
      // Arrange
      const interaction = {
        user: { id: '' },
        member: undefined,
      } as any;

      // Act
      const result = extractUserId(interaction);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('User information not available');
      }
    });

    it('should return failure when member user ID is empty string', () => {
      // Arrange
      const interaction = {
        user: undefined,
        member: { user: { id: '' } },
      } as any;

      // Act
      const result = extractUserId(interaction);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('User information not available');
      }
    });
  });

  describe('validateChannelPermissions Unit Tests', () => {
    const validEnv: Env = {
      TEST_CHANNEL_ID: 'channel-123',
      PRIVILEGED_USER_ID: 'user-456',
    } as Env;

    it('should return success for valid guild, channel, and user', () => {
      // Arrange
      const interaction = {
        guild_id: 'guild-789',
        channel_id: 'channel-123',
        user: { id: 'user-456' },
      } as any;

      // Act
      const result = validateChannelPermissions(interaction, validEnv);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('should return failure when guild_id is missing', () => {
      // Arrange
      const interaction = {
        guild_id: undefined,
        channel_id: 'channel-123',
        user: { id: 'user-456' },
      } as any;

      // Act
      const result = validateChannelPermissions(interaction, validEnv);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('This command can only be used in a Discord server');
      }
    });

    it('should return failure when guild_id is empty string', () => {
      // Arrange
      const interaction = {
        guild_id: '',
        channel_id: 'channel-123',
        user: { id: 'user-456' },
      } as any;

      // Act
      const result = validateChannelPermissions(interaction, validEnv);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('This command can only be used in a Discord server');
      }
    });

    it('should return failure when channel does not match TEST_CHANNEL_ID', () => {
      // Arrange
      const interaction = {
        guild_id: 'guild-789',
        channel_id: 'wrong-channel',
        user: { id: 'user-456' },
      } as any;

      // Act
      const result = validateChannelPermissions(interaction, validEnv);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('This command can only be used in the designated admin channel');
      }
    });

    it('should return failure when user is not privileged', () => {
      // Arrange
      const interaction = {
        guild_id: 'guild-789',
        channel_id: 'channel-123',
        user: { id: 'unauthorized-user' },
      } as any;

      // Act
      const result = validateChannelPermissions(interaction, validEnv);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Insufficient permissions for this admin command');
      }
    });

    it('should extract user ID from member when user field is missing', () => {
      // Arrange
      const interaction = {
        guild_id: 'guild-789',
        channel_id: 'channel-123',
        user: undefined,
        member: { user: { id: 'user-456' } },
      } as any;

      // Act
      const result = validateChannelPermissions(interaction, validEnv);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });
  });

  describe('validateBasics Unit Tests', () => {
    const validContext = {
      waitUntil: vi.fn(),
      passThroughOnException: vi.fn(),
    };

    const validInteraction: DiscordInteraction = {
      id: 'interaction-123',
      application_id: 'app-456',
      type: 2,
      data: { id: 'cmd-1', name: 'test', type: 1 },
      token: 'token-123',
      version: 1,
    };

    it('should return success for valid interaction and context', () => {
      // Act
      const result = validateBasics(validInteraction, validContext);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.extendedInteraction).toBeDefined();
        expect(result.data.validatedContext).toBe(validContext);
      }
    });

    it('should return failure when context validation fails', () => {
      // Arrange
      const invalidContext = null;

      // Act
      const result = validateBasics(validInteraction, invalidContext as any);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Execution context not available');
      }
    });

    it('should return failure when interaction validation fails', () => {
      // Arrange
      const invalidInteraction = null;

      // Act
      const result = validateBasics(invalidInteraction as any, validContext);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid interaction format');
      }
    });

    it('should return failure when interaction data is missing', () => {
      // Arrange
      const interactionWithoutData = {
        ...validInteraction,
        data: undefined,
      } as any;

      // Act
      const result = validateBasics(interactionWithoutData, validContext);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid command data');
      }
    });
  });

  describe('validateUserAndEnvironment Unit Tests', () => {
    const validEnv: Env = {
      GOOGLE_SHEET_ID: 'sheet-123',
      TEST_CHANNEL_ID: 'channel-123',
      PRIVILEGED_USER_ID: 'user-456',
    } as Env;

    const validInteraction = {
      guild_id: 'guild-789',
      channel_id: 'channel-123',
      user: { id: 'user-456' },
    } as any;

    it('should return success for valid user and environment', () => {
      // Act
      const result = validateUserAndEnvironment(validInteraction, validEnv);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('user-456');
      }
    });

    it('should return failure when user ID extraction fails', () => {
      // Arrange
      const interactionWithoutUser = {
        ...validInteraction,
        user: undefined,
        member: undefined,
      };

      // Act
      const result = validateUserAndEnvironment(interactionWithoutUser, validEnv);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('User information not available');
      }
    });

    it('should return failure when GOOGLE_SHEET_ID is missing', () => {
      // Arrange
      const envWithoutSheetId = {
        ...validEnv,
        GOOGLE_SHEET_ID: '',
      };

      // Act
      const result = validateUserAndEnvironment(validInteraction, envWithoutSheetId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Missing required environment configuration');
      }
    });

    it('should return failure when GOOGLE_SHEET_ID is undefined', () => {
      // Arrange
      const envWithoutSheetId = {
        ...validEnv,
        GOOGLE_SHEET_ID: undefined,
      } as any;

      // Act
      const result = validateUserAndEnvironment(validInteraction, envWithoutSheetId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Missing required environment configuration');
      }
    });

    it('should return failure when channel permissions fail', () => {
      // Arrange
      const interactionWithWrongChannel = {
        ...validInteraction,
        channel_id: 'wrong-channel',
      };

      // Act
      const result = validateUserAndEnvironment(interactionWithWrongChannel, validEnv);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('This command can only be used in the designated admin channel');
      }
    });
  });
});
