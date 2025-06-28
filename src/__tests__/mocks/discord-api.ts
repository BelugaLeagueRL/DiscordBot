/**
 * Mock Service Worker (MSW) setup for Discord API mocking
 */

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { faker } from '@faker-js/faker';

/**
 * Discord API base URL
 */
const DISCORD_API_BASE = 'https://discord.com/api/v10';

/**
 * Mock handlers for Discord API endpoints
 */
export const discordApiHandlers = [
  // Get application commands
  http.get(`${DISCORD_API_BASE}/applications/:appId/commands`, () => {
    return HttpResponse.json([
      {
        id: faker.string.numeric(18),
        type: 1, // CHAT_INPUT
        application_id: faker.string.numeric(18),
        name: 'register',
        description: 'Register your Rocket League tracker URLs',
        options: [
          {
            type: 3, // STRING
            name: 'tracker1',
            description: 'First Rocket League tracker URL',
            required: true,
          },
          {
            type: 3, // STRING
            name: 'tracker2',
            description: 'Second Rocket League tracker URL',
            required: false,
          },
        ],
        version: faker.string.numeric(18),
      },
    ]);
  }),

  // Create application command
  http.post(`${DISCORD_API_BASE}/applications/:appId/commands`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: faker.string.numeric(18),
      type: 1,
      application_id: request.params.appId,
      version: faker.string.numeric(18),
      ...(body as any),
    });
  }),

  // Update application command
  http.patch(`${DISCORD_API_BASE}/applications/:appId/commands/:commandId`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: request.params.commandId,
      type: 1,
      application_id: request.params.appId,
      version: faker.string.numeric(18),
      ...(body as any),
    });
  }),

  // Delete application command
  http.delete(`${DISCORD_API_BASE}/applications/:appId/commands/:commandId`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Get current bot user
  http.get(`${DISCORD_API_BASE}/users/@me`, () => {
    return HttpResponse.json({
      id: faker.string.numeric(18),
      username: 'BelugaBot',
      discriminator: '0',
      global_name: 'Beluga League Bot',
      avatar: faker.string.alphanumeric(32),
      bot: true,
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
    });
  }),

  // Get guild information
  http.get(`${DISCORD_API_BASE}/guilds/:guildId`, ({ request }) => {
    return HttpResponse.json({
      id: request.params.guildId,
      name: 'Test Guild',
      icon: faker.string.alphanumeric(32),
      description: 'A test Discord guild',
      owner_id: faker.string.numeric(18),
      permissions: '0',
      region: 'us-west',
      afk_channel_id: null,
      afk_timeout: 300,
      widget_enabled: false,
      verification_level: 1,
      default_message_notifications: 0,
      explicit_content_filter: 0,
      roles: [],
      emojis: [],
      features: [],
      mfa_level: 0,
      system_channel_id: null,
      max_presences: null,
      max_members: 250000,
      vanity_url_code: null,
      banner: null,
      premium_tier: 0,
      preferred_locale: 'en-US',
    });
  }),

  // Get channel information
  http.get(`${DISCORD_API_BASE}/channels/:channelId`, ({ request }) => {
    return HttpResponse.json({
      id: request.params.channelId,
      type: 0, // GUILD_TEXT
      guild_id: faker.string.numeric(18),
      position: 0,
      name: 'general',
      topic: null,
      nsfw: false,
      last_message_id: faker.string.numeric(18),
      bitrate: null,
      user_limit: null,
      rate_limit_per_user: 0,
      recipients: null,
      icon: null,
      owner_id: null,
      application_id: null,
      parent_id: null,
      last_pin_timestamp: null,
    });
  }),

  // Send message to channel
  http.post(`${DISCORD_API_BASE}/channels/:channelId/messages`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: faker.string.numeric(18),
      type: 0,
      content: (body as any).content ?? '',
      channel_id: request.params.channelId,
      author: {
        id: faker.string.numeric(18),
        username: 'BelugaBot',
        discriminator: '0',
        avatar: faker.string.alphanumeric(32),
        bot: true,
      },
      attachments: [],
      embeds: (body as any).embeds ?? [],
      mentions: [],
      mention_roles: [],
      pinned: false,
      mention_everyone: false,
      tts: false,
      timestamp: new Date().toISOString(),
      edited_timestamp: null,
      flags: 0,
      components: (body as any).components ?? [],
    });
  }),

  // Handle interaction responses (webhook)
  http.post(
    `${DISCORD_API_BASE}/interactions/:interactionId/:interactionToken/callback`,
    async ({ request }) => {
      const body = await request.json();

      // Validate interaction response structure
      const responseType = (body as any).type;
      if (![1, 4, 5, 6, 7].includes(responseType)) {
        return new HttpResponse(null, { status: 400 });
      }

      return new HttpResponse(null, { status: 204 });
    }
  ),

  // Edit original interaction response
  http.patch(
    `${DISCORD_API_BASE}/webhooks/:appId/:interactionToken/messages/@original`,
    async ({ request }) => {
      const body = await request.json();
      return HttpResponse.json({
        id: faker.string.numeric(18),
        type: 0,
        content: (body as any).content ?? '',
        channel_id: faker.string.numeric(18),
        author: {
          id: request.params.appId,
          username: 'BelugaBot',
          discriminator: '0',
          avatar: faker.string.alphanumeric(32),
          bot: true,
        },
        attachments: [],
        embeds: (body as any).embeds ?? [],
        mentions: [],
        mention_roles: [],
        pinned: false,
        mention_everyone: false,
        tts: false,
        timestamp: new Date().toISOString(),
        edited_timestamp: new Date().toISOString(),
        flags: 64, // EPHEMERAL
        components: (body as any).components ?? [],
      });
    }
  ),

  // Get application
  http.get(`${DISCORD_API_BASE}/applications/@me`, () => {
    return HttpResponse.json({
      id: faker.string.numeric(18),
      name: 'Beluga League Bot',
      icon: faker.string.alphanumeric(32),
      description: 'Discord bot for Rocket League community management',
      bot_public: true,
      bot_require_code_grant: false,
      terms_of_service_url: null,
      privacy_policy_url: null,
      owner: {
        id: faker.string.numeric(18),
        username: 'owner',
        discriminator: '0',
        avatar: faker.string.alphanumeric(32),
      },
      verify_key: faker.string.alphanumeric(64),
      flags: 0,
    });
  }),
];

