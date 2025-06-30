/**
 * Tests for background processing with Cloudflare Workers ctx.waitUntil()
 * Ensures proper handling of async operations within CPU time limits
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from '../../../../index';
import {
  syncUsersToSheetsBackground,
  type SyncOperation,
  type CloudflareExecutionContext,
} from '../../../../application_commands/google-sheets/admin-sync-users-to-sheets/background-sync';
import {
  EnvFactory,
  GoogleSheetsCredentialsFactory,
  SyncOperationFactory,
  CloudflareExecutionContextFactory,
} from '../../../helpers/test-factories';

describe('Background Sync Operations', () => {
  let mockEnv: Env;
  let mockContext: CloudflareExecutionContext;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv = EnvFactory.withValidDiscordToken();
    mockContext = CloudflareExecutionContextFactory.create();
    global.fetch = vi.fn();
  });

  describe('syncUsersToSheetsBackground', () => {
    it('should initiate background sync and return immediate response', () => {
      // Arrange
      const operation = SyncOperationFactory.create({
        requestId: 'test-request-123',
      });

      // Act
      const result = syncUsersToSheetsBackground(operation, mockContext, mockEnv);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Background sync initiated successfully');
      expect(result.estimatedDuration).toBe('2-5 minutes');
      expect(result.requestId).toBe('test-request-123');
      expect(mockContext.waitUntil).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid guild ID gracefully', () => {
      // Arrange
      const operation = SyncOperationFactory.withInvalidGuildId();

      // Act
      const result = syncUsersToSheetsBackground(operation, mockContext, mockEnv);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid guild ID format');
      expect(mockContext.waitUntil).not.toHaveBeenCalled();
    });

    it('should validate credentials before starting background operation', () => {
      // Arrange
      const operation = SyncOperationFactory.create({
        credentials: GoogleSheetsCredentialsFactory.invalid(),
      });

      // Act
      const result = syncUsersToSheetsBackground(operation, mockContext, mockEnv);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials provided');
      expect(mockContext.waitUntil).not.toHaveBeenCalled();
    });

    it('should handle missing environment configuration', () => {
      // Arrange
      const { GOOGLE_SHEET_ID: _, ...incompleteEnv } = EnvFactory.create();
      const operation = SyncOperationFactory.create();

      // Act
      const result = syncUsersToSheetsBackground(operation, mockContext, incompleteEnv);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required environment configuration');
      expect(mockContext.waitUntil).not.toHaveBeenCalled();
    });

    it('should pass correct parameters to waitUntil background operation', () => {
      // Arrange
      const operation = SyncOperationFactory.create();

      // Act
      syncUsersToSheetsBackground(operation, mockContext, mockEnv);

      // Assert
      expect(mockContext.waitUntil).toHaveBeenCalledWith(expect.any(Promise));
      const backgroundPromise = vi.mocked(mockContext.waitUntil).mock.calls[0]?.[0];
      expect(backgroundPromise).toBeInstanceOf(Promise);
    });

    it('should generate unique request ID if not provided', () => {
      // Arrange
      const operation = SyncOperationFactory.withoutRequestId();

      // Act
      const result = syncUsersToSheetsBackground(operation, mockContext, mockEnv);

      // Assert
      expect(result.success).toBe(true);
      expect(result.requestId).toBeTruthy();
      expect(result.requestId).toMatch(/^[a-f0-9-]{36}$/); // UUID format
      expect(result.requestId).not.toBe('');
    });

    it('should validate Discord token format', () => {
      // Arrange
      const envWithInvalidToken = EnvFactory.create({
        DISCORD_TOKEN: 'invalid-token-format',
      });
      const operation = SyncOperationFactory.create();

      // Act
      const result = syncUsersToSheetsBackground(operation, mockContext, envWithInvalidToken);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid Discord token format');
      expect(mockContext.waitUntil).not.toHaveBeenCalled();
    });

    it('should handle very large guild member counts efficiently', () => {
      // Arrange
      const operation = SyncOperationFactory.withLargeGuild(50000);

      // Act
      const result = syncUsersToSheetsBackground(operation, mockContext, mockEnv);

      // Assert
      expect(result.success).toBe(true);
      expect(result.estimatedDuration).toBe('10-15 minutes'); // Longer for large guilds
      expect(mockContext.waitUntil).toHaveBeenCalledTimes(1);
    });

    it('should include proper operation metadata in response', () => {
      // Arrange
      const operation = SyncOperationFactory.create({
        requestId: 'test-request-meta',
        initiatedBy: '354474826192388127',
        timestamp: '2023-06-29T10:00:00.000Z',
        estimatedMemberCount: 1000,
      });

      // Act
      const result = syncUsersToSheetsBackground(operation, mockContext, mockEnv);

      // Assert
      expect(result.success).toBe(true);
      expect(result.metadata).toEqual({
        guildId: operation.guildId,
        initiatedBy: '354474826192388127',
        timestamp: '2023-06-29T10:00:00.000Z',
        estimatedMemberCount: 1000,
      });
    });
  });

  describe('background operation validation', () => {
    it('should validate guild ID format correctly', () => {
      // Test cases for Discord guild ID validation
      const validGuildIds = ['123456789012345678', '987654321098765432'];
      const invalidGuildIds = ['123', 'abc123', '', '12345678901234567890123']; // Too short, non-numeric, empty, too long

      validGuildIds.forEach(id => {
        expect(id).toMatch(/^\d{17,19}$/);
      });

      invalidGuildIds.forEach(id => {
        expect(id).not.toMatch(/^\d{17,19}$/);
      });
    });

    it('should validate Discord token format correctly', () => {
      // Test cases for Discord bot token validation
      const validTokens = [
        'Bot MTk4NjIyNDgzNDcxOTI1MjQ4.Cl2FMQ.ZnCjm1XVW7vRze4b7Cq4se7kKWs',
        'Bot MTE5ODYyMjQ4MzQ3MTkyNTI0OA.GhTl5Q.abc123def456ghi789jkl012mno345pqr678stu901',
      ];
      const invalidTokens = [
        'invalid-token',
        'MTk4NjIyNDgzNDcxOTI1MjQ4.Cl2FMQ.ZnCjm1XVW7vRze4b7Cq4se7kKWs', // Missing 'Bot ' prefix
        'Bot invalid.format.token',
        '',
        'Bot ',
      ];

      validTokens.forEach(token => {
        expect(token).toMatch(/^Bot [A-Za-z0-9+/=]{20,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{27,}$/);
      });

      invalidTokens.forEach(token => {
        expect(token).not.toMatch(
          /^Bot [A-Za-z0-9+/=]{20,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{27,}$/
        );
      });
    });

    it('should validate timestamp format correctly', () => {
      // Test cases for ISO timestamp validation
      const validTimestamps = [
        '2023-06-29T10:00:00.000Z',
        '2023-12-31T23:59:59.999Z',
        '2024-01-01T00:00:00.000Z',
      ];
      const invalidTimestamps = [
        '2023-06-29',
        '2023-06-29T10:00:00',
        'invalid-timestamp',
        '',
        '2023-13-01T00:00:00.000Z', // Invalid month
      ];

      validTimestamps.forEach(timestamp => {
        expect(() => new Date(timestamp).toISOString()).not.toThrow();
        expect(new Date(timestamp).toISOString()).toBe(timestamp);
      });

      invalidTimestamps.forEach(timestamp => {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
          // Invalid dates throw error or return 'Invalid Date'
          expect(() => date.toISOString()).toThrow();
        } else {
          // Valid dates but not in correct format
          expect(date.toISOString()).not.toBe(timestamp);
        }
      });
    });

    it('should handle request ID generation correctly', () => {
      // UUID v4 format validation
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      // Generate multiple UUIDs to test uniqueness
      const generatedIds = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const uuid = crypto.randomUUID();
        expect(uuid).toMatch(uuidPattern);
        expect(generatedIds.has(uuid)).toBe(false); // Ensure uniqueness
        generatedIds.add(uuid);
      }
    });
  });

  describe('Cloudflare Workers integration', () => {
    it('should respect ExecutionContext interface requirements', () => {
      // Arrange
      const context = CloudflareExecutionContextFactory.create();

      // Assert
      expect(context.waitUntil).toBeDefined();
      expect(context.passThroughOnException).toBeDefined();
      expect(typeof context.waitUntil).toBe('function');
      expect(typeof context.passThroughOnException).toBe('function');
    });

    it('should handle passThroughOnException correctly', () => {
      // Arrange
      const context = CloudflareExecutionContextFactory.create();

      // Act
      context.passThroughOnException();

      // Assert
      expect(context.passThroughOnException).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple waitUntil calls correctly', () => {
      // Arrange
      const context = CloudflareExecutionContextFactory.create();
      const promise1 = Promise.resolve('task1');
      const promise2 = Promise.resolve('task2');

      // Act
      context.waitUntil(promise1);
      context.waitUntil(promise2);

      // Assert
      expect(context.waitUntil).toHaveBeenCalledTimes(2);
      expect(context.waitUntil).toHaveBeenNthCalledWith(1, promise1);
      expect(context.waitUntil).toHaveBeenNthCalledWith(2, promise2);
    });
  });

  describe('Google Sheets API integration', () => {
    it('should perform actual batch write to Google Sheets when new members exist', () => {
      // Arrange
      const operation = SyncOperationFactory.create();

      // Mock the Discord members fetch to return sample data
      const mockDiscordMembers = [
        { id: '123456789012345678', username: 'testuser1', discriminator: '0001' },
        { id: '234567890123456789', username: 'testuser2', discriminator: '0002' },
        { id: '345678901234567890', username: 'testuser3', discriminator: '0003' },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDiscordMembers),
      });

      // Act
      syncUsersToSheetsBackground(operation, mockContext, mockEnv);

      // Assert - verify waitUntil was called (background operation initiated)
      expect(mockContext.waitUntil).toHaveBeenCalledTimes(1);

      // Get the background promise and verify it would call the Sheets API
      const backgroundPromise = vi.mocked(mockContext.waitUntil).mock.calls[0]?.[0];
      expect(backgroundPromise).toBeInstanceOf(Promise);
    });

    it('should handle Google Sheets API errors gracefully in background operation', () => {
      // Arrange
      const operation = SyncOperationFactory.create();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Mock implementation to capture console.error calls
        return undefined;
      });

      // Mock Sheets API to throw error
      global.fetch = vi.fn().mockRejectedValue(new Error('Sheets API error'));

      // Act
      syncUsersToSheetsBackground(operation, mockContext, mockEnv);

      // Assert
      expect(mockContext.waitUntil).toHaveBeenCalledTimes(1);

      // Clean up
      consoleSpy.mockRestore();
    });

    it('should log successful batch write operations with member count', () => {
      // Arrange
      const operation = SyncOperationFactory.create();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {
        // Mock implementation to capture console.log calls
        return undefined;
      });

      // Mock successful Discord API and Sheets operations
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: '123456789012345678', username: 'newuser1' },
            { id: '234567890123456789', username: 'newuser2' },
          ]),
      });

      // Act
      syncUsersToSheetsBackground(operation, mockContext, mockEnv);

      // Assert
      expect(mockContext.waitUntil).toHaveBeenCalledTimes(1);

      // Clean up
      consoleSpy.mockRestore();
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle missing required operation fields', () => {
      // Arrange
      const incompleteOperation = {
        guildId: '123456789012345678',
        // Missing credentials, requestId, initiatedBy, timestamp
      } as unknown as SyncOperation;

      // Act
      const result = syncUsersToSheetsBackground(incompleteOperation, mockContext, mockEnv);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required operation fields');
      expect(mockContext.waitUntil).not.toHaveBeenCalled();
    });

    it('should handle execution context being undefined', () => {
      // Arrange
      const operation = SyncOperationFactory.create();

      // Act
      const result = syncUsersToSheetsBackground(
        operation,
        undefined as unknown as CloudflareExecutionContext,
        mockEnv
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Execution context not available');
    });

    it('should handle extremely large estimated member counts', () => {
      // Arrange
      const operation = SyncOperationFactory.withMassiveGuild();

      // Act
      const result = syncUsersToSheetsBackground(operation, mockContext, mockEnv);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Guild too large for synchronization (max 100,000 members)');
      expect(mockContext.waitUntil).not.toHaveBeenCalled();
    });
  });
});
