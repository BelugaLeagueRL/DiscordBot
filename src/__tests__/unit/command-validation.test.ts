/**
 * Unit tests for command validation functions
 * Testing granular validation logic following TDD Red-Green-Refactor
 */

import { describe, it, expect } from 'vitest';
import {
  validateCredentials,
  buildCredentialsObject,
} from '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler';

// Object Mother pattern for Google Sheets credentials test data
const CredentialsMother = {
  // Valid credentials
  validCredentials() {
    return {
      client_email: 'test@example.com',
      private_key:
        '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB\n-----END PRIVATE KEY-----',
    };
  },

  // Null credentials
  nullCredentials() {
    return null;
  },

  // Undefined credentials
  undefinedCredentials() {
    return undefined;
  },

  // Credentials with empty client_email
  emptyClientEmail() {
    return {
      client_email: '',
      private_key: '-----BEGIN PRIVATE KEY-----\nvalid-key\n-----END PRIVATE KEY-----',
    };
  },

  // Credentials missing client_email
  missingClientEmail() {
    return {
      private_key: '-----BEGIN PRIVATE KEY-----\nvalid-key\n-----END PRIVATE KEY-----',
    };
  },

  // Credentials with empty private_key
  emptyPrivateKey() {
    return {
      client_email: 'test@example.com',
      private_key: '',
    };
  },

  // Credentials missing private_key
  missingPrivateKey() {
    return {
      client_email: 'test@example.com',
    };
  },
};

describe('Command Validation Functions - Unit Tests', () => {
  describe('validateCredentials', () => {
    it('should validate credentials with required fields', () => {
      // Arrange
      const validCredentials = CredentialsMother.validCredentials();
      // Act
      const result = validateCredentials(validCredentials);

      // Assert
      expect(result).toEqual({ isValid: true });
    });

    it('should reject null credentials', () => {
      // Arrange
      const credentials = CredentialsMother.nullCredentials();

      // Act
      const result = validateCredentials(credentials as any);

      // Assert
      expect(result).toEqual({ isValid: false });
    });

    it('should reject undefined credentials', () => {
      // Arrange
      const credentials = CredentialsMother.undefinedCredentials();

      // Act
      const result = validateCredentials(credentials as any);

      // Assert
      expect(result).toEqual({ isValid: false });
    });

    it('should reject credentials with empty client_email', () => {
      // Arrange
      const credentials = CredentialsMother.emptyClientEmail();

      // Act
      const result = validateCredentials(credentials);

      // Assert
      expect(result).toEqual({ isValid: false });
    });

    it('should reject credentials missing client_email', () => {
      // Arrange
      const credentials = CredentialsMother.missingClientEmail();

      // Act
      const result = validateCredentials(credentials as any);

      // Assert
      expect(result).toEqual({ isValid: false });
    });

    it('should reject credentials with empty private_key', () => {
      // Arrange
      const credentials = CredentialsMother.emptyPrivateKey();

      // Act
      const result = validateCredentials(credentials);

      // Assert
      expect(result).toEqual({ isValid: false });
    });

    it('should reject credentials missing private_key', () => {
      // Arrange
      const credentials = CredentialsMother.missingPrivateKey();

      // Act
      const result = validateCredentials(credentials as any);

      // Assert
      expect(result).toEqual({ isValid: false });
    });
  });

  describe('buildCredentialsObject', () => {
    it('should build credentials object from environment variables', () => {
      // Arrange
      const mockEnv = {
        GOOGLE_SHEETS_CLIENT_EMAIL: 'test@serviceaccount.com',
        GOOGLE_SHEETS_PRIVATE_KEY:
          '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB\n-----END PRIVATE KEY-----',
      };

      // Act
      const result = buildCredentialsObject(mockEnv as any);

      // Assert
      expect(result).toEqual({
        client_email: 'test@serviceaccount.com',
        private_key:
          '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB\n-----END PRIVATE KEY-----',
      });
    });

    it('should build credentials object with type assertions for required fields', () => {
      // Testing that the function properly extracts and type-asserts environment variables

      // Arrange
      const mockEnv = {
        GOOGLE_SHEETS_CLIENT_EMAIL: 'another@serviceaccount.com',
        GOOGLE_SHEETS_PRIVATE_KEY:
          '-----BEGIN PRIVATE KEY-----\nAnotherPrivateKeyContent\n-----END PRIVATE KEY-----',
        GOOGLE_SHEETS_TYPE: 'service_account', // Extra field that might exist
        GOOGLE_SHEETS_PROJECT_ID: 'test-project', // Extra field that might exist
      };

      // Act
      const result = buildCredentialsObject(mockEnv as any);

      // Assert
      expect(result).toEqual({
        client_email: 'another@serviceaccount.com',
        private_key:
          '-----BEGIN PRIVATE KEY-----\nAnotherPrivateKeyContent\n-----END PRIVATE KEY-----',
      });

      // Should only extract the required fields
      expect(Object.keys(result)).toHaveLength(2);
    });
  });
});
