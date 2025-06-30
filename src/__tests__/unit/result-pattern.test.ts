/**
 * Unit tests for Result pattern implementation
 * Testing generic Result pattern utilities following TDD Red-Green-Refactor
 */

import { describe, it, expect } from 'vitest';

// Object Mother pattern for Result pattern test data
const ResultPatternMother = {
  // Successful result with string data
  successResultString() {
    return {
      success: true as const,
      data: 'test-data-string',
    };
  },

  // Successful result with object data
  successResultObject() {
    return {
      success: true as const,
      data: {
        id: 'test-123',
        name: 'Test Object',
        value: 42,
      },
    };
  },

  // Error result with string error
  errorResultString() {
    return {
      success: false as const,
      error: 'Test error message',
    };
  },

  // Error result with detailed error object
  errorResultDetailed() {
    return {
      success: false as const,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: ['Field is required', 'Invalid format'],
      },
    };
  },

  // Array of mixed results for testing
  mixedResultsArray() {
    return [
      { success: true as const, data: 'result1' },
      { success: false as const, error: 'error1' },
      { success: true as const, data: 'result2' },
      { success: false as const, error: 'error2' },
    ];
  },

  // Sample async operation that might fail
  sampleAsyncOperation(shouldSucceed: boolean) {
    return Promise.resolve(
      shouldSucceed
        ? { success: true as const, data: 'async-success' }
        : { success: false as const, error: 'async-error' }
    );
  },
};

describe('Result Pattern Implementation - Unit Tests', () => {
  describe('mapResult', () => {
    it('should transform successful result data while preserving success state', async () => {
      // Arrange
      const successResult = ResultPatternMother.successResultString();
      const { mapResult } = await import('../../utils/google-sheets-builder');

      // Act
      const result = mapResult(successResult, (data: string) => data.toUpperCase());

      // Assert - Focus on behavior: transformation preserves success and transforms data
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('TEST-DATA-STRING');
      }
    });

    it('should pass through error results without transformation', async () => {
      // Testing the behavioral requirement: errors bypass transformation
      const errorResult = ResultPatternMother.errorResultString();
      const { mapResult } = await import('../../utils/google-sheets-builder');

      // Act
      const result = mapResult(errorResult, (data: unknown) => `transformed-${String(data)}`);

      // Assert - Focus on behavior: error results pass through unchanged
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Test error message');
      }
    });
  });

  describe('combineResults', () => {
    it('should combine multiple successful results into array', async () => {
      // Testing the behavioral requirement: all success results combine into data array
      const results = [
        ResultPatternMother.successResultString(),
        { success: true as const, data: 'second-item' },
      ];
      const { combineResults } = await import('../../utils/google-sheets-builder');

      // Act
      const result = combineResults(results);

      // Assert - Focus on behavior: successful combination creates array of data
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['test-data-string', 'second-item']);
        expect(result.data.length).toBe(2);
      }
    });

    it('should return first error when any result fails', async () => {
      // Testing the behavioral requirement: first error short-circuits combination
      const mixedResults = ResultPatternMother.mixedResultsArray();
      const { combineResults } = await import('../../utils/google-sheets-builder');

      // Act
      const result = combineResults(mixedResults);

      // Assert - Focus on behavior: first error terminates combination
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('error1'); // First error in the array
      }
    });
  });
});
