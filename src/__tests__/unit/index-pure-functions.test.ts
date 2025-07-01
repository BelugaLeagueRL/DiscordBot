/**
 * TRUE Unit Tests for Pure Functions Extracted from index.ts
 * These test individual functions in complete isolation - no HTTP, no mocks, no side effects
 */

import { describe, it, expect } from 'vitest';
import {
  isValidTestData,
  buildGoogleSheetsCredentials,
  determineRequestHandler,
  buildHealthResponse,
  determineInteractionHandler,
  createSecurityHeaders,
  createCorsHeaders,
  formatErrorResponse,
  formatSuccessResponse,
  createSheetsReadResponseData,
  type TestMemberData,
} from '../../utils/index-functions';
import type { Env } from '../../index';

describe('Pure Functions from index.ts', () => {
  describe('isValidTestData', () => {
    it('should return false for null data', () => {
      expect(isValidTestData(null)).toBe(false);
    });

    it('should return false for non-object data', () => {
      expect(isValidTestData('string')).toBe(false);
      expect(isValidTestData(123)).toBe(false);
      expect(isValidTestData(true)).toBe(false);
      expect(isValidTestData([])).toBe(false);
    });

    it('should return false for incomplete data missing required fields', () => {
      const incompleteData = {
        discord_id: '123456',
        discord_username_display: 'user',
        // Missing other required fields
      };
      expect(isValidTestData(incompleteData)).toBe(false);
    });

    it('should return false when fields have wrong types', () => {
      const wrongTypeData = {
        discord_id: '123456',
        discord_username_display: 'user',
        discord_username_actual: 'user#1234',
        server_join_date: '2023-01-01',
        is_banned: 'false', // Should be boolean
        is_active: true,
      };
      expect(isValidTestData(wrongTypeData)).toBe(false);
    });

    it('should return true for valid complete data', () => {
      const validData: TestMemberData = {
        discord_id: '123456789',
        discord_username_display: 'TestUser',
        discord_username_actual: 'testuser#1234',
        server_join_date: '2023-01-01T00:00:00Z',
        is_banned: false,
        is_active: true,
      };
      expect(isValidTestData(validData)).toBe(true);
    });

    it('should handle edge case values correctly', () => {
      const edgeCaseData: TestMemberData = {
        discord_id: '',
        discord_username_display: '',
        discord_username_actual: '',
        server_join_date: '',
        is_banned: false,
        is_active: false,
      };
      expect(isValidTestData(edgeCaseData)).toBe(true);
    });
  });

  describe('buildGoogleSheetsCredentials', () => {
    it('should extract credentials from environment correctly', () => {
      const mockEnv = {
        GOOGLE_SHEETS_CLIENT_EMAIL: 'test@service.com',
        GOOGLE_SHEETS_PRIVATE_KEY:
          '-----BEGIN PRIVATE KEY-----\\ntest\\n-----END PRIVATE KEY-----\\n',
      } as Env;

      const result = buildGoogleSheetsCredentials(mockEnv);

      expect(result.client_email).toBe('test@service.com');
      expect(result.private_key).toBe(
        '-----BEGIN PRIVATE KEY-----\\ntest\\n-----END PRIVATE KEY-----\\n'
      );
    });

    it('should handle empty credential values', () => {
      const mockEnv = {
        GOOGLE_SHEETS_CLIENT_EMAIL: '',
        GOOGLE_SHEETS_PRIVATE_KEY: '',
      } as Env;

      const result = buildGoogleSheetsCredentials(mockEnv);

      expect(result.client_email).toBe('');
      expect(result.private_key).toBe('');
    });
  });

  describe('determineRequestHandler', () => {
    it('should return cors for OPTIONS method', () => {
      const request = new Request('https://example.com/', { method: 'OPTIONS' });
      expect(determineRequestHandler(request)).toBe('cors');
    });

    it('should return health for GET method', () => {
      const request = new Request('https://example.com/', { method: 'GET' });
      expect(determineRequestHandler(request)).toBe('health');
    });

    it('should return test-sheets for POST to test-sheets endpoints', () => {
      const request1 = new Request('https://example.com/test-sheets-write', { method: 'POST' });
      const request2 = new Request('https://example.com/test-sheets-read', { method: 'POST' });
      const request3 = new Request('https://example.com/test-sheets-delete', { method: 'POST' });

      expect(determineRequestHandler(request1)).toBe('test-sheets');
      expect(determineRequestHandler(request2)).toBe('test-sheets');
      expect(determineRequestHandler(request3)).toBe('test-sheets');
    });

    it('should return discord for POST to root endpoint', () => {
      const request = new Request('https://example.com/', { method: 'POST' });
      expect(determineRequestHandler(request)).toBe('discord');
    });

    it('should return unknown for unsupported methods', () => {
      const request1 = new Request('https://example.com/', { method: 'PUT' });
      const request2 = new Request('https://example.com/', { method: 'DELETE' });
      const request3 = new Request('https://example.com/', { method: 'PATCH' });

      expect(determineRequestHandler(request1)).toBe('unknown');
      expect(determineRequestHandler(request2)).toBe('unknown');
      expect(determineRequestHandler(request3)).toBe('unknown');
    });
  });

  describe('buildHealthResponse', () => {
    it('should build healthy response correctly', () => {
      const timestamp = '2023-01-01T00:00:00Z';
      const checks = { secrets: 'pass', database: 'pass' };

      const result = buildHealthResponse('healthy', timestamp, checks);

      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Beluga Discord Bot is running!');
      expect(result.timestamp).toBe(timestamp);
      expect(result.checks).toEqual(checks);
    });

    it('should build unhealthy response correctly', () => {
      const timestamp = '2023-01-01T00:00:00Z';
      const checks = { secrets: 'fail', database: 'pass' };

      const result = buildHealthResponse('unhealthy', timestamp, checks);

      expect(result.status).toBe('unhealthy');
      expect(result.message).toBe('Beluga Discord Bot has issues');
      expect(result.timestamp).toBe(timestamp);
      expect(result.checks).toEqual(checks);
    });
  });

  describe('determineInteractionHandler', () => {
    it('should return ping for ping interaction', () => {
      const interaction = { type: 1 };
      expect(determineInteractionHandler(interaction)).toBe('ping');
    });

    it('should return command name for application command', () => {
      const interaction = { type: 2, data: { name: 'register' } };
      expect(determineInteractionHandler(interaction)).toBe('register');
    });

    it('should return unknown for application command without name', () => {
      const interaction1 = { type: 2 };
      const interaction2 = { type: 2, data: {} };

      expect(determineInteractionHandler(interaction1)).toBe('unknown');
      expect(determineInteractionHandler(interaction2)).toBe('unknown');
    });

    it('should return unknown for unrecognized interaction types', () => {
      const interaction1 = { type: 999 };
      const interaction2 = { type: 3 }; // MESSAGE_COMPONENT

      expect(determineInteractionHandler(interaction1)).toBe('unknown');
      expect(determineInteractionHandler(interaction2)).toBe('unknown');
    });
  });

  describe('createSecurityHeaders', () => {
    it('should return all required security headers', () => {
      const headers = createSecurityHeaders();

      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-XSS-Protection']).toBe('1; mode=block');
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    });

    it('should return consistent headers on multiple calls', () => {
      const headers1 = createSecurityHeaders();
      const headers2 = createSecurityHeaders();

      expect(headers1).toEqual(headers2);
    });
  });

  describe('createCorsHeaders', () => {
    it('should return all required CORS headers', () => {
      const headers = createCorsHeaders();

      expect(headers['Access-Control-Allow-Origin']).toBe('*');
      expect(headers['Access-Control-Allow-Methods']).toBe('GET, POST, OPTIONS');
      expect(headers['Access-Control-Allow-Headers']).toBe(
        'Content-Type, Authorization, X-Signature-Ed25519, X-Signature-Timestamp'
      );
    });
  });

  describe('formatErrorResponse', () => {
    it('should format error response correctly', () => {
      const result = formatErrorResponse('Something went wrong');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Something went wrong');
    });

    it('should handle empty error message', () => {
      const result = formatErrorResponse('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('');
    });
  });

  describe('formatSuccessResponse', () => {
    it('should format success response with data correctly', () => {
      const data = { users: 10, processed: true };
      const result = formatSuccessResponse(data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
    });

    it('should handle primitive data types', () => {
      const result1 = formatSuccessResponse('success');
      const result2 = formatSuccessResponse(42);
      const result3 = formatSuccessResponse(true);

      expect(result1.data).toBe('success');
      expect(result2.data).toBe(42);
      expect(result3.data).toBe(true);
    });

    it('should handle null and undefined data', () => {
      const result1 = formatSuccessResponse(null);
      const result2 = formatSuccessResponse(undefined);

      expect(result1.success).toBe(true);
      expect(result1.data).toBe(null);
      expect(result2.success).toBe(true);
      expect(result2.data).toBe(undefined);
    });
  });

  describe('createSheetsReadResponseData', () => {
    it('should create response data with correct totalRows calculation (Line 152 logic)', () => {
      // Arrange
      const mockValues = [
        ['Header1', 'Header2'],
        ['Row1Col1', 'Row1Col2'],
      ];

      // Act - Test the pure business logic from Line 152
      const result = createSheetsReadResponseData(mockValues);

      // Assert - Single concern: business logic
      expect(result.totalRows).toBe(2);
      expect(result.success).toBe(true);
      expect(result.values).toEqual(mockValues);
    });

    it('should handle empty values array', () => {
      // Arrange
      const emptyValues: string[][] = [];

      // Act
      const result = createSheetsReadResponseData(emptyValues);

      // Assert
      expect(result.totalRows).toBe(0);
      expect(result.success).toBe(true);
      expect(result.values).toEqual([]);
    });

    it('should handle null values with fallback', () => {
      // Arrange - Test the null coalescing logic from Line 152
      const nullValues = null as any;

      // Act
      const result = createSheetsReadResponseData(nullValues);

      // Assert - Should use fallback behavior
      expect(result.totalRows).toBe(0);
      expect(result.values).toEqual([]);
      expect(result.success).toBe(true);
    });
  });
});
