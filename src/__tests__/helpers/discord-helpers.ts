/**
 * Discord testing helpers for creating mock interactions and requests
 */

import { faker } from '@faker-js/faker';
import type { DiscordInteraction } from '../../types/discord';

// Define constants locally to avoid module resolution issues
const InteractionType = {
  Ping: 1,
  ApplicationCommand: 2,
  MessageComponent: 3,
  ApplicationCommandAutocomplete: 4,
  ModalSubmit: 5,
} as const;

const ApplicationCommandType = {
  ChatInput: 1,
  User: 2,
  Message: 3,
} as const;

// Define types locally
interface APIUser {
  id: string;
  username: string;
  discriminator: string;
  global_name: string | null;
  avatar: string | null;
  bot?: boolean;
  system?: boolean;
  mfa_enabled?: boolean;
  banner?: string | null;
  accent_color?: number | null;
  locale?: string;
  verified?: boolean;
  email?: string | null;
  flags?: number;
  premium_type?: number;
  public_flags?: number;
  avatar_decoration_data?: any;
}

interface APIGuildMember {
  user?: APIUser;
  nick?: string | null;
  avatar?: string | null;
  roles: string[];
  joined_at: string;
  premium_since?: string | null;
  deaf: boolean;
  mute: boolean;
  flags: number;
  pending?: boolean;
  permissions?: string;
  communication_disabled_until?: string | null;
  avatar_decoration_data?: any;
}

/**
 * Create a mock Discord user
 */
export function createMockUser(overrides: Partial<APIUser> = {}): APIUser {
  return {
    id: faker.string.numeric(18),
    username: faker.internet.username(),
    discriminator: '0',
    global_name: faker.person.fullName(),
    avatar: faker.string.alphanumeric(32),
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
    avatar_decoration_data: null,
    ...overrides,
  };
}

/**
 * Create a mock Discord guild member
 */
export function createMockGuildMember(overrides: Partial<APIGuildMember> = {}): APIGuildMember {
  return {
    user: createMockUser(),
    nick: null,
    avatar: null,
    roles: [],
    joined_at: new Date().toISOString(),
    premium_since: null,
    deaf: false,
    mute: false,
    flags: 0,
    pending: false,
    permissions: '0',
    communication_disabled_until: null,
    avatar_decoration_data: null,
    ...overrides,
  };
}

/**
 * Create a mock Discord PING interaction
 */
export function createMockPingInteraction(): DiscordInteraction {
  return {
    id: faker.string.numeric(18),
    application_id: faker.string.numeric(18),
    type: InteractionType.Ping,
    token: faker.string.alphanumeric(84),
    version: 1,
  };
}

/**
 * Create a mock Discord application command interaction
 */
export function createMockCommandInteraction(
  commandName: string,
  options: any[] = [],
  overrides: Partial<APIApplicationCommandInteraction> = {}
): DiscordInteraction {
  const baseInteraction: APIApplicationCommandInteraction = {
    id: faker.string.numeric(18),
    application_id: faker.string.numeric(18),
    type: InteractionType.ApplicationCommand,
    data: {
      id: faker.string.numeric(18),
      name: commandName,
      type: ApplicationCommandType.ChatInput,
      options,
    },
    guild_id: faker.string.numeric(18),
    channel_id: faker.string.numeric(18),
    member: createMockGuildMember(),
    token: faker.string.alphanumeric(84),
    version: 1,
    locale: 'en-US',
    guild_locale: 'en-US',
    app_permissions: '0',
    ...overrides,
  };

  return baseInteraction as DiscordInteraction;
}

/**
 * Create a mock register command interaction with tracker URLs
 */
export function createMockRegisterCommand(trackerUrls: string[] = []): DiscordInteraction {
  const defaultUrls = [
    'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198123456789/overview',
    'https://rocketleague.tracker.network/rocket-league/profile/epic/TestPlayer123/overview',
  ];

  const urls = trackerUrls.length > 0 ? trackerUrls : defaultUrls;
  const options = urls.map((url, index) => ({
    name: `tracker${String(index + 1)}`,
    type: 3, // STRING
    value: url,
  }));

  return createMockCommandInteraction('register', options);
}

