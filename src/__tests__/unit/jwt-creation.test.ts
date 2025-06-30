/**
 * Unit tests for JWT creation functionality
 * Testing Google OAuth JWT creation following TDD Red-Green-Refactor
 */

import { describe, it, expect } from 'vitest';

// Object Mother pattern for JWT test data
const JwtMother = {
  // Valid Google service account credentials
  validCredentials() {
    return {
      client_email: 'test-service@test-project.iam.gserviceaccount.com',
      private_key:
        '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC1234567890...\n-----END PRIVATE KEY-----\n',
    };
  },

  // Credentials with invalid email format
  invalidEmailCredentials() {
    return {
      client_email: 'not-an-email',
      private_key:
        '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC1234567890...\n-----END PRIVATE KEY-----\n',
    };
  },

  // Credentials with invalid private key format
  invalidKeyCredentials() {
    return {
      client_email: 'test-service@test-project.iam.gserviceaccount.com',
      private_key: 'not-a-valid-private-key',
    };
  },

  // Credentials with empty fields
  emptyFieldsCredentials() {
    return {
      client_email: '',
      private_key: '',
    };
  },

  // Valid JWT configuration
  validJwtConfig() {
    return {
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      iat: Math.floor(Date.now() / 1000),
    };
  },

  // Invalid JWT configuration (missing scope)
  invalidJwtConfig() {
    return {
      scope: '', // Empty scope makes it invalid
      aud: 'https://oauth2.googleapis.com/token',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    };
  },
};

describe('JWT Creation - Unit Tests', () => {
  describe('createJWT', () => {
    it('should create valid JWT with proper credentials and configuration', async () => {
      // Arrange
      const validCredentials = JwtMother.validCredentials();
      const validConfig = JwtMother.validJwtConfig();
      const { createJWT } = await import('../../utils/google-sheets-builder');

      // Act
      const result = createJWT(validCredentials, validConfig);

      // Assert - Focus on behavior: JWT creation succeeds
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(typeof result.data).toBe('string');
        expect(result.data.split('.').length).toBe(3); // JWT has 3 parts
      }
    });

    it('should reject invalid credentials', async () => {
      // Testing the behavioral requirement: invalid credentials cause failure
      const invalidCredentials = [
        JwtMother.invalidEmailCredentials(),
        JwtMother.invalidKeyCredentials(),
        JwtMother.emptyFieldsCredentials(),
      ];

      const validConfig = JwtMother.validJwtConfig();
      const { createJWT } = await import('../../utils/google-sheets-builder');

      invalidCredentials.forEach(credentials => {
        // Act
        const result = createJWT(credentials, validConfig);

        // Assert - Focus on behavior: JWT creation fails for invalid credentials
        expect(result.success).toBe(false);
      });
    });

    it('should reject invalid JWT configuration', async () => {
      // Testing the behavioral requirement: invalid configuration causes failure
      const validCredentials = JwtMother.validCredentials();
      const invalidConfig = JwtMother.invalidJwtConfig();
      const { createJWT } = await import('../../utils/google-sheets-builder');

      // Act
      const result = createJWT(validCredentials, invalidConfig);

      // Assert - Focus on behavior: JWT creation fails for invalid configuration
      expect(result.success).toBe(false);
    });

    it('should handle cryptographic errors gracefully', async () => {
      // Testing the behavioral requirement: cryptographic failures are handled properly
      const validCredentials = JwtMother.validCredentials();
      const validConfig = JwtMother.validJwtConfig();

      // Modify credentials to cause crypto error
      const malformedCredentials = {
        ...validCredentials,
        private_key: '-----BEGIN PRIVATE KEY-----\nINVALID_KEY_DATA\n-----END PRIVATE KEY-----\n',
      };

      const { createJWT } = await import('../../utils/google-sheets-builder');

      // Act
      const result = createJWT(malformedCredentials, validConfig);

      // Assert - Focus on behavior: JWT creation fails gracefully
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      }
    });
  });
});
