/**
 * Unit tests for credential-related functions in admin-sync-users-to-sheets
 * Tests buildCredentialsObject function (Lines 439-444)
 * Following TDD Red-Green-Refactor with anti-pattern prevention
 */

import { describe, it, expect } from 'vitest';
import type { Env } from '../../../../index';
import { buildCredentialsObject } from '../../../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler';

describe('Credential Functions', () => {
  describe('buildCredentialsObject function behavior (Lines 439-444)', () => {
    it('should build credentials object with client_email and private_key from environment', () => {
      // Arrange - Create environment with Google Sheets credentials
      const mockEnv = {
        GOOGLE_SHEETS_CLIENT_EMAIL: 'test@serviceaccount.com',
        GOOGLE_SHEETS_PRIVATE_KEY:
          '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n',
        GOOGLE_SHEETS_TYPE: 'service_account',
        GOOGLE_SHEETS_PROJECT_ID: 'project-123',
        GOOGLE_SHEETS_PRIVATE_KEY_ID: 'key-id-123',
        GOOGLE_SHEETS_CLIENT_ID: 'client-123',
      } as Env;

      // Act - Call buildCredentialsObject function directly
      const result = buildCredentialsObject(mockEnv);

      // Assert - Focus on specific credential object structure (Lines 440-443)
      expect(result).toEqual({
        client_email: 'test@serviceaccount.com',
        private_key: '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n',
      });
      expect(result.client_email).toBe('test@serviceaccount.com'); // Verify client_email mapping (Line 441)
      expect(result.private_key).toBe(
        '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n'
      ); // Verify private_key mapping (Line 442)
    });
  });
});
