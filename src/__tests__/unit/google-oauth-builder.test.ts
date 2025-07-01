/**
 * Unit tests for GoogleOAuthBuilder class in google-sheets-builder.ts
 * Tests OAuth credential setting and token generation (Lines 684-734)
 * Following TDD Red-Green-Refactor with anti-pattern prevention
 */

import { describe, it, expect } from 'vitest';
import { GoogleOAuthBuilder } from '../../utils/google-sheets-builder';
import type { GoogleSheetsCredentials } from '../../utils/google-sheets-builder';

describe('GoogleOAuthBuilder', () => {
  describe('setCredentials method behavior (Lines 690-693)', () => {
    it('should store credentials and return builder instance for method chaining', () => {
      // Arrange - Create valid GoogleSheetsCredentials
      const validCredentials: GoogleSheetsCredentials = {
        client_email: 'test@serviceaccount.com',
        private_key: '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n',
      };

      // Act - Create builder and set credentials
      const builder = new GoogleOAuthBuilder();
      const result = builder.setCredentials(validCredentials);

      // Assert - Focus on credential storage and builder pattern (Lines 691-692)
      expect(result).toBe(builder); // Verify method chaining - returns this (Line 692)

      // Note: We'll verify credential storage indirectly through getAccessToken behavior
      // since credentials property is private. This test establishes the foundation.
      expect(result).toBeInstanceOf(GoogleOAuthBuilder); // Verify return type
    });
  });
});
