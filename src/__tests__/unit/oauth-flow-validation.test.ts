/**
 * Unit tests for OAuth flow validation functionality
 * Testing Google OAuth token flow validation following TDD Red-Green-Refactor
 */

import { describe, it, expect } from 'vitest';

// Object Mother pattern for OAuth flow test data
const OAuthFlowMother = {
  // Valid OAuth token response
  validTokenResponse() {
    return {
      access_token: 'ya29.c.b0Aaekm1K7-valid-access-token-here',
      expires_in: 3600,
      token_type: 'Bearer',
    };
  },

  // Invalid OAuth token response (missing access_token)
  invalidTokenResponseMissingToken() {
    return {
      expires_in: 3600,
      token_type: 'Bearer',
    };
  },

  // Invalid OAuth token response (invalid expires_in)
  invalidTokenResponseInvalidExpiry() {
    return {
      access_token: 'ya29.c.b0Aaekm1K7-valid-access-token-here',
      expires_in: 'not-a-number',
      token_type: 'Bearer',
    };
  },

  // Error response from OAuth endpoint
  oauthErrorResponse() {
    return {
      error: 'invalid_grant',
      error_description: 'Invalid JWT Signature.',
    };
  },

  // Valid OAuth request parameters
  validOAuthRequestParams() {
    return {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ0ZXN0QGV4YW1wbGUuY29tIiwic2NvcGUiOiJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9hdXRoL3NwcmVhZHNoZWV0cyIsImF1ZCI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbS9vL29hdXRoMi90b2tlbiIsImV4cCI6MTY4NzUzMjAwMCwiaWF0IjoxNjg3NTI4NDAwfQ.mock-signature',
    };
  },

  // Invalid OAuth request parameters (missing assertion)
  invalidOAuthRequestParamsMissingAssertion() {
    return {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    };
  },

  // Invalid OAuth request parameters (wrong grant type)
  invalidOAuthRequestParamsWrongGrantType() {
    return {
      grant_type: 'authorization_code',
      assertion:
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ0ZXN0QGV4YW1wbGUuY29tIiwic2NvcGUiOiJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9hdXRoL3NwcmVhZHNoZWV0cyIsImF1ZCI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbS9vL29hdXRoMi90b2tlbiIsImV4cCI6MTY4NzUzMjAwMCwiaWF0IjoxNjg3NTI4NDAwfQ.mock-signature',
    };
  },
};

describe('OAuth Flow Validation - Unit Tests', () => {
  describe('validateOAuthTokenResponse', () => {
    it('should validate valid OAuth token response successfully', async () => {
      // Arrange
      const validResponse = OAuthFlowMother.validTokenResponse();
      const { validateOAuthTokenResponse } = await import('../../utils/google-sheets-builder');

      // Act
      const result = validateOAuthTokenResponse(validResponse);

      // Assert - Focus on behavior: validation succeeds for valid response
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.access_token).toBe('ya29.c.b0Aaekm1K7-valid-access-token-here');
        expect(result.data.expires_in).toBe(3600);
        expect(result.data.token_type).toBe('Bearer');
      }
    });

    it('should reject invalid OAuth token responses', async () => {
      // Testing the behavioral requirement: invalid responses cause validation failure
      const invalidResponses = [
        OAuthFlowMother.invalidTokenResponseMissingToken(),
        OAuthFlowMother.invalidTokenResponseInvalidExpiry(),
        OAuthFlowMother.oauthErrorResponse(),
      ];

      const { validateOAuthTokenResponse } = await import('../../utils/google-sheets-builder');

      invalidResponses.forEach(response => {
        // Act
        const result = validateOAuthTokenResponse(response);

        // Assert - Focus on behavior: validation fails for invalid responses
        expect(result.success).toBe(false);
      });
    });

    it('should handle null and undefined responses gracefully', async () => {
      // Testing the behavioral requirement: null/undefined responses are handled
      const invalidInputs = [null, undefined, 'not-an-object', 123];
      const { validateOAuthTokenResponse } = await import('../../utils/google-sheets-builder');

      invalidInputs.forEach(input => {
        // Act
        const result = validateOAuthTokenResponse(input as any);

        // Assert - Focus on behavior: validation fails gracefully
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeDefined();
          expect(typeof result.error).toBe('string');
        }
      });
    });
  });

  describe('validateOAuthRequestParams', () => {
    it('should validate OAuth request parameters correctly', async () => {
      // Testing the behavioral requirement: valid request parameters pass validation
      const validParams = OAuthFlowMother.validOAuthRequestParams();
      const { validateOAuthRequestParams } = await import('../../utils/google-sheets-builder');

      // Act
      const result = validateOAuthRequestParams(validParams);

      // Assert - Focus on behavior: validation succeeds for valid parameters
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.grant_type).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');
        expect(result.data.assertion).toContain('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9');
      }
    });

    it('should reject invalid OAuth request parameters', async () => {
      // Testing the behavioral requirement: invalid parameters cause validation failure
      const invalidParams = [
        OAuthFlowMother.invalidOAuthRequestParamsMissingAssertion(),
        OAuthFlowMother.invalidOAuthRequestParamsWrongGrantType(),
      ];

      const { validateOAuthRequestParams } = await import('../../utils/google-sheets-builder');

      invalidParams.forEach(params => {
        // Act
        const result = validateOAuthRequestParams(params);

        // Assert - Focus on behavior: validation fails for invalid parameters
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeDefined();
          expect(typeof result.error).toBe('string');
        }
      });
    });
  });
});
