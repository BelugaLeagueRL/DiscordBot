/**
 * Unit tests for index.ts error paths and branch coverage
 * Following TDD Red-Green-Refactor cycle
 * Target: Lines 173, 288-337, 663 for 80%+ branch coverage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted for proper mock hoisting (2025 best practice)
const mockVerifyKey = vi.hoisted(() => vi.fn());
const mockGoogleSheetsBuilder = vi.hoisted(() => ({
  GoogleSheetsApiBuilder: {
    create: vi.fn(),
  },
  GoogleOAuthBuilder: {
    create: vi.fn(),
  },
}));

// Mock dependencies with proper hoisting
vi.mock('discord-interactions', () => ({
  verifyKey: mockVerifyKey,
}));

vi.mock('../../utils/google-sheets-builder', () => mockGoogleSheetsBuilder);

import type { Env } from '../../index';
import indexHandler from '../../index';

describe('index.ts error paths for coverage', () => {
  let mockEnv: Env;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyKey.mockResolvedValue(true);

    mockEnv = {
      DISCORD_TOKEN: 'test-token',
      DISCORD_PUBLIC_KEY: 'test-public-key',
      DISCORD_APPLICATION_ID: 'test-app-id',
      GOOGLE_SHEETS_API_KEY: 'test-api-key',
      GOOGLE_SHEET_ID: 'test-sheet-id',
      GOOGLE_SHEETS_CLIENT_EMAIL: 'test@example.com',
      GOOGLE_SHEETS_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n',
      ENVIRONMENT: 'test',
    } as Env;

    mockContext = {
      waitUntil: vi.fn(),
      passThroughOnException: vi.fn(),
    } as unknown as ExecutionContext;
  });

  describe('handleTestSheetsRead error path (Line 173)', () => {
    it('should return error response with correct headers when Google Sheets API fails (Line 173)', async () => {
      // Arrange - Mock Google Sheets API to throw error
      mockGoogleSheetsBuilder.GoogleOAuthBuilder.create.mockImplementation(() => {
        throw new Error('Google Sheets API failure');
      });

      const request = new Request('https://example.com/test-sheets-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      // Act - Execute handler to trigger Line 173 error path
      const response = await indexHandler.fetch(request, mockEnv, mockContext);

      // Assert - Verify Line 173 headers are set correctly
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(500);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const responseData = await response.json();
      expect(responseData).toEqual({
        success: false,
        error: 'Google Sheets API failure',
      });
    });
  });

  describe('handleTestSheetsWrite function (Lines 288-337)', () => {
    it('should handle successful Google Sheets write operation (Lines 288-337)', async () => {
      // Arrange - Mock successful Google Sheets API
      const mockResult = { success: true, updatedRows: 1 };
      const mockApiBuilder = {
        setSpreadsheetId: vi.fn().mockReturnThis(),
        setRange: vi.fn().mockReturnThis(),
        setAccessToken: vi.fn().mockReturnThis(),
        addRow: vi.fn().mockReturnThis(),
        append: vi.fn().mockResolvedValue(mockResult),
      };
      const mockOAuthBuilder = {
        setCredentials: vi.fn().mockReturnThis(),
        getAccessToken: vi.fn().mockResolvedValue('mock-access-token'),
      };

      mockGoogleSheetsBuilder.GoogleSheetsApiBuilder.create.mockReturnValue(mockApiBuilder);
      mockGoogleSheetsBuilder.GoogleOAuthBuilder.create.mockReturnValue(mockOAuthBuilder);

      // Mock createMemberRow function
      vi.doMock('../../utils/google-sheets-builder', () => ({
        ...mockGoogleSheetsBuilder,
        createMemberRow: vi
          .fn()
          .mockReturnValue(['test-id', 'test-display', 'test-actual', '2023-01-01', false, true]),
      }));

      const testData = {
        discord_id: 'test-discord-id',
        discord_username_display: 'TestUser',
        discord_username_actual: 'testuser#1234',
        server_join_date: '2023-01-01T00:00:00Z',
        is_banned: false,
        is_active: true,
      };

      const request = new Request('https://example.com/test-sheets-write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testData }),
      });

      // Act - Execute handler to cover Lines 288-337
      const response = await indexHandler.fetch(request, mockEnv, mockContext);

      // Assert - Verify successful response covering all lines 288-337
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const responseData = await response.json();
      expect(responseData).toEqual({
        success: true,
        rowsWritten: 1,
        testData: ['test-id', 'test-display', 'test-actual', '2023-01-01', false, true],
      });

      // Verify the Google Sheets API calls were made correctly (Lines 296-298, 310-316)
      expect(mockOAuthBuilder.setCredentials).toHaveBeenCalled();
      expect(mockOAuthBuilder.getAccessToken).toHaveBeenCalled();
      expect(mockApiBuilder.setSpreadsheetId).toHaveBeenCalledWith('test-sheet-id');
      expect(mockApiBuilder.setRange).toHaveBeenCalledWith('A:G');
      expect(mockApiBuilder.setAccessToken).toHaveBeenCalledWith('mock-access-token');
      expect(mockApiBuilder.append).toHaveBeenCalled();
    });

    it('should handle invalid test data format (Line 284)', async () => {
      // Arrange - Invalid test data
      const invalidTestData = {
        discord_id: 'test-id',
        // Missing required fields
      };

      const request = new Request('https://example.com/test-sheets-write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testData: invalidTestData }),
      });

      // Act - Execute handler
      const response = await indexHandler.fetch(request, mockEnv, mockContext);

      // Assert - Verify error response for invalid data
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(400);

      const responseText = await response.text();
      expect(responseText).toBe('Invalid test data format');
    });
  });

  describe('global error fallback (Line 663)', () => {
    it('should use formatGlobalErrorMessage when audit context unavailable', async () => {
      // Arrange - Force error during initializeRequest before audit/context are assigned
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Create a request with invalid URL to make new URL(request.url) throw on Line 522
      const requestWithInvalidUrl = {
        method: 'POST',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        url: 'invalid-url-format', // This will cause new URL() to throw
        json: vi.fn().mockResolvedValue({}),
        clone: vi.fn().mockReturnThis(),
        body: '{}',
      } as unknown as Request;

      // Act - This should trigger the global catch block with undefined audit context
      const response = await indexHandler.fetch(requestWithInvalidUrl, mockEnv, mockContext);

      // Assert - Verify Line 663 behavior: audit and context are undefined
      expect(response.status).toBe(500);
      expect(await response.text()).toBe('Internal server error');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Global error (no audit context):')
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('handleTestSheetsDelete function (Lines 182-241)', () => {
    it('should handle successful Google Sheets delete operation (Lines 217-226)', async () => {
      // Arrange - Mock successful Google Sheets API for delete operation
      const mockResult = { success: true, deletedRowsCount: 2 };
      const mockApiBuilder = {
        setSpreadsheetId: vi.fn().mockReturnThis(),
        setRange: vi.fn().mockReturnThis(),
        setAccessToken: vi.fn().mockReturnThis(),
        deleteRowsByDiscordId: vi.fn().mockResolvedValue(mockResult),
      };
      const mockOAuthBuilder = {
        setCredentials: vi.fn().mockReturnThis(),
        getAccessToken: vi.fn().mockResolvedValue('mock-access-token'),
      };

      mockGoogleSheetsBuilder.GoogleSheetsApiBuilder.create.mockReturnValue(mockApiBuilder);
      mockGoogleSheetsBuilder.GoogleOAuthBuilder.create.mockReturnValue(mockOAuthBuilder);

      const testDiscordId = 'test-discord-123';
      const request = new Request('https://example.com/test-sheets-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordId: testDiscordId }),
      });

      // Act - Execute handler to cover Lines 217-226 success path
      const response = await indexHandler.fetch(request, mockEnv, mockContext);

      // Assert - Verify successful response covering Lines 217-226
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const responseData = await response.json();
      expect(responseData).toEqual({
        success: true,
        deletedRowsCount: 2,
        discordId: testDiscordId,
      });

      // Verify the Google Sheets API calls were made correctly
      expect(mockOAuthBuilder.setCredentials).toHaveBeenCalled();
      expect(mockOAuthBuilder.getAccessToken).toHaveBeenCalled();
      expect(mockApiBuilder.setSpreadsheetId).toHaveBeenCalledWith('test-sheet-id');
      expect(mockApiBuilder.setRange).toHaveBeenCalledWith('A:G');
      expect(mockApiBuilder.setAccessToken).toHaveBeenCalledWith('mock-access-token');
      expect(mockApiBuilder.deleteRowsByDiscordId).toHaveBeenCalledWith(testDiscordId);
    });

    it('should handle Google Sheets delete API failure (Lines 227-240)', async () => {
      // Arrange - Mock Google Sheets API to throw error during delete
      mockGoogleSheetsBuilder.GoogleOAuthBuilder.create.mockImplementation(() => {
        throw new Error('Google Sheets delete API failure');
      });

      const testDiscordId = 'test-discord-456';
      const request = new Request('https://example.com/test-sheets-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordId: testDiscordId }),
      });

      // Act - Execute handler to trigger Lines 227-240 error path
      const response = await indexHandler.fetch(request, mockEnv, mockContext);

      // Assert - Verify Lines 227-240 error response
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(500);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const responseData = await response.json();
      expect(responseData).toEqual({
        success: false,
        error: 'Google Sheets delete API failure',
      });
    });
  });
});
