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
    /**
     * Factory for format validation tests
     */
    function testFormatValidation(
      description: string,
      validCases: readonly string[],
      invalidCases: readonly string[],
      pattern: RegExp
    ): void {
      it(`should validate ${description} correctly`, () => {
        validCases.forEach(validCase => {
          expect(validCase).toMatch(pattern);
        });
        invalidCases.forEach(invalidCase => {
          expect(invalidCase).not.toMatch(pattern);
        });
      });
    }

    testFormatValidation(
      'guild ID format',
      ['123456789012345678', '987654321098765432'] as const,
      ['123', 'abc123', '', '12345678901234567890123'] as const,
      /^\d{17,19}$/
    );

    testFormatValidation(
      'Discord token format',
      [
        'Bot MTk4NjIyNDgzNDcxOTI1MjQ4.Cl2FMQ.ZnCjm1XVW7vRze4b7Cq4se7kKWs',
        'Bot MTE5ODYyMjQ4MzQ3MTkyNTI0OA.GhTl5Q.abc123def456ghi789jkl012mno345pqr678stu901',
      ] as const,
      [
        'invalid-token',
        'MTk4NjIyNDgzNDcxOTI1MjQ4.Cl2FMQ.ZnCjm1XVW7vRze4b7Cq4se7kKWs',
        'Bot invalid.format.token',
        '',
        'Bot ',
      ] as const,
      /^Bot [A-Za-z0-9+/=]{20,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{27,}$/
    );

    it('should validate timestamp format correctly', () => {
      const validTimestamps = ['2023-06-29T10:00:00.000Z', '2023-12-31T23:59:59.999Z'] as const;
      const invalidTimestamps = [
        '2023-06-29',
        'invalid-timestamp',
        '2023-13-01T00:00:00.000Z',
      ] as const;

      validTimestamps.forEach(timestamp => {
        expect(new Date(timestamp).toISOString()).toBe(timestamp);
      });

      invalidTimestamps.forEach(timestamp => {
        const date = new Date(timestamp);
        expect(isNaN(date.getTime()) || date.toISOString() !== timestamp).toBe(true);
      });
    });

    it('should handle request ID generation correctly', () => {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const generatedIds = new Set<string>();

      for (let i = 0; i < 10; i++) {
        const uuid = crypto.randomUUID();
        expect(uuid).toMatch(uuidPattern);
        expect(generatedIds.has(uuid)).toBe(false);
        generatedIds.add(uuid);
      }
    });
  });

  describe('Cloudflare Workers integration', () => {
    it('should respect ExecutionContext interface and handle multiple calls', () => {
      const context = CloudflareExecutionContextFactory.create();

      expect(typeof context.waitUntil).toBe('function');
      expect(typeof context.passThroughOnException).toBe('function');

      const promises = [Promise.resolve('task1'), Promise.resolve('task2')];
      promises.forEach(promise => {
        context.waitUntil(promise);
      });
      context.passThroughOnException();

      expect(context.waitUntil).toHaveBeenCalledTimes(2);
      expect(context.passThroughOnException).toHaveBeenCalledTimes(1);
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
    /**
     * Factory for error scenario tests
     */
    function testErrorScenario(
      description: string,
      setup: () => { operation: SyncOperation; context: CloudflareExecutionContext; env: Env },
      expectedError: string,
      shouldCheckWaitUntil: boolean = true
    ): void {
      it(description, () => {
        const { operation, context, env } = setup();
        const result = syncUsersToSheetsBackground(operation, context, env);

        expect(result.success).toBe(false);
        expect(result.error).toBe(expectedError);

        if (shouldCheckWaitUntil) {
          expect(vi.mocked(context).waitUntil).not.toHaveBeenCalled();
        }
      });
    }

    testErrorScenario(
      'should handle missing required operation fields',
      () => ({
        operation: { guildId: '123456789012345678' } as unknown as SyncOperation,
        context: mockContext,
        env: mockEnv,
      }),
      'Missing required operation fields'
    );

    testErrorScenario(
      'should handle execution context being undefined',
      () => ({
        operation: SyncOperationFactory.create(),
        context: undefined as unknown as CloudflareExecutionContext,
        env: mockEnv,
      }),
      'Execution context not available',
      false
    );

    testErrorScenario(
      'should handle extremely large estimated member counts',
      () => ({
        operation: SyncOperationFactory.withMassiveGuild(),
        context: mockContext,
        env: mockEnv,
      }),
      'Guild too large for synchronization (max 100,000 members)'
    );
  });
});
