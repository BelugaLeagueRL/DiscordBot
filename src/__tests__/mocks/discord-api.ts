/**
 * Mock Service Worker (MSW) setup for Discord API mocking
 * Following test suite best practices with proper factories and type definitions
 */

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { faker } from '@faker-js/faker';
import { beforeAll, afterEach, afterAll } from 'vitest';

// Discord API Type Definitions (matching official API specification)
interface DiscordUser {
  readonly id: string;
  readonly username: string;
  readonly discriminator: string;
  readonly global_name?: string;
  readonly avatar?: string;
  readonly bot?: boolean;
  readonly system?: boolean;
  readonly mfa_enabled?: boolean;
  readonly banner?: string;
  readonly accent_color?: number;
  readonly locale?: string;
  readonly verified?: boolean;
  readonly email?: string;
  readonly flags?: number;
  readonly premium_type?: number;
  readonly public_flags?: number;
}

interface DiscordGuild {
  readonly id: string;
  readonly name: string;
  readonly icon?: string;
  readonly description?: string;
  readonly owner_id: string;
  readonly permissions?: string;
  readonly region?: string;
  readonly afk_channel_id?: string;
  readonly afk_timeout: number;
  readonly widget_enabled?: boolean;
  readonly verification_level: number;
  readonly default_message_notifications: number;
  readonly explicit_content_filter: number;
  readonly roles: readonly unknown[];
  readonly emojis: readonly unknown[];
  readonly features: readonly string[];
  readonly mfa_level: number;
  readonly system_channel_id?: string;
  readonly max_presences?: number;
  readonly max_members?: number;
  readonly vanity_url_code?: string;
  readonly banner?: string;
  readonly premium_tier: number;
  readonly preferred_locale: string;
}

interface DiscordChannel {
  readonly id: string;
  readonly type: number;
  readonly guild_id?: string;
  readonly position?: number;
  readonly name?: string;
  readonly topic?: string;
  readonly nsfw?: boolean;
  readonly last_message_id?: string;
  readonly bitrate?: number;
  readonly user_limit?: number;
  readonly rate_limit_per_user?: number;
  readonly recipients?: readonly unknown[];
  readonly icon?: string;
  readonly owner_id?: string;
  readonly application_id?: string;
  readonly parent_id?: string;
  readonly last_pin_timestamp?: string;
}

interface DiscordMessage {
  readonly id: string;
  readonly type: number;
  readonly content: string;
  readonly channel_id: string;
  readonly author: DiscordUser;
  readonly attachments: readonly unknown[];
  readonly embeds: readonly unknown[];
  readonly mentions: readonly unknown[];
  readonly mention_roles: readonly string[];
  readonly pinned: boolean;
  readonly mention_everyone: boolean;
  readonly tts: boolean;
  readonly timestamp: string;
  readonly edited_timestamp?: string;
  readonly flags?: number;
  readonly components?: readonly unknown[];
}

interface DiscordApplication {
  readonly id: string;
  readonly name: string;
  readonly icon?: string;
  readonly description: string;
  readonly bot_public: boolean;
  readonly bot_require_code_grant: boolean;
  readonly terms_of_service_url?: string;
  readonly privacy_policy_url?: string;
  readonly owner: DiscordUser;
  readonly verify_key: string;
  readonly flags: number;
}

interface DiscordCommand {
  readonly id: string;
  readonly type: number;
  readonly application_id: string;
  readonly name: string;
  readonly description: string;
  readonly options?: readonly unknown[];
  readonly version: string;
}

interface DiscordInteractionResponseBody {
  readonly type: number;
  readonly data?: Record<string, unknown>;
}

// Discord Interaction Response Types (from Discord API documentation)
const VALID_INTERACTION_RESPONSE_TYPES = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  DEFERRED_UPDATE_MESSAGE: 6,
  UPDATE_MESSAGE: 7,
} as const;

type ValidInteractionResponseType =
  (typeof VALID_INTERACTION_RESPONSE_TYPES)[keyof typeof VALID_INTERACTION_RESPONSE_TYPES];

