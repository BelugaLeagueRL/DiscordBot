/**
 * Tests for Google Sheets operations
 * Ensures proper authentication, client setup, and basic operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from '../../../../index';
import {
  createSheetsClient,
  getExistingUserIds,
  validateCredentials,
  type GoogleSheetsCredentials,
  type SheetsClient,
} from '../../../../application_commands/google-sheets/admin-sync-users-to-sheets/sheets-operations';

// Mock Google Sheets API response
const mockSheetsResponse = {
  data: {
    values: [
      ['discord_id'], // Header row
      ['123456789012345678'],
      ['987654321098765432'],
      ['111222333444555666'],
    ],
  },
};

describe('Google Sheets Operations', () => {
  const mockEnv: Env = {
    DISCORD_TOKEN: 'test-token',
    DISCORD_PUBLIC_KEY: 'test-key',
    DISCORD_APPLICATION_ID: 'test-app-id',
    DATABASE_URL: 'test-db',
    GOOGLE_SHEETS_API_KEY: 'test-api-key',
    GOOGLE_SHEET_ID: '1o_gBgb1k16IF3EfzyJ8EJ4qUGm5Ph2x5TzZAyOUmwek',
    ENVIRONMENT: 'test',
    REGISTER_COMMAND_REQUEST_CHANNEL_ID: '1111111111111111111',
    REGISTER_COMMAND_RESPONSE_CHANNEL_ID: '2222222222222222222',
    TEST_CHANNEL_ID: '1388177835331424386',
    PRIVILEGED_USER_ID: '354474826192388127',
  } as const;

  const mockCredentials: GoogleSheetsCredentials = {
    type: 'service_account',
    project_id: 'test-project-123',
    private_key_id: 'test-key-id',
    private_key: '-----BEGIN PRIVATE KEY-----\nTEST_PRIVATE_KEY\n-----END PRIVATE KEY-----',
    client_email: 'test@test-project.iam.gserviceaccount.com',
    client_id: '123456789012345678901',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url:
      'https://www.googleapis.com/robot/v1/metadata/x509/test%40test-project.iam.gserviceaccount.com',
    universe_domain: 'googleapis.com',
  } as const;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateCredentials', () => {
    it('should return valid=true for properly formatted service account credentials', () => {
      // Arrange
      const credentials = mockCredentials;

      // Act
      const result = validateCredentials(credentials);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return valid=false for missing required fields', () => {
      // Arrange
      const invalidCredentials = {
        ...mockCredentials,
        client_email: '',
      } as GoogleSheetsCredentials;

      // Act
      const result = validateCredentials(invalidCredentials);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing required field: client_email');
    });

    it('should return valid=false for invalid private key format', () => {
      // Arrange
      const invalidCredentials = {
        ...mockCredentials,
        private_key: 'invalid-key-format',
      } as GoogleSheetsCredentials;

      // Act
      const result = validateCredentials(invalidCredentials);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid private key format');
    });

    it('should return valid=false for wrong credential type', () => {
      // Arrange
      const invalidCredentials = {
        ...mockCredentials,
        type: 'user_account',
      } as unknown as GoogleSheetsCredentials;

      // Act
      const result = validateCredentials(invalidCredentials);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid credential type. Expected service_account');
    });
  });

  describe('createSheetsClient', () => {
    it('should create authenticated sheets client with valid credentials', () => {
      // Arrange
      const credentials = mockCredentials;

      // Act
      const result = createSheetsClient(credentials);

      // Assert
      expect(result.success).toBe(true);
      expect(result.client).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should return error for invalid credentials', () => {
      // Arrange
      const invalidCredentials = {
        ...mockCredentials,
        private_key: 'invalid-key',
      } as GoogleSheetsCredentials;

      // Act
      const result = createSheetsClient(invalidCredentials);

      // Assert
      expect(result.success).toBe(false);
      expect(result.client).toBeUndefined();
      expect(result.error).toBeDefined();
    });

    it('should handle authentication errors gracefully', () => {
      // Arrange
      const credentials = {
        ...mockCredentials,
        client_email: 'nonexistent@invalid.com',
      } as GoogleSheetsCredentials;

      // Act
      const result = createSheetsClient(credentials);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication failed');
    });
  });

  describe('getExistingUserIds', () => {
    const mockClient: SheetsClient = {
      spreadsheets: {
        values: {
          get: vi.fn(),
        },
      },
    } as unknown as SheetsClient;

    it('should return set of existing Discord user IDs', async () => {
      // Arrange
      const sheetId = mockEnv.GOOGLE_SHEET_ID;
      if (sheetId === undefined) throw new Error('Test setup error: GOOGLE_SHEET_ID required');
      vi.mocked(mockClient.spreadsheets.values.get).mockResolvedValue(mockSheetsResponse);

      // Act
      const result = await getExistingUserIds(sheetId, mockClient);

      // Assert
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(3);
      expect(result.has('123456789012345678')).toBe(true);
      expect(result.has('987654321098765432')).toBe(true);
      expect(result.has('111222333444555666')).toBe(true);
    });

    it('should handle empty sheet gracefully', async () => {
      // Arrange
      const sheetId = mockEnv.GOOGLE_SHEET_ID;
      if (sheetId === undefined) throw new Error('Test setup error: GOOGLE_SHEET_ID required');
      const emptyResponse = { data: { values: [['discord_id']] } }; // Only header
      vi.mocked(mockClient.spreadsheets.values.get).mockResolvedValue(emptyResponse);

      // Act
      const result = await getExistingUserIds(sheetId, mockClient);

      // Assert
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });

    it('should handle missing data gracefully', async () => {
      // Arrange
      const sheetId = mockEnv.GOOGLE_SHEET_ID;
      if (sheetId === undefined) throw new Error('Test setup error: GOOGLE_SHEET_ID required');
      const emptyResponse = { data: {} };
      vi.mocked(mockClient.spreadsheets.values.get).mockResolvedValue(emptyResponse);

      // Act
      const result = await getExistingUserIds(sheetId, mockClient);

      // Assert
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });

    it('should filter out invalid Discord IDs', async () => {
      // Arrange
      const sheetId = mockEnv.GOOGLE_SHEET_ID;
      if (sheetId === undefined) throw new Error('Test setup error: GOOGLE_SHEET_ID required');
      const responseWithInvalidIds = {
        data: {
          values: [
            ['discord_id'],
            ['123456789012345678'], // Valid
            [''], // Empty
            ['invalid-id'], // Invalid format
            ['987654321098765432'], // Valid
            [undefined], // Undefined
          ],
        },
      };
      vi.mocked(mockClient.spreadsheets.values.get).mockResolvedValue(responseWithInvalidIds);

      // Act
      const result = await getExistingUserIds(sheetId, mockClient);

      // Assert
      expect(result.size).toBe(2);
      expect(result.has('123456789012345678')).toBe(true);
      expect(result.has('987654321098765432')).toBe(true);
      expect(result.has('')).toBe(false);
      expect(result.has('invalid-id')).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      const sheetId = mockEnv.GOOGLE_SHEET_ID;
      if (sheetId === undefined) throw new Error('Test setup error: GOOGLE_SHEET_ID required');
      const apiError = new Error('API rate limit exceeded');
      vi.mocked(mockClient.spreadsheets.values.get).mockRejectedValue(apiError);

      // Act & Assert
      await expect(getExistingUserIds(sheetId, mockClient)).rejects.toThrow(
        'Failed to fetch existing user IDs: API rate limit exceeded'
      );
    });

    it('should use correct range for user ID column', async () => {
      // Arrange
      const sheetId = mockEnv.GOOGLE_SHEET_ID;
      if (sheetId === undefined) throw new Error('Test setup error: GOOGLE_SHEET_ID required');
      vi.mocked(mockClient.spreadsheets.values.get).mockResolvedValue(mockSheetsResponse);

      // Act
      await getExistingUserIds(sheetId, mockClient);

      // Assert
      expect(mockClient.spreadsheets.values.get).toHaveBeenCalledWith({
        spreadsheetId: sheetId,
        range: 'Users!A:A', // Column A contains discord_id
      });
    });
  });

  describe('error handling and edge cases', () => {
    it('should validate Discord ID format correctly', () => {
      // Test cases for Discord ID validation
      const validIds = ['123456789012345678', '987654321098765432'];
      const invalidIds = ['123', 'abc123', '', '12345678901234567890123']; // Too short, non-numeric, empty, too long

      validIds.forEach(id => {
        expect(id).toMatch(/^\d{17,19}$/);
      });

      invalidIds.forEach(id => {
        expect(id).not.toMatch(/^\d{17,19}$/);
      });
    });

    it('should handle network timeouts gracefully', async () => {
      // Arrange
      const mockClient: SheetsClient = {
        spreadsheets: {
          values: {
            get: vi.fn().mockRejectedValue(new Error('Network timeout')),
          },
        },
      } as unknown as SheetsClient;

      // Act & Assert
      await expect(getExistingUserIds('test-sheet', mockClient)).rejects.toThrow(
        'Failed to fetch existing user IDs: Network timeout'
      );
    });
  });
});