/**
 * Error handlers for testing error scenarios
 */
export const discordApiErrorHandlers = [
  // Rate limited response
  http.post(`${DISCORD_API_BASE}/interactions/:interactionId/:interactionToken/callback`, () => {
    return new HttpResponse(null, {
      status: 429,
      headers: {
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.floor(Date.now() / 1000 + 60).toString(),
        'Retry-After': '60',
      },
    });
  }),

  // Unauthorized response
  http.get(`${DISCORD_API_BASE}/users/@me`, () => {
    return HttpResponse.json({ message: 'Unauthorized', code: 0 }, { status: 401 });
  }),

  // Internal server error
  http.post(`${DISCORD_API_BASE}/applications/:appId/commands`, () => {
    return HttpResponse.json({ message: 'Internal Server Error', code: 0 }, { status: 500 });
  }),
];

/**
 * MSW server instance for testing
 */
export const discordApiServer = setupServer(...discordApiHandlers);

/**
 * Helper to switch to error handlers
 */
export function useErrorHandlers() {
  discordApiServer.use(...discordApiErrorHandlers);
}

/**
 * Helper to reset to normal handlers
 */
export function useNormalHandlers() {
  discordApiServer.resetHandlers(...discordApiHandlers);
}

/**
 * Helper to mock specific Discord API responses
 */
export function mockDiscordResponse(endpoint: string, response: any, status = 200) {
  discordApiServer.use(
    http.post(`${DISCORD_API_BASE}${endpoint}`, () => {
      return HttpResponse.json(response, { status });
    })
  );
}

/**
 * Setup MSW for tests
 */
export function setupDiscordApiMocks() {
  // Start the server before all tests
  beforeAll(() => {
    discordApiServer.listen({ onUnhandledRequest: 'error' });
  });

  // Reset handlers after each test
  afterEach(() => {
    discordApiServer.resetHandlers();
  });

  // Clean up after all tests
  afterAll(() => {
    discordApiServer.close();
  });
}