function isValidInteractionResponseType(type: unknown): type is ValidInteractionResponseType {
  if (typeof type !== 'number') {
    return false;
  }

  return Object.values(VALID_INTERACTION_RESPONSE_TYPES).includes(
    type as ValidInteractionResponseType
  );
}

function isValidInteractionResponseBody(body: unknown): body is DiscordInteractionResponseBody {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const obj = body as Record<string, unknown>;
  return typeof obj['type'] === 'number' && isValidInteractionResponseType(obj['type']);
}

// Factories for Discord API Data Structures
export function createMockDiscordUser(overrides: Partial<DiscordUser> = {}): DiscordUser {
  const baseUser = {
    id: faker.string.numeric(18),
    username: 'BelugaBot',
    discriminator: '0',
    global_name: 'Beluga League Bot',
    avatar: faker.string.alphanumeric(32),
    bot: true,
    system: false,
    mfa_enabled: true,
    locale: 'en-US',
    verified: true,
    flags: 0,
    premium_type: 0,
    public_flags: 0,
  };
  return { ...baseUser, ...overrides };
}

export function createMockDiscordGuild(overrides: Partial<DiscordGuild> = {}): DiscordGuild {
  const baseGuild = {
    id: faker.string.numeric(18),
    name: 'Test Guild',
    icon: faker.string.alphanumeric(32),
    description: 'A test Discord guild',
    owner_id: faker.string.numeric(18),
    permissions: '0',
    region: 'us-west',
    afk_timeout: 300,
    widget_enabled: false,
    verification_level: 1,
    default_message_notifications: 0,
    explicit_content_filter: 0,
    roles: [],
    emojis: [],
    features: [],
    mfa_level: 0,
    max_members: 250000,
    premium_tier: 0,
    preferred_locale: 'en-US',
  };
  return { ...baseGuild, ...overrides };
}

export function createMockDiscordChannel(overrides: Partial<DiscordChannel> = {}): DiscordChannel {
  const baseChannel = {
    id: faker.string.numeric(18),
    type: 0, // GUILD_TEXT
    guild_id: faker.string.numeric(18),
    position: 0,
    name: 'general',
    nsfw: false,
    last_message_id: faker.string.numeric(18),
    rate_limit_per_user: 0,
  };
  return { ...baseChannel, ...overrides };
}

export function createMockDiscordMessage(overrides: Partial<DiscordMessage> = {}): DiscordMessage {
  const baseMessage = {
    id: faker.string.numeric(18),
    type: 0,
    content: '',
    channel_id: faker.string.numeric(18),
    author: createMockDiscordUser(),
    attachments: [],
    embeds: [],
    mentions: [],
    mention_roles: [],
    pinned: false,
    mention_everyone: false,
    tts: false,
    timestamp: new Date().toISOString(),
    flags: 0,
    components: [],
  };
  return { ...baseMessage, ...overrides };
}

export function createMockDiscordApplication(
  overrides: Partial<DiscordApplication> = {}
): DiscordApplication {
  const baseApplication = {
    id: faker.string.numeric(18),
    name: 'Beluga League Bot',
    icon: faker.string.alphanumeric(32),
    description: 'Discord bot for Rocket League community management',
    bot_public: true,
    bot_require_code_grant: false,
    owner: createMockDiscordUser({
      username: 'owner',
      bot: false,
    }),
    verify_key: faker.string.alphanumeric(64),
    flags: 0,
  };
  return { ...baseApplication, ...overrides };
}

