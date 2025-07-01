/**
 * Unit tests for GoogleSheetsApiBuilder class methods
 * Testing the core Google Sheets API interaction patterns following TDD Red-Green-Refactor
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestDataBuilders } from '../helpers/test-builders';
import { GoogleSheetsApiBuilder } from '../../utils/google-sheets-builder';

describe('GoogleSheetsApiBuilder - Unit Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();
  });

  describe('setSpreadsheetId', () => {
    it('should set the spreadsheet ID and return builder instance for chaining', () => {
      // Arrange
      const builder = GoogleSheetsApiBuilder.create();
      const testId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';

      // Act
      const result = builder.setSpreadsheetId(testId);

      // Assert
      expect(result).toBe(builder); // Should return same instance for chaining
      expect(result).toBeInstanceOf(GoogleSheetsApiBuilder);
    });
  });

  describe('setRange', () => {
    it('should set the range and return builder instance for chaining', () => {
      // Arrange
      const builder = GoogleSheetsApiBuilder.create();
      const testRange = 'Sheet1!A:G';

      // Act
      const result = builder.setRange(testRange);

      // Assert
      expect(result).toBe(builder); // Should return same instance for chaining
      expect(result).toBeInstanceOf(GoogleSheetsApiBuilder);
    });
  });

  describe('setAccessToken', () => {
    it('should set the access token and return builder instance for chaining', () => {
      // Arrange
      const builder = GoogleSheetsApiBuilder.create();
      const testToken = 'ya29.a0AfH6SMBeiGFHJT9k...';

      // Act
      const result = builder.setAccessToken(testToken);

      // Assert
      expect(result).toBe(builder); // Should return same instance for chaining
      expect(result).toBeInstanceOf(GoogleSheetsApiBuilder);
    });
  });

  describe('addRow', () => {
    it('should add a row and return builder instance for chaining', () => {
      // Arrange
      const builder = GoogleSheetsApiBuilder.create();
      const testRow = [
        '123456789012345678',
        'TestUser',
        'testuser',
        '2023-01-01T00:00:00.000Z',
        'false',
        'true',
        '2023-06-01T12:00:00.000Z',
      ];

      // Act
      const result = builder.addRow(testRow);

      // Assert
      expect(result).toBe(builder); // Should return same instance for chaining
      expect(result).toBeInstanceOf(GoogleSheetsApiBuilder);
    });
  });

  describe('append', () => {
    it('should successfully append rows when properly configured', async () => {
      // Arrange
      const config = TestDataBuilders.validApiBuilderConfig().build();
      const rows = TestDataBuilders.sampleMemberRows().build();
      const mockResponse = TestDataBuilders.appendSheetsResponse().build();

      // Mock fetch to return successful response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const builder = GoogleSheetsApiBuilder.create()
        .setSpreadsheetId(config.spreadsheetId)
        .setRange(config.range)
        .setAccessToken(config.accessToken)
        .setValues(rows);

      // Act
      const result = await builder.append();

      // Assert
      expect(result.success).toBe(true);
      expect(result.updatedRows).toBe(2);
      expect(result.error).toBeUndefined();
    });

    it('should return error when missing required configuration', async () => {
      // Arrange
      const builder = GoogleSheetsApiBuilder.create(); // No configuration set

      // Act
      const result = await builder.append();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
      expect(result.updatedRows).toBeUndefined();
    });
  });

  describe('get', () => {
    it('should successfully retrieve values when properly configured', async () => {
      // Arrange
      const config = TestDataBuilders.validApiBuilderConfig().build();
      const mockResponse = TestDataBuilders.validSheetsGetResponse().build();

      // Mock fetch to return successful response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const builder = GoogleSheetsApiBuilder.create()
        .setSpreadsheetId(config.spreadsheetId)
        .setRange(config.range)
        .setAccessToken(config.accessToken);

      // Act
      const result = await builder.get();

      // Assert
      expect(result.success).toBe(true);
      expect(result.values).toEqual(mockResponse.values);
      expect(result.error).toBeUndefined();
    });

    it('should handle empty sheets gracefully', async () => {
      // Arrange
      const config = TestDataBuilders.validApiBuilderConfig().build();
      const mockResponse = TestDataBuilders.emptySheetsResponse().build();

      // Mock fetch to return empty response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const builder = GoogleSheetsApiBuilder.create()
        .setSpreadsheetId(config.spreadsheetId)
        .setRange(config.range)
        .setAccessToken(config.accessToken);

      // Act
      const result = await builder.get();

      // Assert
      expect(result.success).toBe(true);
      expect(result.values).toEqual([]); // Should convert undefined to empty array
      expect(result.error).toBeUndefined();
    });
  });

  describe('findRowsByValue', () => {
    it('should find matching rows by column value', async () => {
      // Arrange
      const config = TestDataBuilders.validApiBuilderConfig().build();
      const mockResponse = TestDataBuilders.validSheetsGetResponse().build();

      // Mock fetch to return response with existing data
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const builder = GoogleSheetsApiBuilder.create()
        .setSpreadsheetId(config.spreadsheetId)
        .setRange(config.range)
        .setAccessToken(config.accessToken);

      // Act - search for existing Discord ID in column 0
      const result = await builder.findRowsByValue(0, '123456789012345678');

      // Assert
      expect(result.success).toBe(true);
      expect(result.rowIndexes).toEqual([2]); // Should find row 2 (1-indexed, skipping header)
      expect(result.error).toBeUndefined();
    });

    it('should return empty array when no matches found', async () => {
      // Arrange
      const config = TestDataBuilders.validApiBuilderConfig().build();
      const mockResponse = TestDataBuilders.validSheetsGetResponse().build();

      // Mock fetch to return response with existing data
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const builder = GoogleSheetsApiBuilder.create()
        .setSpreadsheetId(config.spreadsheetId)
        .setRange(config.range)
        .setAccessToken(config.accessToken);

      // Act - search for non-existent Discord ID
      const result = await builder.findRowsByValue(0, '999999999999999999');

      // Assert
      expect(result.success).toBe(true);
      expect(result.rowIndexes).toEqual([]); // Should return empty array
      expect(result.error).toBeUndefined();
    });
  });

  describe('deleteRows', () => {
    it('should successfully delete specified rows', async () => {
      // Arrange
      const config = TestDataBuilders.validApiBuilderConfig().build();
      const mockResponse = TestDataBuilders.batchUpdateResponse().build();

      // Mock fetch to return successful batch update response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const builder = GoogleSheetsApiBuilder.create()
        .setSpreadsheetId(config.spreadsheetId)
        .setAccessToken(config.accessToken);

      // Act - delete rows 2 and 3
      const result = await builder.deleteRows([2, 3]);

      // Assert
      expect(result.success).toBe(true);
      expect(result.deletedRowsCount).toBe(2);
      expect(result.error).toBeUndefined();
    });

    it('should handle empty row numbers array gracefully', async () => {
      // Arrange
      const config = TestDataBuilders.validApiBuilderConfig().build();

      const builder = GoogleSheetsApiBuilder.create()
        .setSpreadsheetId(config.spreadsheetId)
        .setAccessToken(config.accessToken);

      // Act - delete empty array of rows
      const result = await builder.deleteRows([]);

      // Assert
      expect(result.success).toBe(true);
      expect(result.deletedRowsCount).toBe(0);
      expect(result.error).toBeUndefined();
    });
  });

  describe('deleteRowsByDiscordId', () => {
    it('should find and delete rows matching Discord ID', async () => {
      // Arrange
      const config = TestDataBuilders.validApiBuilderConfig().build();
      const getResponse = TestDataBuilders.validSheetsGetResponse().build();
      const deleteResponse = TestDataBuilders.batchUpdateResponse().build();

      // Mock fetch for both get and delete operations
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(getResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(deleteResponse),
        });

      const builder = GoogleSheetsApiBuilder.create()
        .setSpreadsheetId(config.spreadsheetId)
        .setRange(config.range)
        .setAccessToken(config.accessToken);

      // Act - delete by existing Discord ID
      const result = await builder.deleteRowsByDiscordId('123456789012345678');

      // Assert
      expect(result.success).toBe(true);
      expect(result.deletedRowsCount).toBe(1);
      expect(result.error).toBeUndefined();
    });

    it('should return zero deleted count when Discord ID not found', async () => {
      // Arrange
      const config = TestDataBuilders.validApiBuilderConfig().build();
      const getResponse = TestDataBuilders.validSheetsGetResponse().build();

      // Mock fetch for get operation only (no matching rows)
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(getResponse),
      });

      const builder = GoogleSheetsApiBuilder.create()
        .setSpreadsheetId(config.spreadsheetId)
        .setRange(config.range)
        .setAccessToken(config.accessToken);

      // Act - delete by non-existent Discord ID
      const result = await builder.deleteRowsByDiscordId('999999999999999999');

      // Assert
      expect(result.success).toBe(true);
      expect(result.deletedRowsCount).toBe(0);
      expect(result.error).toBeUndefined();
    });
  });
});
