/**
 * Unit tests for OAuth flow validation functionality
 * Testing Google OAuth token flow validation following TDD Red-Green-Refactor
 */

import { describe, it, expect } from 'vitest';
import { TestDataBuilders } from '../helpers/test-builders';
import {
  validateOAuthTokenResponse,
  validateOAuthRequestParams,
} from '../../utils/google-sheets-builder';

describe('OAuth Flow Validation - Unit Tests', () => {
  describe('validateOAuthTokenResponse', () => {
    it('should validate valid OAuth token response successfully', () => {
      // Arrange
      const validResponse = TestDataBuilders.validOAuthResponse().build();

      // Act
      const result = validateOAuthTokenResponse(validResponse);

      // Assert - Focus on behavior: validation succeeds for valid response
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.access_token).toBe('ya29.mock_oauth_token_test');
        expect(result.data.expires_in).toBe(3600);
        expect(result.data.token_type).toBe('Bearer');
      }
    });

    it('should reject OAuth token response with missing access token', () => {
      // Arrange
      const invalidResponse = TestDataBuilders.invalidOAuthResponse().build();
      // Act
      const result = validateOAuthTokenResponse(invalidResponse);

      // Assert - Focus on behavior: validation fails for invalid responses
      expect(result.success).toBe(false);
    });

    it('should reject OAuth token response with invalid expires_in', () => {
      // Arrange
      const invalidResponse = TestDataBuilders.validOAuthResponse().withInvalidExpiresIn().build();
      // Act
      const result = validateOAuthTokenResponse(invalidResponse);

      // Assert - Focus on behavior: validation fails for invalid responses
      expect(result.success).toBe(false);
    });

    it('should reject OAuth error responses', () => {
      // Arrange
      const errorResponse = TestDataBuilders.oauthErrorResponse().build();

      // Act
      const result = validateOAuthTokenResponse(errorResponse);

      // Assert - Focus on behavior: validation fails for invalid responses
      expect(result.success).toBe(false);
    });

    it('should handle null responses gracefully', () => {
      // Arrange

      // Act
      const result = validateOAuthTokenResponse(null as any);

      // Assert - Focus on behavior: validation fails gracefully
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      }
    });

    it('should handle undefined responses gracefully', () => {
      // Arrange

      // Act
      const result = validateOAuthTokenResponse(undefined as any);

      // Assert - Focus on behavior: validation fails gracefully
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      }
    });

    it('should handle non-object responses gracefully', () => {
      // Arrange

      // Act
      const result = validateOAuthTokenResponse('not-an-object' as any);

      // Assert - Focus on behavior: validation fails gracefully
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      }
    });
  });

  describe('validateOAuthRequestParams', () => {
    it('should validate OAuth request parameters correctly', () => {
      // Testing the behavioral requirement: valid request parameters pass validation
      const validParams = TestDataBuilders.validOAuthParams().build();
      // Act
      const result = validateOAuthRequestParams(validParams);

      // Assert - Focus on behavior: validation succeeds for valid parameters
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.grant_type).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');
        expect(result.data.assertion).toContain('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9');
      }
    });

    it('should reject OAuth request parameters with missing assertion', () => {
      // Arrange
      const invalidParams = TestDataBuilders.invalidOAuthParams().build();
      // Act
      const result = validateOAuthRequestParams(invalidParams);

      // Assert - Focus on behavior: validation fails for invalid parameters
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      }
    });

    it('should reject OAuth request parameters with wrong grant type', () => {
      // Arrange
      const invalidParams = TestDataBuilders.validOAuthParams().withWrongGrantType().build();
      // Act
      const result = validateOAuthRequestParams(invalidParams);

      // Assert - Focus on behavior: validation fails for invalid parameters
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      }
    });
  });
});
