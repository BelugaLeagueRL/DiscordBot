/**
 * Atomic tests for individual validation functions
 * Each test focuses on one specific validation function in isolation
 */

import { describe, it, expect } from 'vitest';
import {
  validateExecutionContext,
  validateInteractionStructure,
} from '../../../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler';

describe('validateExecutionContext', () => {
  it('should return success for valid execution context', () => {
    // Arrange
    const validContext = {
      waitUntil: (): void => {
        // Mock implementation for testing
      },
      passThroughOnException: (): void => {
        // Mock implementation for testing
      },
    };

    // Act
    const result = validateExecutionContext(validContext);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(validContext);
    }
  });

  it('should return error for null context', () => {
    // Act
    const result = validateExecutionContext(null);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Execution context not available');
    }
  });

  it('should return error for undefined context', () => {
    // Act
    const result = validateExecutionContext(undefined);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Execution context not available');
    }
  });

  it('should return error for context missing waitUntil', () => {
    // Arrange
    const invalidContext = {
      passThroughOnException: (): void => {
        // Mock implementation for testing
      },
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

describe('validateInteractionStructure', () => {
  it('should return success for valid Discord interaction', () => {
    // Arrange
    const validInteraction = {
      id: 'interaction-123',
      application_id: 'app-456',
      type: 2,
      data: {
        id: 'command-789',
        name: 'admin_sync_users_to_sheets',
        type: 1,
      },
      token: 'token-abc',
      version: 1,
    };

    // Act
    const result = validateInteractionStructure(validInteraction);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(validInteraction);
    }
  });

  it('should return error for interaction missing id', () => {
    // Arrange
    const invalidInteraction = {
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

  it('should return error for null interaction', () => {
    // Act
    const result = validateInteractionStructure(null);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid interaction format');
    }
  });

  it('should return error for interaction with empty id', () => {
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
});
