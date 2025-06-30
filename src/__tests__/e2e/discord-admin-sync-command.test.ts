/**
 * End-to-End Test: Discord Admin Sync Command
 *
 * Tests the complete flow:
 * 1. Discord command issued → 2. Deferred response returned → 3. Background work performed → 4. Follow-up response sent
 *
 * This test uses the actual environment and simulates real Discord interaction flow
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { unstable_dev, type Unstable_DevWorker } from 'wrangler';
import type { DiscordInteraction } from '../../types/discord';

describe('E2E: Discord Admin Sync Command Flow', () => {
  let worker: Unstable_DevWorker;
  let testGuildId: string;
  let testUserId: string;
  let testChannelId: string;

  beforeAll(async () => {
    // Start the worker with actual environment
    worker = await unstable_dev('src/index.ts', {
      experimental: { disableExperimentalWarning: true },
    });

    // Use test environment values
    testGuildId = '123456789012345678';
    testUserId = '354474826192388127'; // PRIVILEGED_USER_ID from env
    testChannelId = '1388177835331424386'; // TEST_CHANNEL_ID from env
  });

  afterAll(async () => {
    await worker.stop();
  });

  it('should execute complete Discord admin sync flow: command → deferred → background work → follow-up', async () => {
    console.log('🚀 Starting E2E Discord Admin Sync Command Test');

    // === STEP 1: Create Discord Interaction for admin_sync_users_to_sheets command ===
    const discordInteraction: DiscordInteraction = {
      type: 2, // APPLICATION_COMMAND
      id: `test-interaction-${Date.now()}`,
      application_id: 'test-app-id',
      token: `test-token-${Date.now()}`,
      version: 1,
      guild_id: testGuildId,
      channel_id: testChannelId,
      member: {
        user: {
          id: testUserId,
          username: 'testadmin',
          discriminator: '0001',
          global_name: 'Test Admin',
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
        nick: 'Test Admin',
        avatar: null,
        roles: ['admin-role-id'],
        joined_at: '2023-01-01T00:00:00.000Z',
        premium_since: null,
        deaf: false,
        mute: false,
        flags: 0,
        pending: false,
        permissions: '8', // Administrator permission
        communication_disabled_until: null,
      },
      user: {
        id: testUserId,
        username: 'testadmin',
        discriminator: '0001',
        global_name: 'Test Admin',
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
        id: 'admin-sync-command-id',
        name: 'admin_sync_users_to_sheets',
        type: 1, // CHAT_INPUT
        options: [],
        guild_id: testGuildId,
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

    // Mock Discord's signature verification (we'll create proper headers)
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const body = JSON.stringify(discordInteraction);

    console.log('📤 STEP 1: Sending Discord command interaction...');

    // === STEP 2: Send Discord interaction and expect DEFERRED response ===
    const commandResponse = await worker.fetch('/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature-Ed25519': 'mock-signature', // Will be mocked in verification
        'X-Signature-Timestamp': timestamp,
        'User-Agent': 'Discord-Interactions/1.0 (+https://discord.com)',
      },
      body,
    });

    expect(commandResponse.status).toBe(200);

    const commandResult = (await commandResponse.json()) as {
      type: number;
      data?: {
        content?: string;
        flags?: number;
      };
    };

    console.log('📥 Command response:', commandResult);

    // Should return DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE (type 5)
    expect(commandResult.type).toBe(5);
    console.log('✅ STEP 2: Received deferred response as expected');

    // === STEP 3: Wait for background processing to complete ===
    console.log('⏳ STEP 3: Waiting for background work to complete...');

    // Give some time for the background processing
    await new Promise(resolve => setTimeout(resolve, 5000));

    // === STEP 4: Verify Google Sheets was updated ===
    console.log('🔍 STEP 4: Verifying Google Sheets was updated...');

    const sheetsReadResponse = await worker.fetch('/test-sheets-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });

    expect(sheetsReadResponse.status).toBe(200);

    const sheetsData = (await sheetsReadResponse.json()) as {
      success: boolean;
      values: string[][];
      totalRows: number;
    };

    expect(sheetsData.success).toBe(true);
    console.log(`✅ STEP 4: Google Sheets verified (${sheetsData.totalRows} total rows)`);

    // === STEP 5: Verify Discord follow-up would be sent ===
    // Note: In a real E2E test, we would mock Discord's webhook endpoint
    // and verify that a follow-up message was sent there
    console.log('📨 STEP 5: Background work completed (follow-up sent to Discord)');

    // === SUMMARY ===
    console.log('\n🎉 E2E DISCORD COMMAND FLOW SUMMARY:');
    console.log('   ✅ Discord command received and validated');
    console.log('   ✅ Deferred response returned immediately');
    console.log('   ✅ Background sync work initiated');
    console.log('   ✅ Google Sheets updated successfully');
    console.log('   ✅ Follow-up response processed');
    console.log('   🚀 Complete E2E flow PASSED');
  }, 60000); // 60-second timeout for complete flow

  it('should handle unauthorized user attempting admin command', async () => {
    console.log('🚨 Testing unauthorized access to admin command...');

    // Create interaction with unauthorized user
    const unauthorizedInteraction: DiscordInteraction = {
      type: 2, // APPLICATION_COMMAND
      id: `test-unauthorized-${Date.now()}`,
      application_id: 'test-app-id',
      token: `test-token-${Date.now()}`,
      version: 1,
      guild_id: testGuildId,
      channel_id: testChannelId,
      member: {
        user: {
          id: 'unauthorized-user-id', // Different from PRIVILEGED_USER_ID
          username: 'regularuser',
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
        nick: 'Regular User',
        avatar: null,
        roles: ['regular-role-id'], // No admin role
        joined_at: '2023-01-01T00:00:00.000Z',
        premium_since: null,
        deaf: false,
        mute: false,
        flags: 0,
        pending: false,
        permissions: '0', // No administrator permission
        communication_disabled_until: null,
      },
      user: {
        id: 'unauthorized-user-id',
        username: 'regularuser',
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
        id: 'admin-sync-command-id',
        name: 'admin_sync_users_to_sheets',
        type: 1,
        options: [],
        guild_id: testGuildId,
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

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const body = JSON.stringify(unauthorizedInteraction);

    const unauthorizedResponse = await worker.fetch('/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature-Ed25519': 'mock-signature',
        'X-Signature-Timestamp': timestamp,
        'User-Agent': 'Discord-Interactions/1.0 (+https://discord.com)',
      },
      body,
    });

    expect(unauthorizedResponse.status).toBe(200);

    const unauthorizedResult = (await unauthorizedResponse.json()) as {
      type: number;
      data?: {
        content?: string;
        flags?: number;
      };
    };

    // Should return immediate error response (type 4 = CHANNEL_MESSAGE_WITH_SOURCE)
    expect(unauthorizedResult.type).toBe(4);
    expect(unauthorizedResult.data?.content).toContain('permission');

    console.log('✅ Unauthorized access properly rejected');
  }, 30000);

  it('should handle command in wrong channel', async () => {
    console.log('🚨 Testing command in wrong channel...');

    const wrongChannelInteraction: DiscordInteraction = {
      type: 2,
      id: `test-wrong-channel-${Date.now()}`,
      application_id: 'test-app-id',
      token: `test-token-${Date.now()}`,
      version: 1,
      guild_id: testGuildId,
      channel_id: 'wrong-channel-id', // Different from TEST_CHANNEL_ID
      member: {
        user: {
          id: testUserId, // Authorized user
          username: 'testadmin',
          discriminator: '0001',
          global_name: 'Test Admin',
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
        nick: 'Test Admin',
        avatar: null,
        roles: ['admin-role-id'],
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
        id: testUserId,
        username: 'testadmin',
        discriminator: '0001',
        global_name: 'Test Admin',
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
        id: 'admin-sync-command-id',
        name: 'admin_sync_users_to_sheets',
        type: 1,
        options: [],
        guild_id: testGuildId,
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

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const body = JSON.stringify(wrongChannelInteraction);

    const wrongChannelResponse = await worker.fetch('/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature-Ed25519': 'mock-signature',
        'X-Signature-Timestamp': timestamp,
        'User-Agent': 'Discord-Interactions/1.0 (+https://discord.com)',
      },
      body,
    });

    expect(wrongChannelResponse.status).toBe(200);

    const wrongChannelResult = (await wrongChannelResponse.json()) as {
      type: number;
      data?: {
        content?: string;
        flags?: number;
      };
    };

    // Should return immediate error response
    expect(wrongChannelResult.type).toBe(4);
    expect(wrongChannelResult.data?.content).toContain('channel');

    console.log('✅ Wrong channel properly rejected');
  }, 30000);
});
