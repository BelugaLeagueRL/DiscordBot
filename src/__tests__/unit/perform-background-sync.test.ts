/**
 * Unit tests for performBackgroundSync function - comprehensive testing
 * Tests success scenarios, Google Sheets failures, Discord API failures, and error handling
 * Following TDD Red-Green-Refactor with anti-pattern prevention
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from '../../index';

// Mock all external dependencies for unit testing
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

describe('performBackgroundSync', () => {
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

  describe('Success Scenarios', () => {
    it('should successfully sync 0 new members (empty guild)', async () => {
      const { performBackgroundSync } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler'
      );
      const discordMembers = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );
      const googleSheetsBuilder = await import('../../utils/google-sheets-builder');

      vi.mocked(discordMembers.fetchGuildMembers).mockResolvedValue({
        success: true,
        members: [],
      });
      vi.mocked(discordMembers.transformMemberData).mockReturnValue([]);
      vi.mocked(discordMembers.filterNewMembers).mockReturnValue([]);

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

      const result = await performBackgroundSync(mockSyncParams, mockEnv);

      expect(result.newMembersAdded).toBe(0);
      expect(discordMembers.fetchGuildMembers).toHaveBeenCalledWith('test_guild_123', mockEnv);
      expect(googleSheetsBuilder.GoogleOAuthBuilder.create).toHaveBeenCalled();
    });

    it('should successfully sync 10 new members', async () => {
      // Arrange
      const { performBackgroundSync } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler'
      );
      const discordMembers = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );
      const googleSheetsBuilder = await import('../../utils/google-sheets-builder');

      // Mock 10 members
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

      // Act
      const result = await performBackgroundSync(mockSyncParams, mockEnv);

      // Assert
      expect(result.newMembersAdded).toBe(10);
      expect(mockSheetsApi.append).toHaveBeenCalled();
    });

    it('should successfully sync 1000 new members (performance boundary)', async () => {
      // Arrange
      const { performBackgroundSync } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler'
      );
      const discordMembers = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );
      const googleSheetsBuilder = await import('../../utils/google-sheets-builder');

      // Mock 1000 members for performance testing
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

      // Act
      const result = await performBackgroundSync(mockSyncParams, mockEnv);

      // Assert
      expect(result.newMembersAdded).toBe(1000);
      expect(mockSheetsApi.append).toHaveBeenCalled();
    });

    it('should handle duplicate filtering correctly', async () => {
      // Arrange
      const { performBackgroundSync } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler'
      );
      const discordMembers = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );
      const googleSheetsBuilder = await import('../../utils/google-sheets-builder');

      // Mock 5 members but only 2 are new after filtering
      const mockMembers = Array.from({ length: 5 }, (_, i) => ({
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

      const mockTransformedData = Array.from({ length: 5 }, (_, i) => ({
        discord_id: `user_${i}`,
        discord_username_display: `user${i}`,
        discord_username_actual: `user${i}`,
        server_join_date: '2024-01-01T00:00:00.000Z',
        is_banned: false,
        is_active: true,
        last_updated: '2024-01-01T00:00:00.000Z',
      }));

      // Only 2 members are new after filtering
      const mockFilteredData = mockTransformedData.slice(0, 2);

      vi.mocked(discordMembers.fetchGuildMembers).mockResolvedValue({
        success: true,
        members: mockMembers,
      });
      vi.mocked(discordMembers.transformMemberData).mockReturnValue(mockTransformedData);
      vi.mocked(discordMembers.filterNewMembers).mockReturnValue(mockFilteredData);

      // Mock Google Sheets with existing data
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
        get: vi.fn().mockResolvedValue({
          success: true,
          values: [['Discord ID'], ['user_2'], ['user_3'], ['user_4']],
        }),
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

      // Act
      const result = await performBackgroundSync(mockSyncParams, mockEnv);

      // Assert
      expect(result.newMembersAdded).toBe(2);
      expect(discordMembers.filterNewMembers).toHaveBeenCalledWith(
        mockTransformedData,
        expect.any(Set)
      );
    });
  });

  describe('Google Sheets OAuth Failures', () => {
    it('should throw when OAuth authentication fails', async () => {
      const { performBackgroundSync } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler'
      );
      const googleSheetsBuilder = await import('../../utils/google-sheets-builder');

      const mockOAuth = {
        setCredentials: vi.fn().mockReturnThis(),
        getAccessToken: vi.fn().mockRejectedValue(new Error('OAuth failed: Invalid credentials')),
      };
      vi.mocked(googleSheetsBuilder.GoogleOAuthBuilder.create).mockReturnValue(mockOAuth as any);

      await expect(performBackgroundSync(mockSyncParams, mockEnv)).rejects.toThrow(
        'OAuth failed: Invalid credentials'
      );
    });

    it('should throw when OAuth returns invalid token', async () => {
      const { performBackgroundSync } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler'
      );
      const googleSheetsBuilder = await import('../../utils/google-sheets-builder');

      const mockOAuth = {
        setCredentials: vi.fn().mockReturnThis(),
        getAccessToken: vi.fn().mockResolvedValue(''),
      };
      vi.mocked(googleSheetsBuilder.GoogleOAuthBuilder.create).mockReturnValue(mockOAuth as any);

      const mockSheetsApi = {
        setSpreadsheetId: vi.fn().mockReturnThis(),
        setRange: vi.fn().mockReturnThis(),
        setAccessToken: vi.fn().mockReturnThis(),
        get: vi.fn().mockRejectedValue(new Error('Invalid authentication token')),
      };
      vi.mocked(googleSheetsBuilder.GoogleSheetsApiBuilder.create).mockReturnValue(
        mockSheetsApi as any
      );

      await expect(performBackgroundSync(mockSyncParams, mockEnv)).rejects.toThrow(
        'Invalid authentication token'
      );
    });
  });

  describe('Discord API Failures', () => {
    it('should throw when Discord member fetch fails', async () => {
      const { performBackgroundSync } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler'
      );
      const discordMembers = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );
      const googleSheetsBuilder = await import('../../utils/google-sheets-builder');

      const mockOAuth = {
        setCredentials: vi.fn().mockReturnThis(),
        getAccessToken: vi.fn().mockResolvedValue('mock_access_token'),
      };
      vi.mocked(googleSheetsBuilder.GoogleOAuthBuilder.create).mockReturnValue(mockOAuth as any);

      vi.mocked(discordMembers.fetchGuildMembers).mockResolvedValue({
        success: false,
        error: 'Failed to fetch members: Bot lacks permission',
      });

      await expect(performBackgroundSync(mockSyncParams, mockEnv)).rejects.toThrow(
        'Failed to fetch members: Bot lacks permission'
      );
    });

    it('should throw when Discord returns invalid member data', async () => {
      const { performBackgroundSync } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler'
      );
      const discordMembers = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );
      const googleSheetsBuilder = await import('../../utils/google-sheets-builder');

      const mockOAuth = {
        setCredentials: vi.fn().mockReturnThis(),
        getAccessToken: vi.fn().mockResolvedValue('mock_access_token'),
      };
      vi.mocked(googleSheetsBuilder.GoogleOAuthBuilder.create).mockReturnValue(mockOAuth as any);

      vi.mocked(discordMembers.fetchGuildMembers).mockResolvedValue({
        success: false,
        error: 'Invalid member data received from Discord API',
      });

      await expect(performBackgroundSync(mockSyncParams, mockEnv)).rejects.toThrow(
        'Invalid member data received from Discord API'
      );
    });
  });

  describe('Google Sheets API Failures', () => {
    it('should throw when existing data read fails', async () => {
      const { performBackgroundSync } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler'
      );
      const discordMembers = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );
      const googleSheetsBuilder = await import('../../utils/google-sheets-builder');

      vi.mocked(discordMembers.fetchGuildMembers).mockResolvedValue({
        success: true,
        members: [],
      });
      vi.mocked(discordMembers.transformMemberData).mockReturnValue([]);

      const mockOAuth = {
        setCredentials: vi.fn().mockReturnThis(),
        getAccessToken: vi.fn().mockResolvedValue('mock_access_token'),
      };
      vi.mocked(googleSheetsBuilder.GoogleOAuthBuilder.create).mockReturnValue(mockOAuth as any);

      const mockSheetsApi = {
        setSpreadsheetId: vi.fn().mockReturnThis(),
        setRange: vi.fn().mockReturnThis(),
        setAccessToken: vi.fn().mockReturnThis(),
        get: vi.fn().mockRejectedValue(new Error('Sheets API error: Permission denied')),
      };
      vi.mocked(googleSheetsBuilder.GoogleSheetsApiBuilder.create).mockReturnValue(
        mockSheetsApi as any
      );

      await expect(performBackgroundSync(mockSyncParams, mockEnv)).rejects.toThrow(
        'Sheets API error: Permission denied'
      );
    });

    it('should throw when member append operation fails', async () => {
      const { performBackgroundSync } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler'
      );
      const discordMembers = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );
      const googleSheetsBuilder = await import('../../utils/google-sheets-builder');

      const mockMemberData = [
        {
          discord_id: 'user_1',
          discord_username_display: 'testuser',
          discord_username_actual: 'testuser',
          server_join_date: '2024-01-01T00:00:00.000Z',
          is_banned: false,
          is_active: true,
          last_updated: '2024-01-01T00:00:00.000Z',
        },
      ];

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
      vi.mocked(discordMembers.transformMemberData).mockReturnValue(mockMemberData);
      vi.mocked(discordMembers.filterNewMembers).mockReturnValue(mockMemberData);

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

      vi.mocked(googleSheetsBuilder.createMemberRow).mockImplementation(member => [
        member.discord_id,
        member.discord_username_display,
        member.discord_username_actual,
        member.server_join_date,
        member.is_banned.toString(),
        member.is_active.toString(),
        member.last_updated ?? '2024-01-01T00:00:00.000Z',
      ]);

      await expect(performBackgroundSync(mockSyncParams, mockEnv)).rejects.toThrow(
        'Failed to append members: Quota exceeded'
      );
    });
  });

  describe('Data Processing Edge Cases', () => {
    it('should handle empty existing data correctly', async () => {
      const { performBackgroundSync } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler'
      );
      const discordMembers = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );
      const googleSheetsBuilder = await import('../../utils/google-sheets-builder');

      vi.mocked(discordMembers.fetchGuildMembers).mockResolvedValue({
        success: true,
        members: [],
      });
      vi.mocked(discordMembers.transformMemberData).mockReturnValue([]);
      vi.mocked(discordMembers.filterNewMembers).mockReturnValue([]);

      const mockOAuth = {
        setCredentials: vi.fn().mockReturnThis(),
        getAccessToken: vi.fn().mockResolvedValue('mock_access_token'),
      };
      vi.mocked(googleSheetsBuilder.GoogleOAuthBuilder.create).mockReturnValue(mockOAuth as any);

      const mockSheetsApi = {
        setSpreadsheetId: vi.fn().mockReturnThis(),
        setRange: vi.fn().mockReturnThis(),
        setAccessToken: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ success: true, values: [] }),
      };
      vi.mocked(googleSheetsBuilder.GoogleSheetsApiBuilder.create).mockReturnValue(
        mockSheetsApi as any
      );

      const result = await performBackgroundSync(mockSyncParams, mockEnv);
      expect(result.newMembersAdded).toBe(0);
    });

    it('should handle malformed existing data gracefully', async () => {
      const { performBackgroundSync } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler'
      );
      const discordMembers = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members'
      );
      const googleSheetsBuilder = await import('../../utils/google-sheets-builder');

      vi.mocked(discordMembers.fetchGuildMembers).mockResolvedValue({
        success: true,
        members: [],
      });
      vi.mocked(discordMembers.transformMemberData).mockReturnValue([]);
      vi.mocked(discordMembers.filterNewMembers).mockReturnValue([]);

      const mockOAuth = {
        setCredentials: vi.fn().mockReturnThis(),
        getAccessToken: vi.fn().mockResolvedValue('mock_access_token'),
      };
      vi.mocked(googleSheetsBuilder.GoogleOAuthBuilder.create).mockReturnValue(mockOAuth as any);

      const mockSheetsApi = {
        setSpreadsheetId: vi.fn().mockReturnThis(),
        setRange: vi.fn().mockReturnThis(),
        setAccessToken: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ success: true, values: [null, undefined, '', []] }),
      };
      vi.mocked(googleSheetsBuilder.GoogleSheetsApiBuilder.create).mockReturnValue(
        mockSheetsApi as any
      );

      const result = await performBackgroundSync(mockSyncParams, mockEnv);
      expect(result.newMembersAdded).toBe(0);
    });
  });

  describe('Network and Unknown Errors', () => {
    it('should throw on network timeout during OAuth', async () => {
      const { performBackgroundSync } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler'
      );
      const googleSheetsBuilder = await import('../../utils/google-sheets-builder');

      const mockOAuth = {
        setCredentials: vi.fn().mockReturnThis(),
        getAccessToken: vi
          .fn()
          .mockRejectedValue(new Error('Network timeout: Request took too long')),
      };
      vi.mocked(googleSheetsBuilder.GoogleOAuthBuilder.create).mockReturnValue(mockOAuth as any);

      await expect(performBackgroundSync(mockSyncParams, mockEnv)).rejects.toThrow(
        'Network timeout: Request took too long'
      );
    });

    it('should throw on unknown errors gracefully', async () => {
      const { performBackgroundSync } = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler'
      );
      const googleSheetsBuilder = await import('../../utils/google-sheets-builder');

      const mockOAuth = {
        setCredentials: vi.fn().mockReturnThis(),
        getAccessToken: vi.fn().mockRejectedValue('Non-Error object thrown'),
      };
      vi.mocked(googleSheetsBuilder.GoogleOAuthBuilder.create).mockReturnValue(mockOAuth as any);

      await expect(performBackgroundSync(mockSyncParams, mockEnv)).rejects.toThrow();
    });
  });
});
