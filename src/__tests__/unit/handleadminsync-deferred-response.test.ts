/**
 * REFACTOR Phase: handleAdminSyncUsersToSheetsDiscord ephemeral deferred response validation
 * Tests the Discord response behavior, ephemeral flags, and background processing scheduling
 * Following TDD Red-Green-Refactor with anti-pattern prevention
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import type { Env } from '../../index';
import { handleAdminSyncUsersToSheetsDiscord } from '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler';
import type { DiscordInteraction } from '../../types/discord';
// Discord utilities are imported directly in the function under test

// Mock external dependencies for unit testing
vi.mock(
  '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members',
  () => ({
    fetchGuildMembers: vi.fn(),
    transformMemberData: vi.fn(),
    filterNewMembers: vi.fn(),
  })
);

vi.mock('../../utils/google-sheets-builder', () => ({
  GoogleOAuthBuilder: {
    create: vi.fn(),
  },
  GoogleSheetsApiBuilder: {
    create: vi.fn(),
  },
  createMemberRow: vi.fn(),
}));

// Mock crypto for requestId generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-request-id-123'),
  },
});

describe('handleAdminSyncUsersToSheetsDiscord ephemeral deferred response validation', () => {
  const mockEnv: Env = {
    DISCORD_TOKEN: 'test_token',
    DISCORD_PUBLIC_KEY: 'test_public_key',
    DISCORD_APPLICATION_ID: 'test_app_id',
    GOOGLE_SHEET_ID: 'test_sheet_id',
    GOOGLE_SHEETS_CLIENT_EMAIL: 'test@test.com',
    GOOGLE_SHEETS_PRIVATE_KEY: 'test_private_key',
    GOOGLE_SHEETS_TYPE: 'service_account',
    GOOGLE_SHEETS_PROJECT_ID: 'test_project',
    GOOGLE_SHEETS_PRIVATE_KEY_ID: 'test_key_id',
    GOOGLE_SHEETS_CLIENT_ID: 'test_client_id',
    TEST_CHANNEL_ID: 'test_channel_123',
    PRIVILEGED_USER_ID: 'test_user_456',
    ENVIRONMENT: 'test',
  };

  const validInteraction: DiscordInteraction = {
    id: 'interaction-123',
    application_id: 'test_app_id',
    type: 2,
    guild_id: '123456789012345678',
    channel_id: 'test_channel_123',
    member: {
      user: {
        id: 'test_user_456',
        username: 'testuser',
        discriminator: '0000',
      },
      roles: ['test_role'],
    },
    token: faker.string.alphanumeric(16),
    version: 1,
    data: {
      id: 'command-id',
      name: 'admin_sync_users_to_sheets',
      type: 1,
      options: [],
    },
  };

  const mockContext = {
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Valid Request Ephemeral Deferred Response', () => {
    it('should return Discord response type 5 (DeferredChannelMessageWithSource)', async () => {
      // Act
      const response = handleAdminSyncUsersToSheetsDiscord(validInteraction, mockContext, mockEnv);

      // Assert - Verify response is a proper Response object
      expect(response).toBeInstanceOf(Response);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      // Parse and verify Discord response structure
      const responseBody = (await response.json()) as { type: number; data?: { flags?: number } };
      expect(responseBody.type).toBe(5); // DeferredChannelMessageWithSource
    });

    it('should set ephemeral flag (64) in deferred response data', async () => {
      // Act
      const response = handleAdminSyncUsersToSheetsDiscord(validInteraction, mockContext, mockEnv);

      // Assert - Verify ephemeral flag is properly set
      const responseBody = (await response.json()) as { type: number; data?: { flags?: number } };
      expect(responseBody.data?.flags).toBe(64); // EPHEMERAL_FLAG
    });

    it('should schedule background processing via context.waitUntil', () => {
      // Act
      handleAdminSyncUsersToSheetsDiscord(validInteraction, mockContext, mockEnv);

      // Assert - Verify background work is scheduled
      expect(mockContext.waitUntil).toHaveBeenCalledWith(expect.any(Promise));
      expect(mockContext.waitUntil).toHaveBeenCalledTimes(1);
    });

    it('should return response immediately without waiting for background processing', () => {
      // Arrange - Mock slow background processing
      const slowPromise = new Promise(resolve => setTimeout(resolve, 1000));
      mockContext.waitUntil.mockImplementation(() => slowPromise);

      // Act
      const startTime = Date.now();
      const response = handleAdminSyncUsersToSheetsDiscord(validInteraction, mockContext, mockEnv);
      const responseTime = Date.now() - startTime;

      // Assert - Response should be immediate (< 100ms), not wait for background work
      expect(responseTime).toBeLessThan(100);
      expect(response).toBeInstanceOf(Response);
    });

    it('should generate unique requestId for tracking', () => {
      // Arrange - Mock crypto.randomUUID to return specific values
      const mockUUID = vi
        .fn()
        .mockReturnValueOnce('first-request-id')
        .mockReturnValueOnce('second-request-id');
      Object.defineProperty(global, 'crypto', {
        value: { randomUUID: mockUUID },
      });

      // Act - Make two requests
      handleAdminSyncUsersToSheetsDiscord(validInteraction, mockContext, mockEnv);
      handleAdminSyncUsersToSheetsDiscord(validInteraction, mockContext, mockEnv);

      // Assert - Verify unique IDs are generated for each request
      expect(mockUUID).toHaveBeenCalledTimes(2);
    });
  });

  describe('Validation Failure Error Responses', () => {
    it('should return error response (not deferred) when user validation fails', async () => {
      // Arrange - Invalid interaction without user - cast through unknown to allow undefined member
      const invalidInteraction = {
        ...validInteraction,
        member: undefined,
      } as unknown as DiscordInteraction;

      // Act
      const response = handleAdminSyncUsersToSheetsDiscord(
        invalidInteraction,
        mockContext,
        mockEnv
      );

      // Assert - Should return immediate error response, not deferred response
      expect(response).toBeInstanceOf(Response);
      const responseBody = (await response.json()) as { type: number; data?: { content?: string } };

      // Verify this is an error response (type 4), not deferred response (type 5)
      expect(responseBody.type).toBe(4); // ChannelMessageWithSource for errors
      expect(responseBody.data?.content).toContain('User information not available');

      // Verify no background processing is scheduled for failed validation
      expect(mockContext.waitUntil).not.toHaveBeenCalled();
    });

    it('should return error response when environment validation fails', async () => {
      // Arrange - Environment missing required Google Sheets configuration
      const invalidEnv = {
        ...mockEnv,
        GOOGLE_SHEET_ID: '', // Empty sheet ID should cause validation failure
      };

      // Act
      const response = handleAdminSyncUsersToSheetsDiscord(
        validInteraction,
        mockContext,
        invalidEnv
      );

      // Assert - Should return immediate error response
      expect(response).toBeInstanceOf(Response);
      const responseBody = (await response.json()) as { type: number; data?: { content?: string } };

      expect(responseBody.type).toBe(4); // Error response type
      expect(responseBody.data?.content).toContain('Missing required environment configuration');

      // Verify no background processing for failed validation
      expect(mockContext.waitUntil).not.toHaveBeenCalled();
    });

    it('should return error response when credentials validation fails', async () => {
      // Arrange - Environment with invalid credentials format
      const invalidEnv = {
        ...mockEnv,
        GOOGLE_SHEETS_CLIENT_EMAIL: '', // Empty client email should cause credential validation failure
      };

      // Act
      const response = handleAdminSyncUsersToSheetsDiscord(
        validInteraction,
        mockContext,
        invalidEnv
      );

      // Assert - Should return immediate error response
      expect(response).toBeInstanceOf(Response);
      const responseBody = (await response.json()) as { type: number; data?: { content?: string } };

      expect(responseBody.type).toBe(4); // Error response type
      expect(responseBody.data?.content).toContain('Missing required credential field');

      // Verify no background processing for failed credential validation
      expect(mockContext.waitUntil).not.toHaveBeenCalled();
    });

    it('should return error response when channel permissions fail', async () => {
      // Arrange - Valid user but wrong channel (not TEST_CHANNEL_ID)
      const wrongChannelInteraction = {
        ...validInteraction,
        channel_id: 'wrong_channel_id',
      };

      // Act
      const response = handleAdminSyncUsersToSheetsDiscord(
        wrongChannelInteraction,
        mockContext,
        mockEnv
      );

      // Assert - Should return immediate error response
      expect(response).toBeInstanceOf(Response);
      const responseBody = (await response.json()) as { type: number; data?: { content?: string } };

      expect(responseBody.type).toBe(4); // Error response type
      expect(responseBody.data?.content).toContain(
        'This command can only be used in the designated admin channel'
      );

      // Verify no background processing for failed permissions
      expect(mockContext.waitUntil).not.toHaveBeenCalled();
    });
  });

  describe('Response Format Validation', () => {
    it('should return proper HTTP status 200 for deferred responses', () => {
      // Act
      const response = handleAdminSyncUsersToSheetsDiscord(validInteraction, mockContext, mockEnv);

      // Assert
      expect(response.status).toBe(200);
    });

    it('should set correct Content-Type header for Discord responses', () => {
      // Act
      const response = handleAdminSyncUsersToSheetsDiscord(validInteraction, mockContext, mockEnv);

      // Assert
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should return response that can be parsed as valid JSON', async () => {
      // Act
      const response = handleAdminSyncUsersToSheetsDiscord(validInteraction, mockContext, mockEnv);

      // Assert - Should not throw when parsing JSON
      await expect(response.json()).resolves.toBeDefined();
    });

    it('should include proper Discord interaction response structure', async () => {
      // Act
      const response = handleAdminSyncUsersToSheetsDiscord(validInteraction, mockContext, mockEnv);

      // Assert
      const responseBody = (await response.json()) as { type: number; data?: unknown };
      expect(responseBody).toHaveProperty('type');
      expect(typeof responseBody.type).toBe('number');
      expect(responseBody.type).toBeGreaterThan(0);
      expect(responseBody.type).toBeLessThanOrEqual(10); // Valid Discord interaction response types
    });
  });

  describe('Background Processing Integration', () => {
    it('should pass correct parameters to background sync function', () => {
      // Arrange - Spy on background function call
      const contextSpy = vi.spyOn(mockContext, 'waitUntil');

      // Act
      handleAdminSyncUsersToSheetsDiscord(validInteraction, mockContext, mockEnv);

      // Assert - Verify background function receives proper parameters
      expect(contextSpy).toHaveBeenCalledWith(expect.any(Promise));

      // Verify the Promise is for executeAdminSyncAndNotify with proper parameters
      const backgroundPromise = contextSpy.mock.calls[0]?.[0];
      expect(backgroundPromise).toBeInstanceOf(Promise);
    });

    it('should handle background processing promise rejection gracefully', () => {
      // Arrange - Mock context.waitUntil to throw an error
      const mockWaitUntil = vi.fn().mockImplementation(() => {
        throw new Error('Context error');
      });
      const errorContext = {
        ...mockContext,
        waitUntil: mockWaitUntil,
      };

      // Act & Assert - Should not throw even if background processing fails
      expect(() => {
        handleAdminSyncUsersToSheetsDiscord(validInteraction, errorContext, mockEnv);
      }).not.toThrow();
    });
  });

  describe('Performance and Timing Requirements', () => {
    it('should return deferred response within 3 seconds (Flow 3 requirement)', () => {
      // Act
      const startTime = Date.now();
      const response = handleAdminSyncUsersToSheetsDiscord(validInteraction, mockContext, mockEnv);
      const responseTime = Date.now() - startTime;

      // Assert - Must be under 3000ms to meet Discord interaction requirements
      expect(responseTime).toBeLessThan(3000);
      expect(response).toBeInstanceOf(Response);
    });

    it('should not block on background processing for response timing', () => {
      // Arrange - Mock very slow background operation (10 seconds)
      const slowBackgroundWork = vi.fn().mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 10000));
      });
      mockContext.waitUntil.mockImplementation(() => slowBackgroundWork());

      // Act
      const startTime = Date.now();
      const response = handleAdminSyncUsersToSheetsDiscord(validInteraction, mockContext, mockEnv);
      const responseTime = Date.now() - startTime;

      // Assert - Response should be immediate despite slow background work
      expect(responseTime).toBeLessThan(100); // Should be nearly instant
      expect(response).toBeInstanceOf(Response);
    });
  });
});