/**
 * Create a mock Discord request with proper signature headers
 */
export function createMockDiscordRequest(
  interaction: DiscordInteraction,
  options: {
    validSignature?: boolean;
    timestamp?: string;
    signature?: string;
    publicKey?: string;
  } = {}
): Request {
  const {
    validSignature = true,
    timestamp = Math.floor(Date.now() / 1000).toString(),
    signature = validSignature ? 'valid_signature_hex' : 'invalid_signature',
  } = options;

  const body = JSON.stringify(interaction);

  return new Request('https://example.com/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature-Ed25519': signature,
      'X-Signature-Timestamp': timestamp,
      'User-Agent': 'Discord-Interactions/1.0 (+https://discord.com)',
      'CF-Connecting-IP': faker.internet.ip(),
    },
    body,
  });
}

/**
 * Create a mock request with rate limiting context
 */
export function createMockRequestWithIP(ip: string): Request {
  return new Request('https://example.com/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CF-Connecting-IP': ip,
      'X-Forwarded-For': ip,
      'User-Agent': 'Discord-Interactions/1.0',
      'X-Signature-Ed25519': 'valid_signature',
      'X-Signature-Timestamp': Math.floor(Date.now() / 1000).toString(),
    },
    body: JSON.stringify(createMockPingInteraction()),
  });
}

/**
 * Create a malicious request for security testing
 */
export function createMaliciousRequest(type: 'xss' | 'sql' | 'path' | 'script'): Request {
  const payloads = {
    xss: '<script>alert("xss")</script>',
    sql: "'; DROP TABLE users; --",
    path: '../../etc/passwd',
    script: 'java' + 'script:alert("malicious")',
  };

  const maliciousInteraction = createMockCommandInteraction('register', [
    {
      name: 'tracker1',
      type: 3,
      value: payloads[type],
    },
  ]);

  return createMockDiscordRequest(maliciousInteraction);
}

/**
 * Create a request that will timeout
 */
export function createTimeoutRequest(): Request {
  return new Request('https://example.com/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature-Ed25519': 'valid_signature',
      'X-Signature-Timestamp': Math.floor(Date.now() / 1000).toString(),
      'X-Test-Timeout': 'true', // Signal for test to simulate timeout
    },
    body: JSON.stringify(createMockPingInteraction()),
  });
}

/**
 * Generate realistic tracker URLs for testing
 */
export function generateTrackerUrls(count: number = 2): string[] {
  const platforms = ['steam', 'epic', 'psn', 'xbox', 'switch'];
  const urls: string[] = [];

  for (let i = 0; i < count; i++) {
    const platform = faker.helpers.arrayElement(platforms);
    let playerId: string;

    switch (platform) {
      case 'steam':
        playerId = faker.string.numeric(17); // Steam ID64
        break;
      case 'epic':
        playerId = faker.internet.username();
        break;
      case 'psn':
      case 'xbox':
      case 'switch':
        playerId = faker.internet.username();
        break;
      default:
        playerId = faker.internet.username();
    }

    urls.push(
      `https://rocketleague.tracker.network/rocket-league/profile/${platform}/${playerId}/overview`
    );
  }

  return urls;
}

/**
 * Assert that response is a valid Discord interaction response
 */
export function assertValidDiscordResponse(response: Response): void {
  expect(response.status).toBeLessThan(400);
  expect(response.headers.get('Content-Type')).toContain('application/json');
}

/**
 * Assert that response has security headers
 */
export function assertSecurityHeaders(response: Response): void {
  const requiredHeaders = [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Referrer-Policy',
    'Content-Security-Policy',
    'Strict-Transport-Security',
  ];

  requiredHeaders.forEach(header => {
    expect(response.headers.get(header)).toBeTruthy();
  });
}

/**
 * Create a large payload for testing memory limits
 */
export function createLargePayload(sizeMB: number = 1): DiscordInteraction {
  const largeString = 'x'.repeat(sizeMB * 1024 * 1024);
  return createMockCommandInteraction('register', [
    {
      name: 'tracker1',
      type: 3,
      value: largeString,
    },
  ]);
}
