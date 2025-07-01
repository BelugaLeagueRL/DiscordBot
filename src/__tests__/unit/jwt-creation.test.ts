/**
 * Unit tests for JWT creation functionality
 * Testing Google OAuth JWT creation following TDD Red-Green-Refactor
 */

import { describe, it, expect } from 'vitest';
import { TestDataBuilders } from '../helpers/test-builders';
import { createJWT } from '../../utils/google-sheets-builder';

describe('JWT Creation - Unit Tests', () => {
  describe('createJWT', () => {
    it('should create valid JWT with proper credentials and configuration', () => {
      // Arrange
      const validCredentials = TestDataBuilders.validCredentials().build();
      const validConfig = TestDataBuilders.validJwtConfig().build();
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

    it('should reject credentials with invalid email format', () => {
      // Arrange
      const invalidCredentials = TestDataBuilders.invalidCredentials().build();
      const validConfig = TestDataBuilders.validJwtConfig().build();

      // Act
      const result = createJWT(invalidCredentials, validConfig);

      // Assert - Focus on behavior: JWT creation fails for invalid credentials
      expect(result.success).toBe(false);
    });

    it('should reject credentials with invalid private key', () => {
      // Arrange
      const invalidCredentials = TestDataBuilders.validCredentials()
        .withInvalidPrivateKey()
        .build();
      const validConfig = TestDataBuilders.validJwtConfig().build();

      // Act
      const result = createJWT(invalidCredentials, validConfig);

      // Assert - Focus on behavior: JWT creation fails for invalid credentials
      expect(result.success).toBe(false);
    });

    it('should reject credentials with empty fields', () => {
      // Arrange
      const invalidCredentials = TestDataBuilders.emptyCredentials().build();
      const validConfig = TestDataBuilders.validJwtConfig().build();

      // Act
      const result = createJWT(invalidCredentials, validConfig);

      // Assert - Focus on behavior: JWT creation fails for invalid credentials
      expect(result.success).toBe(false);
    });

    it('should reject invalid JWT configuration', () => {
      // Testing the behavioral requirement: invalid configuration causes failure
      const validCredentials = TestDataBuilders.validCredentials().build();
      const invalidConfig = TestDataBuilders.invalidJwtConfig().build();

      // Act
      const result = createJWT(validCredentials, invalidConfig);

      // Assert - Focus on behavior: JWT creation fails for invalid configuration
      expect(result.success).toBe(false);
    });

    it('should handle cryptographic errors gracefully', () => {
      // Testing the behavioral requirement: cryptographic failures are handled properly
      const malformedCredentials = TestDataBuilders.validCredentials()
        .withMalformedPrivateKey()
        .build();
      const validConfig = TestDataBuilders.validJwtConfig().build();

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
