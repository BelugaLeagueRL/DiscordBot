/**
 * Unit tests for executeAdminSyncAndNotify function
 * Tests success path with member count variations, error handling for Google Sheets, Discord, and network failures
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from '../../index';
import type { DiscordInteraction } from '../../types/discord';
import { executeAdminSyncAndNotify } from '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler';
import * as discordMembers from '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members';
import * as googleSheetsBuilder from '../../utils/google-sheets-builder';
import * as discordUtils from '../../utils/discord';

// Mock all dependencies
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

vi.mock('../../utils/discord', () => ({
  updateDeferredResponse: vi.fn(),
}));

describe('executeAdminSyncAndNotify', () => {
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

  const mockInteraction: DiscordInteraction = {
    type: 2,
    id: 'test_interaction_id',
    application_id: 'test_app_id',
    token: 'test_token',
    version: 1,
    data: {
      id: 'test_command_id',
      name: 'admin_sync_users_to_sheets',
      type: 1,
    },
  };

  const mockSyncParams = {
    guildId: 'test_guild_123',
    credentials: {
      client_email: 'test@test.com',
      private_key: 'test_private_key',
    },
    requestId: 'test_request_123',
    initiatedBy: 'test_user_456',
    timestamp: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Success Path with Member Count Variations', () => {
    it('should successfully sync 0 new members and notify Discord', async () => {
      // Arrange

      // Mock successful fetch with 0 new members
      vi.mocked(discordMembers.fetchGuildMembers).mockResolvedValue({
        success: true,
        members: [],
      });
      vi.mocked(discordMembers.transformMemberData).mockReturnValue([]);
      vi.mocked(discordMembers.filterNewMembers).mockReturnValue([]);

      // Mock Google Sheets OAuth and API
      const mockOAuth = {
        setCredentials: vi.fn().mockReturnThis(),
        getAccessToken: vi.fn().mockResolvedValue('mock_access_token'),
      };
      vi.mocked(googleSheetsBuilder.GoogleOAuthBuilder.create).mockReturnValue(mockOAuth as any);

      const mockSheetsApi = {
        setSpreadsheetId: vi.fn().mockReturnThis(),
        setRange: vi.fn().mockReturnThis(),
        setAccessToken: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ success: true, values: [['header']] }),
      };
      vi.mocked(googleSheetsBuilder.GoogleSheetsApiBuilder.create).mockReturnValue(
        mockSheetsApi as any
      );

      vi.mocked(discordUtils.updateDeferredResponse).mockResolvedValue();

      // Act
      await executeAdminSyncAndNotify(mockInteraction, mockEnv, mockSyncParams);

      // Assert
      expect(discordUtils.updateDeferredResponse).toHaveBeenCalledWith(
        mockEnv.DISCORD_APPLICATION_ID,
        mockInteraction.token,
        '✅ Successfully synced 0 new members to sheets'
      );
    });

    it('should successfully sync 10 new members and notify Discord', async () => {
      // Arrange

      // Mock 10 members data
      const mockMembers = Array.from({ length: 10 }, (_, i) => ({
        user: {
          id: `user_${i}`,
          username: `user${i}`,
          discriminator: '0000',
          global_name: null,
          avatar: null,
          bot: false,
        },
        nick: null,
        roles: [],
        joined_at: '2024-01-01T00:00:00.000Z',
        premium_since: null,
        deaf: false,
        mute: false,
        flags: 0,
        pending: false,
        permissions: '0',
        communication_disabled_until: null,
      }));

      const mockTransformedData = Array.from({ length: 10 }, (_, i) => ({
        discord_id: `user_${i}`,
        discord_username_display: `user${i}`,
        discord_username_actual: `user${i}`,
        server_join_date: '2024-01-01T00:00:00.000Z',
        is_banned: false,
        is_active: true,
        last_updated: '2024-01-01T00:00:00.000Z',
      }));

      vi.mocked(discordMembers.fetchGuildMembers).mockResolvedValue({
        success: true,
        members: mockMembers,
      });
      vi.mocked(discordMembers.transformMemberData).mockReturnValue(mockTransformedData);
      vi.mocked(discordMembers.filterNewMembers).mockReturnValue(mockTransformedData);

      // Mock Google Sheets
      const mockOAuth = {
        setCredentials: vi.fn().mockReturnThis(),
        getAccessToken: vi.fn().mockResolvedValue('mock_access_token'),
      };
      vi.mocked(googleSheetsBuilder.GoogleOAuthBuilder.create).mockReturnValue(mockOAuth as any);

      const mockSheetsApi = {
        setSpreadsheetId: vi.fn().mockReturnThis(),
        setRange: vi.fn().mockReturnThis(),
        setAccessToken: vi.fn().mockReturnThis(),
        setValues: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ success: true, values: [['header']] }),
        append: vi.fn().mockResolvedValue({ success: true }),
      };
      vi.mocked(googleSheetsBuilder.GoogleSheetsApiBuilder.create).mockReturnValue(
        mockSheetsApi as any
      );

      vi.mocked(googleSheetsBuilder.createMemberRow).mockImplementation(member => [
        member.discord_id,
        member.discord_username_display,
        member.discord_username_actual,
        member.server_join_date,
        member.is_banned.toString(),
        member.is_active.toString(),
        member.last_updated ?? '2024-01-01T00:00:00.000Z',
      ]);

      vi.mocked(discordUtils.updateDeferredResponse).mockResolvedValue();

      // Act
      await executeAdminSyncAndNotify(mockInteraction, mockEnv, mockSyncParams);

      // Assert
      expect(discordUtils.updateDeferredResponse).toHaveBeenCalledWith(
        mockEnv.DISCORD_APPLICATION_ID,
        mockInteraction.token,
        '✅ Successfully synced 10 new members to sheets'
      );
    });

    it('should successfully sync 1000 new members and notify Discord', async () => {
      // Arrange

      // Mock 1000 members - this tests the performance boundary
      const mockMembers = Array.from({ length: 1000 }, (_, i) => ({
        user: {
          id: `user_${i.toString().padStart(4, '0')}`,
          username: `user${i}`,
          discriminator: '0000',
          global_name: null,
          avatar: null,
          bot: false,
        },
        nick: null,
        roles: [],
        joined_at: '2024-01-01T00:00:00.000Z',
        premium_since: null,
        deaf: false,
        mute: false,
        flags: 0,
        pending: false,
        permissions: '0',
        communication_disabled_until: null,
      }));

      const mockTransformedData = Array.from({ length: 1000 }, (_, i) => ({
        discord_id: `user_${i.toString().padStart(4, '0')}`,
        discord_username_display: `user${i}`,
        discord_username_actual: `user${i}`,
        server_join_date: '2024-01-01T00:00:00.000Z',
        is_banned: false,
        is_active: true,
        last_updated: '2024-01-01T00:00:00.000Z',
      }));

      vi.mocked(discordMembers.fetchGuildMembers).mockResolvedValue({
        success: true,
        members: mockMembers,
      });
      vi.mocked(discordMembers.transformMemberData).mockReturnValue(mockTransformedData);
      vi.mocked(discordMembers.filterNewMembers).mockReturnValue(mockTransformedData);

      // Mock Google Sheets for large dataset
      const mockOAuth = {
        setCredentials: vi.fn().mockReturnThis(),
        getAccessToken: vi.fn().mockResolvedValue('mock_access_token'),
      };
      vi.mocked(googleSheetsBuilder.GoogleOAuthBuilder.create).mockReturnValue(mockOAuth as any);

      const mockSheetsApi = {
        setSpreadsheetId: vi.fn().mockReturnThis(),
        setRange: vi.fn().mockReturnThis(),
        setAccessToken: vi.fn().mockReturnThis(),
        setValues: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ success: true, values: [['header']] }),
        append: vi.fn().mockResolvedValue({ success: true }),
      };
      vi.mocked(googleSheetsBuilder.GoogleSheetsApiBuilder.create).mockReturnValue(
        mockSheetsApi as any
      );

      vi.mocked(googleSheetsBuilder.createMemberRow).mockImplementation(member => [
        member.discord_id,
        member.discord_username_display,
        member.discord_username_actual,
        member.server_join_date,
        member.is_banned.toString(),
        member.is_active.toString(),
        member.last_updated ?? '2024-01-01T00:00:00.000Z',
      ]);

      vi.mocked(discordUtils.updateDeferredResponse).mockResolvedValue();

      // Act
      await executeAdminSyncAndNotify(mockInteraction, mockEnv, mockSyncParams);

      // Assert
      expect(discordUtils.updateDeferredResponse).toHaveBeenCalledWith(
        mockEnv.DISCORD_APPLICATION_ID,
        mockInteraction.token,
        '✅ Successfully synced 1000 new members to sheets'
      );
    });
  });

  describe('Error Handling - Google Sheets Failures', () => {
    it('should handle Google Sheets OAuth authentication failure', async () => {
      // Arrange

      // Mock OAuth failure
      const mockOAuth = {
        setCredentials: vi.fn().mockReturnThis(),
        getAccessToken: vi.fn().mockRejectedValue(new Error('OAuth failed: Invalid credentials')),
      };
      vi.mocked(googleSheetsBuilder.GoogleOAuthBuilder.create).mockReturnValue(mockOAuth as any);

      vi.mocked(discordUtils.updateDeferredResponse).mockResolvedValue();

      // Act
      await executeAdminSyncAndNotify(mockInteraction, mockEnv, mockSyncParams);

      // Assert
      expect(discordUtils.updateDeferredResponse).toHaveBeenCalledWith(
        mockEnv.DISCORD_APPLICATION_ID,
        mockInteraction.token,
        '❌ Sync failed: Google Sheets configuration error'
      );
    });

    it('should handle Google Sheets API write failure', async () => {
      // Arrange

      // Mock successful Discord fetch but failed Sheets write
      vi.mocked(discordMembers.fetchGuildMembers).mockResolvedValue({
        success: true,
        members: [
          {
            user: {
              id: 'user_1',
              username: 'testuser',
              discriminator: '0000',
              global_name: null,
              avatar: null,
              bot: false,
            },
            nick: null,
            roles: [],
            joined_at: '2024-01-01T00:00:00.000Z',
            premium_since: null,
            deaf: false,
            mute: false,
            flags: 0,
            pending: false,
            permissions: '0',
            communication_disabled_until: null,
          },
        ],
      });

      vi.mocked(discordMembers.transformMemberData).mockReturnValue([
        {
          discord_id: 'user_1',
          discord_username_display: 'testuser',
          discord_username_actual: 'testuser',
          server_join_date: '2024-01-01T00:00:00.000Z',
          is_banned: false,
          is_active: true,
          last_updated: '2024-01-01T00:00:00.000Z',
        },
      ]);

      vi.mocked(discordMembers.filterNewMembers).mockReturnValue([
        {
          discord_id: 'user_1',
          discord_username_display: 'testuser',
          discord_username_actual: 'testuser',
          server_join_date: '2024-01-01T00:00:00.000Z',
          is_banned: false,
          is_active: true,
          last_updated: '2024-01-01T00:00:00.000Z',
        },
      ]);

      // Mock successful OAuth but failed append
      const mockOAuth = {
        setCredentials: vi.fn().mockReturnThis(),
        getAccessToken: vi.fn().mockResolvedValue('mock_access_token'),
      };
      vi.mocked(googleSheetsBuilder.GoogleOAuthBuilder.create).mockReturnValue(mockOAuth as any);

      const mockSheetsApi = {
        setSpreadsheetId: vi.fn().mockReturnThis(),
        setRange: vi.fn().mockReturnThis(),
        setAccessToken: vi.fn().mockReturnThis(),
        setValues: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ success: true, values: [['header']] }),
        append: vi.fn().mockResolvedValue({ success: false, error: 'Quota exceeded' }),
      };
      vi.mocked(googleSheetsBuilder.GoogleSheetsApiBuilder.create).mockReturnValue(
        mockSheetsApi as any
      );

      vi.mocked(googleSheetsBuilder.createMemberRow).mockReturnValue([
        'user_1',
        'testuser',
        'testuser',
        '2024-01-01T00:00:00.000Z',
        'false',
        'true',
        '2024-01-01T00:00:00.000Z',
      ]);

      vi.mocked(discordUtils.updateDeferredResponse).mockResolvedValue();

      // Act
      await executeAdminSyncAndNotify(mockInteraction, mockEnv, mockSyncParams);

      // Assert
      expect(discordUtils.updateDeferredResponse).toHaveBeenCalledWith(
        mockEnv.DISCORD_APPLICATION_ID,
        mockInteraction.token,
        '❌ Sync failed: Could not update Google Sheets'
      );
    });
  });

  describe('Error Handling - Discord API Failures', () => {
    it('should handle Discord member fetch failure', async () => {
      // Arrange

      // Mock Discord API failure
      vi.mocked(discordMembers.fetchGuildMembers).mockResolvedValue({
        success: false,
        error: 'Bot lacks permission: Missing "View Server Members"',
      });

      vi.mocked(discordUtils.updateDeferredResponse).mockResolvedValue();

      // Act
      await executeAdminSyncAndNotify(mockInteraction, mockEnv, mockSyncParams);

      // Assert
      expect(discordUtils.updateDeferredResponse).toHaveBeenCalledWith(
        mockEnv.DISCORD_APPLICATION_ID,
        mockInteraction.token,
        '❌ Sync failed: Bot needs "View Server Members" permission'
      );
    });

    it('should handle Discord API rate limiting', async () => {
      // Arrange

      // Mock Discord API rate limiting
      vi.mocked(discordMembers.fetchGuildMembers).mockResolvedValue({
        success: false,
        error: 'Discord API error (429): Too Many Requests',
      });

      vi.mocked(discordUtils.updateDeferredResponse).mockResolvedValue();

      // Act
      await executeAdminSyncAndNotify(mockInteraction, mockEnv, mockSyncParams);

      // Assert
      expect(discordUtils.updateDeferredResponse).toHaveBeenCalledWith(
        mockEnv.DISCORD_APPLICATION_ID,
        mockInteraction.token,
        '❌ Sync failed: Discord service temporarily unavailable'
      );
    });
  });

  describe('Error Handling - Network Failures', () => {
    it('should handle network timeout during Discord fetch', async () => {
      // Arrange

      // Mock network timeout
      vi.mocked(discordMembers.fetchGuildMembers).mockRejectedValue(
        new Error('Network timeout: Request took too long')
      );

      vi.mocked(discordUtils.updateDeferredResponse).mockResolvedValue();

      // Act
      await executeAdminSyncAndNotify(mockInteraction, mockEnv, mockSyncParams);

      // Assert
      expect(discordUtils.updateDeferredResponse).toHaveBeenCalledWith(
        mockEnv.DISCORD_APPLICATION_ID,
        mockInteraction.token,
        '❌ Sync failed: Unexpected error - check server logs'
      );
    });

    it('should handle unknown error types gracefully', async () => {
      // Arrange

      // Mock unknown error type
      vi.mocked(discordMembers.fetchGuildMembers).mockRejectedValue(
        new Error('Something completely unexpected happened')
      );

      vi.mocked(discordUtils.updateDeferredResponse).mockResolvedValue();

      // Act
      await executeAdminSyncAndNotify(mockInteraction, mockEnv, mockSyncParams);

      // Assert
      expect(discordUtils.updateDeferredResponse).toHaveBeenCalledWith(
        mockEnv.DISCORD_APPLICATION_ID,
        mockInteraction.token,
        '❌ Sync failed: Unexpected error - check server logs'
      );
    });
  });
});
