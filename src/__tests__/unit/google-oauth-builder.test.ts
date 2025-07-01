/**
 * Unit tests for GoogleOAuthBuilder class in google-sheets-builder.ts
 * Tests OAuth credential setting and token generation (Lines 684-734)
 * Following TDD Red-Green-Refactor with anti-pattern prevention
 */

import { describe, it, expect, vi } from 'vitest';
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

  describe('getAccessToken method behavior (Lines 695-729)', () => {
    it('should successfully generate OAuth access token when credentials are valid', async () => {
      // Arrange - Mock JWT library and fetch for OAuth success flow
      const mockJwtSign = vi.fn().mockResolvedValue('mock-jwt-token');
      const mockJwtLibrary = { default: { sign: mockJwtSign } };

      // Mock dynamic import of JWT library (Line 700)
      vi.doMock('@tsndr/cloudflare-worker-jwt', () => mockJwtLibrary);

      // Mock fetch for OAuth token exchange (Lines 714-721)
      const mockOAuthResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          access_token: 'ya29.mock-access-token',
          expires_in: 3600,
          token_type: 'Bearer',
        }),
      };
      global.fetch = vi.fn().mockResolvedValue(mockOAuthResponse);

      // Valid credentials for OAuth flow
      const validCredentials: GoogleSheetsCredentials = {
        client_email: 'test@serviceaccount.com',
        private_key: '-----BEGIN PRIVATE KEY-----\nvalid-key-content\n-----END PRIVATE KEY-----\n',
      };

      // Act - Create builder, set credentials, and get access token
      const builder = new GoogleOAuthBuilder();
      builder.setCredentials(validCredentials);
      const accessToken = await builder.getAccessToken();

      // Assert - Verify OAuth success flow (Lines 695-729)
      expect(mockJwtSign).toHaveBeenCalledWith(
        expect.objectContaining({
          iss: 'test@serviceaccount.com',
          scope: 'https://www.googleapis.com/auth/spreadsheets',
          aud: 'https://accounts.google.com/o/oauth2/token',
          exp: expect.any(Number),
          iat: expect.any(Number),
        }),
        validCredentials.private_key,
        { algorithm: 'RS256' }
      );

      expect(global.fetch).toHaveBeenCalledWith(
        'https://accounts.google.com/o/oauth2/token',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: expect.any(URLSearchParams),
        })
      );

      expect(accessToken).toBe('ya29.mock-access-token');
    });
  });
});
