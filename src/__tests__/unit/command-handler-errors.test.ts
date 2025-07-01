/**
 * Unit tests for command-handler error handling
 * Testing Lines 465-466 error path following TDD Red-Green-Refactor
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from '../../index';

// Import the functions we need to test
import { handleAdminSyncUsersToSheetsDiscord } from '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler';

describe('loadCredentialsFromEnvironment error handling (Lines 465-466)', () => {
  let mockContext: ExecutionContext;

  beforeEach(() => {
    vi.resetAllMocks();
    mockContext = {
      waitUntil: vi.fn(),
      passThroughOnException: vi.fn(),
      props: {},
    };
  });

  it('should catch exceptions and wrap error message exactly as Lines 465-466 specify', async () => {
    // Arrange - Create environment that passes field validation but fails during buildCredentialsObject
    // This specifically targets the try-catch block at Lines 464-467
    const mockEnv = {
      TEST_CHANNEL_ID: 'test-channel-id',
      PRIVILEGED_USER_ID: 'privileged-user-id',
      GOOGLE_SHEET_ID: 'sheet-123',
      GOOGLE_SHEETS_TYPE: 'service_account',
      GOOGLE_SHEETS_PROJECT_ID: 'project-123',
      GOOGLE_SHEETS_PRIVATE_KEY_ID: 'key-id-123',
      GOOGLE_SHEETS_CLIENT_ID: 'client-123',
      // These fields need to exist for field validation to pass
      GOOGLE_SHEETS_CLIENT_EMAIL: 'test@service.com',
      GOOGLE_SHEETS_PRIVATE_KEY: 'valid-key-content',
    } as Env;

    // Override GOOGLE_SHEETS_CLIENT_EMAIL to throw only when accessed during buildCredentialsObject
    // Field validation accesses the property once, buildCredentialsObject accesses it again
    let accessCount = 0;
    Object.defineProperty(mockEnv, 'GOOGLE_SHEETS_CLIENT_EMAIL', {
      get() {
        accessCount++;
        if (accessCount > 1) {
          // Second access happens in buildCredentialsObject (Line 441) - this triggers Lines 465-466
          throw new Error('Environment access error during credential building');
        }
        return 'test@service.com'; // First access for field validation succeeds
      },
    });

    const validInteraction = {
      id: 'interaction-123',
      application_id: 'app-456',
      type: 2,
      guild_id: '123456789012345678',
      channel_id: 'test-channel-id',
      user: {
        id: 'privileged-user-id',
        username: 'testuser',
        discriminator: '1234',
        global_name: 'Test User',
      },
      data: {
        id: 'command-789',
        name: 'admin_sync_users_to_sheets',
        type: 1,
      },
      token: 'token-abc',
      version: 1,
    };

    // Act - Call handler with environment that will throw during buildCredentialsObject
    const result = handleAdminSyncUsersToSheetsDiscord(validInteraction, mockContext, mockEnv);

    // Assert - Should return Discord error response with wrapped error message from Line 466
    expect(result).toBeInstanceOf(Response);
    expect(result.status).toBe(200); // Discord slash commands always return 200 with error in message

    // Verify the error message is properly wrapped as specified in Line 466
    const responseBody = await result.json();
    expect(responseBody).toMatchObject({
      type: 4, // Discord ephemeral response type
      data: {
        content:
          '❌ Failed to build credentials: Environment access error during credential building',
        flags: 64, // Ephemeral flag
      },
    });
  });

  describe('validation failure error handling (Line 482)', () => {
    it('should return Discord error response when interaction validation fails (Line 482)', async () => {
      // Arrange - Create invalid interaction missing 'id' field
      // Path: Missing 'id' → validateInteractionStructure Line 197 → validateBasics Line 245
      //       → performValidation Line 308 → handleAdminSyncUsersToSheetsDiscord Line 482
      const invalidInteraction = {
        // Missing required 'id' field to trigger validateInteractionStructure failure
        application_id: 'app-456',
        type: 2,
        token: 'token-abc',
        version: 1,
      };

      const validEnv = {
        TEST_CHANNEL_ID: 'test-channel-id',
        PRIVILEGED_USER_ID: 'privileged-user-id',
        GOOGLE_SHEET_ID: 'sheet-123',
        GOOGLE_SHEETS_TYPE: 'service_account',
        GOOGLE_SHEETS_PROJECT_ID: 'project-123',
        GOOGLE_SHEETS_PRIVATE_KEY_ID: 'key-id-123',
        GOOGLE_SHEETS_CLIENT_EMAIL: 'test@service.com',
        GOOGLE_SHEETS_PRIVATE_KEY: 'valid-key-content',
        GOOGLE_SHEETS_CLIENT_ID: 'client-123',
      } as Env;

      // Act - Call Discord handler with invalid interaction (cast to bypass TypeScript validation)
      const result = handleAdminSyncUsersToSheetsDiscord(
        invalidInteraction as any,
        mockContext,
        validEnv
      );

      // Assert - Should return Discord error response from Line 482
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(200); // Discord slash commands always return 200

      // Verify error message is from validateInteractionStructure → Line 482
      const responseBody = await result.json();
      expect(responseBody).toMatchObject({
        type: 4, // Discord ephemeral response type
        data: {
          content: '❌ Invalid interaction format',
          flags: 64, // Ephemeral flag
        },
      });
    });
  });
});