export function createMockDiscordCommand(overrides: Partial<DiscordCommand> = {}): DiscordCommand {
  return {
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
    ...overrides,
  };
}

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
    const command = createMockDiscordCommand();
    return HttpResponse.json([command]);
  }),

  // Create application command
  http.post(`${DISCORD_API_BASE}/applications/:appId/commands`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const appId = params['appId'];
    if (typeof appId !== 'string') {
      return new HttpResponse(null, { status: 400 });
    }

    const command = createMockDiscordCommand({
      application_id: appId,
      ...body,
    });
    return HttpResponse.json(command);
  }),

  // Update application command
  http.patch(
    `${DISCORD_API_BASE}/applications/:appId/commands/:commandId`,
    async ({ request, params }) => {
      const body = (await request.json()) as Record<string, unknown>;
      const appId = params['appId'];
      const commandId = params['commandId'];

      if (typeof appId !== 'string' || typeof commandId !== 'string') {
        return new HttpResponse(null, { status: 400 });
      }

      const command = createMockDiscordCommand({
        id: commandId,
        application_id: appId,
        ...body,
      });
      return HttpResponse.json(command);
    }
  ),

  // Delete application command
  http.delete(`${DISCORD_API_BASE}/applications/:appId/commands/:commandId`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Get current bot user
  http.get(`${DISCORD_API_BASE}/users/@me`, () => {
    const user = createMockDiscordUser();
    return HttpResponse.json(user);
  }),

  // Get guild information
  http.get(`${DISCORD_API_BASE}/guilds/:guildId`, ({ params }) => {
    const guildId = params['guildId'];
    if (typeof guildId !== 'string') {
      return new HttpResponse(null, { status: 400 });
    }

    const guild = createMockDiscordGuild({ id: guildId });
    return HttpResponse.json(guild);
  }),

  // Get channel information
  http.get(`${DISCORD_API_BASE}/channels/:channelId`, ({ params }) => {
    const channelId = params['channelId'];
    if (typeof channelId !== 'string') {
      return new HttpResponse(null, { status: 400 });
    }

    const channel = createMockDiscordChannel({ id: channelId });
    return HttpResponse.json(channel);
  }),

  // Send message to channel
  http.post(`${DISCORD_API_BASE}/channels/:channelId/messages`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const channelId = params['channelId'];

    if (typeof channelId !== 'string') {
      return new HttpResponse(null, { status: 400 });
    }

    const message = createMockDiscordMessage({
      content: typeof body['content'] === 'string' ? body['content'] : '',
      channel_id: channelId,
      embeds: Array.isArray(body['embeds']) ? body['embeds'] : [],
      components: Array.isArray(body['components']) ? body['components'] : [],
    });
    return HttpResponse.json(message);
  }),

  // Handle interaction responses (webhook)
  http.post(
    `${DISCORD_API_BASE}/interactions/:interactionId/:interactionToken/callback`,
    async ({ request }) => {
      const body = (await request.json()) as unknown;

      // Validate interaction response structure
      if (!isValidInteractionResponseBody(body)) {
        return new HttpResponse(null, { status: 400 });
      }

      return new HttpResponse(null, { status: 204 });
    }
  ),

  // Edit original interaction response
  http.patch(
    `${DISCORD_API_BASE}/webhooks/:appId/:interactionToken/messages/@original`,
    async ({ request, params }) => {
      const body = (await request.json()) as Record<string, unknown>;
      const appId = params['appId'];

      if (typeof appId !== 'string') {
        return new HttpResponse(null, { status: 400 });
      }

      const message = createMockDiscordMessage({
        content: typeof body['content'] === 'string' ? body['content'] : '',
        author: createMockDiscordUser({ id: appId }),
        embeds: Array.isArray(body['embeds']) ? body['embeds'] : [],
        components: Array.isArray(body['components']) ? body['components'] : [],
        edited_timestamp: new Date().toISOString(),
        flags: 64, // EPHEMERAL
      });
      return HttpResponse.json(message);
    }
  ),

  // Get application
  http.get(`${DISCORD_API_BASE}/applications/@me`, () => {
    const application = createMockDiscordApplication();
    return HttpResponse.json(application);
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
 * Helper to mock specific Discord API responses with proper typing
 */
export function mockDiscordResponse(
  endpoint: string,
  response: Record<string, unknown>,
  status = 200
): void {
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
