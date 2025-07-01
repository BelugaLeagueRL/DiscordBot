/**
 * Unit tests for mapResult function error handling in google-sheets-builder.ts
 * Testing Lines 655-656 error path following TDD Red-Green-Refactor
 */

import { describe, it, expect } from 'vitest';
import { mapResult } from '../../utils/google-sheets-builder';
import type { JwtResult } from '../../utils/google-sheets-builder';

describe('mapResult error handling (Lines 655-656)', () => {
  it('should return error result when transformation function throws exception (Line 655-656)', () => {
    // Arrange - Create successful result and failing transformation
    const successResult: JwtResult<string> = {
      success: true,
      data: 'test-data',
    };

    const failingTransform = (_data: string): never => {
      throw new Error('Transformation failed');
    };

    // Act - Apply failing transformation to successful result
    const result = mapResult(successResult, failingTransform);

    // Assert - Should catch exception and return error result (Lines 655-656)
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Transformation failed');
    }
  });

  it('should preserve original error when result is already failed', () => {
    // Arrange - Create failed result and transformation that would throw
    const failedResult: JwtResult<string> = {
      success: false,
      error: 'Original error',
    };

    const throwingTransform = (_data: string): string => {
      throw new Error('This should not be called');
    };

    // Act - Apply transformation to failed result
    const result = mapResult(failedResult, throwingTransform);

    // Assert - Should preserve original error without calling transform
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Original error');
    }
  });
});
