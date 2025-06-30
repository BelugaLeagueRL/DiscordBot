/**
 * Tests for /admin_sync_users_to_sheets Discord slash command handler
 * Validates channel restrictions, admin permissions, and background sync initiation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from '../../../../index';
import type { DiscordInteraction } from '../../../../types/discord';
import {
  EnvFactory,
  GoogleSheetsCredentialsFactory,
  CloudflareExecutionContextFactory,
  DiscordMemberFactory,
} from '../../../helpers/test-factories';
import { handleAdminSyncUsersToSheets } from '../../../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler';

describe('Admin Sync Users to Sheets Command Handler', () => {
  let mockEnv: Env;
  let mockContext: ExecutionContext;
  let validInteraction: DiscordInteraction;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv = EnvFactory.withValidDiscordToken();
    mockContext = CloudflareExecutionContextFactory.create();

    // Create valid interaction for admin user in correct channel
    validInteraction = {
      id: 'interaction-123',
      application_id: mockEnv.DISCORD_APPLICATION_ID,
      type: 2, // APPLICATION_COMMAND
      data: {
        id: 'command-456',
        name: 'admin_sync_users_to_sheets',
        type: 1, // CHAT_INPUT
        options: [
          {
            name: 'credentials',
            type: 3, // STRING
            value: JSON.stringify(GoogleSheetsCredentialsFactory.create()),
          },
        ],
      },
      guild_id: '123456789012345678',
      channel_id: mockEnv.TEST_CHANNEL_ID ?? '123456789012345678',
      member: {
        user: {
          id: mockEnv.PRIVILEGED_USER_ID ?? '987654321098765432',
          username: 'admin_user',
          discriminator: '0001',
          global_name: 'Admin User',
        },
        roles: ['8'], // Administrator role
      },
      user: {
        id: mockEnv.PRIVILEGED_USER_ID ?? '987654321098765432',
        username: 'admin_user',
        discriminator: '0001',
        global_name: 'Admin User',
      },
      token: 'interaction_token_123',
      version: 1,
    } satisfies DiscordInteraction;
  });

  describe('handleAdminSyncUsersToSheets', () => {
    it('should successfully initiate background sync for valid admin request', async () => {
      // Act
      const result = await handleAdminSyncUsersToSheets(validInteraction, mockContext, mockEnv);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('Background sync initiated');
      expect(result.requestId).toMatch(/^[a-f0-9-]{36}$/); // UUID format
      expect(result.estimatedDuration).toMatch(/^\d+-\d+ minutes$/);
      expect(result.metadata).toEqual({
        guildId: '123456789012345678',
        initiatedBy: mockEnv.PRIVILEGED_USER_ID,
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/) as string,
      });
      const { waitUntil: waitUntilMock } = mockContext;
      expect(waitUntilMock).toHaveBeenCalledTimes(1);
      const waitUntilCall = (waitUntilMock as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(waitUntilCall).toBeDefined();
      const backgroundPromise = waitUntilCall?.[0] as Promise<unknown>;
      expect(typeof backgroundPromise.then).toBe('function');
    });

    it('should reject command from non-admin channel', async () => {
      // Arrange
      const wrongChannelInteraction = {
        ...validInteraction,
        channel_id: '999999999999999999', // Wrong channel
      };

      // Act
      const result = await handleAdminSyncUsersToSheets(
        wrongChannelInteraction,
        mockContext,
        mockEnv
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('This command can only be used in the designated admin channel');
      const { waitUntil: waitUntilMock } = mockContext;
      expect(waitUntilMock).toHaveBeenCalledTimes(0);
    });

    it('should reject command from non-privileged user', async () => {
      // Arrange
      const nonAdminInteraction = {
        ...validInteraction,
        member: validInteraction.member
          ? {
              ...validInteraction.member,
              user: validInteraction.member.user
                ? {
                    ...validInteraction.member.user,
                    id: '999999999999999999', // Non-privileged user
                  }
                : undefined,
            }
          : undefined,
        user: validInteraction.user
          ? {
              ...validInteraction.user,
              id: '999999999999999999', // Non-privileged user
            }
          : undefined,
      } as DiscordInteraction;

      // Act
      const result = await handleAdminSyncUsersToSheets(nonAdminInteraction, mockContext, mockEnv);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient permissions for this admin command');
      const { waitUntil: waitUntilMock } = mockContext;
      expect(waitUntilMock).toHaveBeenCalledTimes(0);
    });

    it('should validate Google Sheets credentials format', async () => {
      // Arrange
      const invalidCredentialsInteraction = {
        ...validInteraction,
        data: {
          id: validInteraction.data?.id ?? 'command-456',
          name: validInteraction.data?.name ?? 'admin_sync_users_to_sheets',
          type: validInteraction.data?.type ?? 1,
          options: [
            {
              name: 'credentials',
              type: 3,
              value: 'invalid-json-format',
            },
          ],
        },
      };

      // Act
      const result = await handleAdminSyncUsersToSheets(
        invalidCredentialsInteraction,
        mockContext,
        mockEnv
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid credentials format');
      const { waitUntil: waitUntilMock } = mockContext;
      expect(waitUntilMock).toHaveBeenCalledTimes(0);
    });

    it('should require credentials parameter', async () => {
      // Arrange
      const missingCredentialsInteraction = {
        ...validInteraction,
        data: {
          id: validInteraction.data?.id ?? 'command-456',
          name: validInteraction.data?.name ?? 'admin_sync_users_to_sheets',
          type: validInteraction.data?.type ?? 1,
          options: [], // No credentials provided
        },
      };

      // Act
      const result = await handleAdminSyncUsersToSheets(
        missingCredentialsInteraction,
        mockContext,
        mockEnv
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Google Sheets credentials are required');
      const { waitUntil: waitUntilMock } = mockContext;
      expect(waitUntilMock).toHaveBeenCalledTimes(0);
    });

    it('should handle missing guild ID', async () => {
      // Arrange
      const { guild_id: _guild_id, ...noGuildInteraction } = validInteraction;

      // Act
      const result = await handleAdminSyncUsersToSheets(noGuildInteraction, mockContext, mockEnv);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('This command can only be used in a Discord server');
      const { waitUntil: waitUntilMock } = mockContext;
      expect(waitUntilMock).toHaveBeenCalledTimes(0);
    });

    it('should handle missing environment configuration', async () => {
      // Arrange
      const { GOOGLE_SHEET_ID: _, ...incompleteEnv } = EnvFactory.create();

      // Act
      const result = await handleAdminSyncUsersToSheets(
        validInteraction,
        mockContext,
        incompleteEnv
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required environment configuration');
      const { waitUntil: waitUntilMock } = mockContext;
      expect(waitUntilMock).toHaveBeenCalledTimes(0);
    });

    it('should include proper response metadata for successful sync', async () => {
      // Act
      const result = await handleAdminSyncUsersToSheets(validInteraction, mockContext, mockEnv);

      // Assert
      expect(result.success).toBe(true);
      expect(result.metadata).toEqual({
        guildId: validInteraction.guild_id ?? '',
        initiatedBy: validInteraction.user?.id ?? 'unknown',
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/) as string,
      });
      expect(result.requestId).toBeTruthy();
      expect(result.estimatedDuration).toBeTruthy();
    });

    it('should handle invalid credentials content', async () => {
      // Arrange
      const invalidCredentialsInteraction = {
        ...validInteraction,
        data: {
          id: validInteraction.data?.id ?? 'command-456',
          name: validInteraction.data?.name ?? 'admin_sync_users_to_sheets',
          type: validInteraction.data?.type ?? 1,
          options: [
            {
              name: 'credentials',
              type: 3,
              value: JSON.stringify({ invalid: 'credentials' }),
            },
          ],
        },
      };

      // Act
      const result = await handleAdminSyncUsersToSheets(
        invalidCredentialsInteraction,
        mockContext,
        mockEnv
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid credentials provided');
      const { waitUntil: waitUntilMock } = mockContext;
      expect(waitUntilMock).toHaveBeenCalledTimes(0);
    });

    it('should handle execution context not available', async () => {
      // Act
      const result = await handleAdminSyncUsersToSheets(
        validInteraction,
        undefined as unknown as ExecutionContext,
        mockEnv
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Execution context not available');
    });

    it('should generate unique request IDs for concurrent requests', async () => {
      // Act
      const [result1, result2, result3] = await Promise.all([
        handleAdminSyncUsersToSheets(validInteraction, mockContext, mockEnv),
        handleAdminSyncUsersToSheets(validInteraction, mockContext, mockEnv),
        handleAdminSyncUsersToSheets(validInteraction, mockContext, mockEnv),
      ]);

      // Assert
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);
      expect(result1.requestId).not.toBe(result2.requestId);
      expect(result2.requestId).not.toBe(result3.requestId);
      expect(result1.requestId).not.toBe(result3.requestId);
    });
  });

  describe('parameter validation', () => {
    it('should validate required interaction structure', async () => {
      // Arrange
      const incompleteInteraction = {
        id: 'interaction-123',
        // Missing required fields
      } as unknown as DiscordInteraction;

      // Act
      const result = await handleAdminSyncUsersToSheets(
        incompleteInteraction,
        mockContext,
        mockEnv
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid interaction format');
    });

    it('should validate command data structure', async () => {
      // Arrange
      const { data: _data, ...interactionWithoutData } = validInteraction;
      const invalidDataInteraction = interactionWithoutData as DiscordInteraction;

      // Act
      const result = await handleAdminSyncUsersToSheets(
        invalidDataInteraction,
        mockContext,
        mockEnv
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid command data');
    });

    it('should validate user information exists', async () => {
      // Arrange
      const { user: _user, member: _member, ...interactionWithoutUser } = validInteraction;
      const noUserInteraction = interactionWithoutUser as DiscordInteraction;

      // Act
      const result = await handleAdminSyncUsersToSheets(noUserInteraction, mockContext, mockEnv);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('User information not available');
    });
  });

  describe('integration with background sync', () => {
    it('should pass correct parameters to background sync operation', async () => {
      // Act
      const result = await handleAdminSyncUsersToSheets(validInteraction, mockContext, mockEnv);

      // Assert
      expect(result.success).toBe(true);
      const { waitUntil: waitUntilMock } = mockContext;
      expect(waitUntilMock).toHaveBeenCalledTimes(1);
      const waitUntilCall = (waitUntilMock as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(waitUntilCall).toBeDefined();
      const backgroundPromise = waitUntilCall?.[0] as Promise<unknown>;
      expect(typeof backgroundPromise.then).toBe('function');
    });

    it('should estimate sync duration based on guild size', async () => {
      // Act
      const result = await handleAdminSyncUsersToSheets(validInteraction, mockContext, mockEnv);

      // Assert
      expect(result.success).toBe(true);
      expect(result.estimatedDuration).toMatch(/^\d+-\d+ minutes$/);
    });

    it('should handle background sync validation failure gracefully', async () => {
      // Arrange - This test verifies error handling from background sync validation
      const credentialsWithWrongType = GoogleSheetsCredentialsFactory.wrongType();
      const invalidInteraction = {
        ...validInteraction,
        data: {
          id: validInteraction.data?.id ?? 'command-456',
          name: validInteraction.data?.name ?? 'admin_sync_users_to_sheets',
          type: validInteraction.data?.type ?? 1,
          options: [
            {
              name: 'credentials',
              type: 3,
              value: JSON.stringify(credentialsWithWrongType),
            },
          ],
        },
      };

      // Act
      const result = await handleAdminSyncUsersToSheets(invalidInteraction, mockContext, mockEnv);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid credentials provided');
      const { waitUntil: waitUntilMock } = mockContext;
      expect(waitUntilMock).toHaveBeenCalledTimes(0);
    });
  });

  describe('Discord response with user count', () => {
    // Define proper type for Discord interaction response
    interface DiscordResponseBody {
      type: number;
      data: {
        content: string;
        flags: number;
      };
    }

    // Type guard for Discord response validation
    function isDiscordResponse(data: unknown): data is DiscordResponseBody {
      if (typeof data !== 'object' || data === null) {
        return false;
      }

      const obj = data as Record<string, unknown>;
      if (typeof obj['type'] !== 'number') {
        return false;
      }

      if (typeof obj['data'] !== 'object' || obj['data'] === null) {
        return false;
      }

      const dataObj = obj['data'] as Record<string, unknown>;
      return typeof dataObj['content'] === 'string' && typeof dataObj['flags'] === 'number';
    }
    it('should return ephemeral response with actual user count after sync', async () => {
      // Arrange
      const { handleAdminSyncUsersToSheetsDiscord } = await import(
        '../../../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler'
      );

      // Mock Discord members data to simulate 3 new users
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(DiscordMemberFactory.createBatch(3)),
      });

      // Act
      const response = await handleAdminSyncUsersToSheetsDiscord(
        validInteraction,
        mockContext,
        mockEnv
      );

      // Assert
      expect(response).toBeInstanceOf(Response);
      const responseData: unknown = await response.json();
      expect(isDiscordResponse(responseData)).toBe(true);

      // Now safely typed as DiscordResponseBody
      const responseBody = responseData as DiscordResponseBody;
      expect(responseBody.type).toBe(4); // ChannelMessageWithSource
      expect(responseBody.data.flags).toBe(64); // Ephemeral flag
      expect(responseBody.data.content).toBe('Wrote 3 new users to the sheet');
    });

    it('should return ephemeral error response when sync fails', async () => {
      // Arrange
      const { handleAdminSyncUsersToSheetsDiscord } = await import(
        '../../../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler'
      );

      // Mock Discord API to fail
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Discord API error'));

      // Act
      const response = await handleAdminSyncUsersToSheetsDiscord(
        validInteraction,
        mockContext,
        mockEnv
      );

      // Assert
      expect(response).toBeInstanceOf(Response);
      const responseData: unknown = await response.json();
      expect(isDiscordResponse(responseData)).toBe(true);

      // Now safely typed as DiscordResponseBody
      const responseBody = responseData as DiscordResponseBody;
      expect(responseBody.type).toBe(4); // ChannelMessageWithSource
      expect(responseBody.data.flags).toBe(64); // Ephemeral flag
      expect(responseBody.data.content).toContain('Error writing to sheet');
    });

    it('should handle case when no new users need to be added', async () => {
      // Arrange
      const { handleAdminSyncUsersToSheetsDiscord } = await import(
        '../../../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler'
      );

      // Mock Discord members data to simulate all users already exist
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      // Act
      const response = await handleAdminSyncUsersToSheetsDiscord(
        validInteraction,
        mockContext,
        mockEnv
      );

      // Assert
      expect(response).toBeInstanceOf(Response);
      const responseData: unknown = await response.json();
      expect(isDiscordResponse(responseData)).toBe(true);

      // Now safely typed as DiscordResponseBody
      const responseBody = responseData as DiscordResponseBody;
      expect(responseBody.type).toBe(4); // ChannelMessageWithSource
      expect(responseBody.data.flags).toBe(64); // Ephemeral flag
      expect(responseBody.data.content).toBe('Wrote 0 new users to the sheet');
    });
  });
});
