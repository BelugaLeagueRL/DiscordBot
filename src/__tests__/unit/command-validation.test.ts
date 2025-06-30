/**
 * Unit tests for command validation functions
 * Testing granular validation logic following TDD Red-Green-Refactor
 */

import { describe, it, expect } from 'vitest';

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
    it('should validate credentials with required fields', async () => {
      // Arrange
      const validCredentials = CredentialsMother.validCredentials();
      const { validateCredentials } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler'
      );

      // Act
      const result = validateCredentials(validCredentials);

      // Assert
      expect(result).toEqual({ isValid: true });
    });

    it('should reject null credentials', async () => {
      // Arrange
      const credentials = CredentialsMother.nullCredentials();
      const { validateCredentials } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler'
      );

      // Act
      const result = validateCredentials(credentials as any);

      // Assert
      expect(result).toEqual({ isValid: false });
    });

    it('should reject undefined credentials', async () => {
      // Arrange
      const credentials = CredentialsMother.undefinedCredentials();
      const { validateCredentials } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler'
      );

      // Act
      const result = validateCredentials(credentials as any);

      // Assert
      expect(result).toEqual({ isValid: false });
    });

    it('should reject credentials with empty client_email', async () => {
      // Arrange
      const credentials = CredentialsMother.emptyClientEmail();
      const { validateCredentials } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler'
      );

      // Act
      const result = validateCredentials(credentials);

      // Assert
      expect(result).toEqual({ isValid: false });
    });

    it('should reject credentials missing client_email', async () => {
      // Arrange
      const credentials = CredentialsMother.missingClientEmail();
      const { validateCredentials } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler'
      );

      // Act
      const result = validateCredentials(credentials as any);

      // Assert
      expect(result).toEqual({ isValid: false });
    });

    it('should reject credentials with empty private_key', async () => {
      // Arrange
      const credentials = CredentialsMother.emptyPrivateKey();
      const { validateCredentials } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler'
      );

      // Act
      const result = validateCredentials(credentials);

      // Assert
      expect(result).toEqual({ isValid: false });
    });

    it('should reject credentials missing private_key', async () => {
      // Arrange
      const credentials = CredentialsMother.missingPrivateKey();
      const { validateCredentials } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler'
      );

      // Act
      const result = validateCredentials(credentials as any);

      // Assert
      expect(result).toEqual({ isValid: false });
    });
  });
});
