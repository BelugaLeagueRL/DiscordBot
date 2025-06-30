/**
 * Integration Test: Discord Command Validation
 *
 * Tests the integration between Discord interaction parsing and admin validation
 * Uses controlled mocking to test specific validation scenarios
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleAdminSyncUsersToSheetsDiscord } from '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler';
import type { DiscordInteraction } from '../../types/discord';
import type { Env } from '../../index';

describe('Integration: Discord Command Validation', () => {
  let mockEnv: Env;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    vi.clearAllMocks();

    mockEnv = {
      DISCORD_TOKEN: 'test-token',
      DISCORD_PUBLIC_KEY: 'test-key',
      DISCORD_APPLICATION_ID: 'test-app-id',
      ENVIRONMENT: 'test',
      TEST_CHANNEL_ID: '1388177835331424386',
      PRIVILEGED_USER_ID: '354474826192388127',
      GOOGLE_SHEET_ID: 'test-sheet-id',
      GOOGLE_SHEETS_CLIENT_EMAIL: 'test@example.com',
      GOOGLE_SHEETS_PRIVATE_KEY: 'test-key',
    } as Env;

    mockContext = {
      waitUntil: vi.fn(),
      passThroughOnException: vi.fn(),
    } as unknown as ExecutionContext;
  });

  it('should integrate Discord parsing with admin validation - authorized user', async () => {
    console.log('🧪 Testing authorized user validation integration...');

    // Create valid Discord interaction
    const authorizedInteraction: DiscordInteraction = {
      type: 2,
      id: 'test-interaction',
      application_id: 'test-app',
      token: 'test-token',
      version: 1,
      guild_id: '123456789012345678',
      channel_id: '1388177835331424386', // Matches TEST_CHANNEL_ID
      member: {
        user: {
          id: '354474826192388127', // Matches PRIVILEGED_USER_ID
          username: 'admin',
          discriminator: '0001',
          global_name: 'Admin User',
          avatar: null,
          bot: false,
          system: false,
          mfa_enabled: true,
          banner: null,
          accent_color: null,
          locale: 'en-US',
          verified: true,
          email: null,
          flags: 0,
          premium_type: 0,
          public_flags: 0,
        },
        nick: 'Admin',
        avatar: null,
        roles: ['admin-role'],
        joined_at: '2023-01-01T00:00:00.000Z',
        premium_since: null,
        deaf: false,
        mute: false,
        flags: 0,
        pending: false,
        permissions: '8', // Administrator
        communication_disabled_until: null,
      },
      user: {
        id: '354474826192388127',
        username: 'admin',
        discriminator: '0001',
        global_name: 'Admin User',
        avatar: null,
        bot: false,
        system: false,
        mfa_enabled: true,
        banner: null,
        accent_color: null,
        locale: 'en-US',
        verified: true,
        email: null,
        flags: 0,
        premium_type: 0,
        public_flags: 0,
      },
      data: {
        id: 'command-id',
        name: 'admin_sync_users_to_sheets',
        type: 1,
        options: [],
        guild_id: '123456789012345678',
        target_id: null,
        resolved: {
          users: {},
          members: {},
          roles: {},
          channels: {},
          messages: {},
          attachments: {},
        },
      },
      locale: 'en-US',
      guild_locale: 'en-US',
    };

    // Call the handler and expect deferred response
    const response = handleAdminSyncUsersToSheetsDiscord(
      authorizedInteraction,
      mockContext,
      mockEnv
    );

    expect(response.status).toBe(200);

    const responseData = (await response.json()) as {
      type: number;
    };

    // Should return DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
    expect(responseData.type).toBe(5);

    // Verify background work was initiated
    expect(mockContext.waitUntil).toHaveBeenCalledTimes(1);

    console.log('✅ Authorized user validation integration working');
  });

  it('should integrate Discord parsing with admin validation - unauthorized user', async () => {
    console.log('🧪 Testing unauthorized user validation integration...');

    const unauthorizedInteraction: DiscordInteraction = {
      type: 2,
      id: 'test-interaction',
      application_id: 'test-app',
      token: 'test-token',
      version: 1,
      guild_id: '123456789012345678',
      channel_id: '1388177835331424386',
      member: {
        user: {
          id: 'unauthorized-user-id', // Different from PRIVILEGED_USER_ID
          username: 'regular',
          discriminator: '0002',
          global_name: 'Regular User',
          avatar: null,
          bot: false,
          system: false,
          mfa_enabled: false,
          banner: null,
          accent_color: null,
          locale: 'en-US',
          verified: true,
          email: null,
          flags: 0,
          premium_type: 0,
          public_flags: 0,
        },
        nick: 'Regular',
        avatar: null,
        roles: ['regular-role'],
        joined_at: '2023-01-01T00:00:00.000Z',
        premium_since: null,
        deaf: false,
        mute: false,
        flags: 0,
        pending: false,
        permissions: '0', // No admin permissions
        communication_disabled_until: null,
      },
      user: {
        id: 'unauthorized-user-id',
        username: 'regular',
        discriminator: '0002',
        global_name: 'Regular User',
        avatar: null,
        bot: false,
        system: false,
        mfa_enabled: false,
        banner: null,
        accent_color: null,
        locale: 'en-US',
        verified: true,
        email: null,
        flags: 0,
        premium_type: 0,
        public_flags: 0,
      },
      data: {
        id: 'command-id',
        name: 'admin_sync_users_to_sheets',
        type: 1,
        options: [],
        guild_id: '123456789012345678',
        target_id: null,
        resolved: {
          users: {},
          members: {},
          roles: {},
          channels: {},
          messages: {},
          attachments: {},
        },
      },
      locale: 'en-US',
      guild_locale: 'en-US',
    };

    const response = handleAdminSyncUsersToSheetsDiscord(
      unauthorizedInteraction,
      mockContext,
      mockEnv
    );

    expect(response.status).toBe(200);

    const responseData = (await response.json()) as {
      type: number;
      data: {
        content: string;
        flags?: number;
      };
    };

    // Should return immediate error response
    expect(responseData.type).toBe(4); // CHANNEL_MESSAGE_WITH_SOURCE
    expect(responseData.data.content).toContain('permission');

    // Should NOT initiate background work
    expect(mockContext.waitUntil).not.toHaveBeenCalled();

    console.log('✅ Unauthorized user validation integration working');
  });

  it('should integrate Discord parsing with channel validation', async () => {
    console.log('🧪 Testing channel validation integration...');

    const wrongChannelInteraction: DiscordInteraction = {
      type: 2,
      id: 'test-interaction',
      application_id: 'test-app',
      token: 'test-token',
      version: 1,
      guild_id: '123456789012345678',
      channel_id: 'wrong-channel-id', // Different from TEST_CHANNEL_ID
      member: {
        user: {
          id: '354474826192388127', // Authorized user
          username: 'admin',
          discriminator: '0001',
          global_name: 'Admin User',
          avatar: null,
          bot: false,
          system: false,
          mfa_enabled: true,
          banner: null,
          accent_color: null,
          locale: 'en-US',
          verified: true,
          email: null,
          flags: 0,
          premium_type: 0,
          public_flags: 0,
        },
        nick: 'Admin',
        avatar: null,
        roles: ['admin-role'],
        joined_at: '2023-01-01T00:00:00.000Z',
        premium_since: null,
        deaf: false,
        mute: false,
        flags: 0,
        pending: false,
        permissions: '8',
        communication_disabled_until: null,
      },
      user: {
        id: '354474826192388127',
        username: 'admin',
        discriminator: '0001',
        global_name: 'Admin User',
        avatar: null,
        bot: false,
        system: false,
        mfa_enabled: true,
        banner: null,
        accent_color: null,
        locale: 'en-US',
        verified: true,
        email: null,
        flags: 0,
        premium_type: 0,
        public_flags: 0,
      },
      data: {
        id: 'command-id',
        name: 'admin_sync_users_to_sheets',
        type: 1,
        options: [],
        guild_id: '123456789012345678',
        target_id: null,
        resolved: {
          users: {},
          members: {},
          roles: {},
          channels: {},
          messages: {},
          attachments: {},
        },
      },
      locale: 'en-US',
      guild_locale: 'en-US',
    };

    const response = handleAdminSyncUsersToSheetsDiscord(
      wrongChannelInteraction,
      mockContext,
      mockEnv
    );

    expect(response.status).toBe(200);

    const responseData = (await response.json()) as {
      type: number;
      data: {
        content: string;
        flags?: number;
      };
    };

    // Should return immediate error response
    expect(responseData.type).toBe(4);
    expect(responseData.data.content).toContain('channel');

    // Should NOT initiate background work
    expect(mockContext.waitUntil).not.toHaveBeenCalled();

    console.log('✅ Channel validation integration working');
  });

  it('should integrate validation with background work initiation', async () => {
    console.log('🧪 Testing validation → background work integration...');

    // Mock the background sync function to verify it gets called correctly
    const mockSyncFunction = vi.fn().mockResolvedValue({
      success: true,
      stats: { newUsersAdded: 5 },
    });

    // Mock the Google Sheets credentials building
    vi.mock('../../utils/google-sheets-builder', () => ({
      GoogleSheetsCredentials: {},
    }));

    const validInteraction: DiscordInteraction = {
      type: 2,
      id: 'test-interaction',
      application_id: 'test-app',
      token: 'test-token',
      version: 1,
      guild_id: '123456789012345678',
      channel_id: '1388177835331424386',
      member: {
        user: {
          id: '354474826192388127',
          username: 'admin',
          discriminator: '0001',
          global_name: 'Admin User',
          avatar: null,
          bot: false,
          system: false,
          mfa_enabled: true,
          banner: null,
          accent_color: null,
          locale: 'en-US',
          verified: true,
          email: null,
          flags: 0,
          premium_type: 0,
          public_flags: 0,
        },
        nick: 'Admin',
        avatar: null,
        roles: ['admin-role'],
        joined_at: '2023-01-01T00:00:00.000Z',
        premium_since: null,
        deaf: false,
        mute: false,
        flags: 0,
        pending: false,
        permissions: '8',
        communication_disabled_until: null,
      },
      user: {
        id: '354474826192388127',
        username: 'admin',
        discriminator: '0001',
        global_name: 'Admin User',
        avatar: null,
        bot: false,
        system: false,
        mfa_enabled: true,
        banner: null,
        accent_color: null,
        locale: 'en-US',
        verified: true,
        email: null,
        flags: 0,
        premium_type: 0,
        public_flags: 0,
      },
      data: {
        id: 'command-id',
        name: 'admin_sync_users_to_sheets',
        type: 1,
        options: [],
        guild_id: '123456789012345678',
        target_id: null,
        resolved: {
          users: {},
          members: {},
          roles: {},
          channels: {},
          messages: {},
          attachments: {},
        },
      },
      locale: 'en-US',
      guild_locale: 'en-US',
    };

    const response = handleAdminSyncUsersToSheetsDiscord(validInteraction, mockContext, mockEnv);

    expect(response.status).toBe(200);

    const responseData = (await response.json()) as {
      type: number;
    };

    // Should return deferred response
    expect(responseData.type).toBe(5);

    // Verify background work was initiated via waitUntil
    expect(mockContext.waitUntil).toHaveBeenCalledTimes(1);
    expect(mockContext.waitUntil).toHaveBeenCalledWith(expect.any(Promise));

    console.log('✅ Validation → background work integration working');
  });
});
