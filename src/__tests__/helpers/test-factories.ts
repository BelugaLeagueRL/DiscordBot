/**
 * Test data factories for consistent test data generation
 */

import { faker } from '@faker-js/faker';
import { vi } from 'vitest';
import type { SecurityContext } from '../../middleware/security';
import type { Env } from '../../index';

/**
 * Factory for creating mock security contexts
 */
export const SecurityContextFactory = {
  create(overrides: Partial<SecurityContext> = {}): SecurityContext {
    return {
      clientIP: faker.internet.ip(),
      userAgent: 'Discord-Interactions/1.0 (+https://discord.com)',
      timestamp: Date.now(),
      requestId: faker.string.uuid(),
      ...overrides,
    };
  },

  withIP(ip: string): SecurityContext {
    return this.create({ clientIP: ip });
  },

  withUserAgent(userAgent: string): SecurityContext {
    return this.create({ userAgent });
  },
} as const;

/**
 * Factory for creating mock environment configurations
 */
export const EnvFactory = {
  create(overrides: Partial<Env> = {}): Env {
    return {
      DISCORD_TOKEN: process.env['DISCORD_TOKEN'] ?? 'Bot mock_token_123',
      DISCORD_PUBLIC_KEY: process.env['DISCORD_PUBLIC_KEY'] ?? 'mock_public_key_456',
      DISCORD_APPLICATION_ID: process.env['DISCORD_APPLICATION_ID'] ?? '123456789012345678',
      DATABASE_URL: process.env['DATABASE_URL'] ?? 'sqlite://test.db',
      GOOGLE_SHEETS_API_KEY: process.env['GOOGLE_SHEETS_API_KEY'] ?? 'mock_sheets_key_789',
      GOOGLE_SHEET_ID: process.env['GOOGLE_SHEET_ID'] ?? '1mock_sheet_id_abc123',
      ENVIRONMENT: process.env['ENVIRONMENT'] ?? 'test',
      REGISTER_COMMAND_REQUEST_CHANNEL_ID:
        process.env['REGISTER_COMMAND_REQUEST_CHANNEL_ID'] ?? '987654321098765432',
      REGISTER_COMMAND_RESPONSE_CHANNEL_ID:
        process.env['REGISTER_COMMAND_RESPONSE_CHANNEL_ID'] ?? '876543210987654321',
      TEST_CHANNEL_ID: process.env['TEST_CHANNEL_ID'] ?? '765432109876543210',
      PRIVILEGED_USER_ID: process.env['PRIVILEGED_USER_ID'] ?? '654321098765432109',
      ...overrides,
    };
  },
};

/**
 * Factory for creating mock audit log entries
 */
export function createMockAuditEntry(
  overrides: {
    timestamp?: string;
    requestId?: string;
    eventType?: string;
    clientIP?: string;
    userAgent?: string;
    success?: boolean;
    commandName?: string;
    responseTime?: number;
    error?: string;
    metadata?: Record<string, unknown>;
  } = {}
) {
  return {
    timestamp: new Date().toISOString(),
    requestId: faker.string.uuid(),
    eventType: 'request_received',
    clientIP: faker.internet.ip(),
    userAgent: 'Discord-Interactions/1.0',
    success: true,
    ...overrides,
  };
}

export function createMockSecurityViolation(violationType: string, details: string) {
  return createMockAuditEntry({
    eventType: 'security_violation',
    success: false,
    error: `${violationType}: ${details}`,
    metadata: { violationType },
  });
}

export function createMockCommandExecution(
  commandName: string,
  success: boolean = true,
  responseTime: number = 100
) {
  return createMockAuditEntry({
    eventType: success ? 'command_executed' : 'command_failed',
    commandName,
    success,
    responseTime,
  });
}

/**
 * Factory for creating test rate limiting scenarios
 */
export function createMockRateLimitData(requests: number, windowMs: number = 60000) {
  return {
    count: requests,
    resetTime: Date.now() + windowMs,
  };
}

export function createNearLimitRateLimit(limit: number = 100) {
  return createMockRateLimitData(limit - 1);
}

/**
 * Factory for creating mock ExecutionContext
 */
export const ExecutionContextFactory = {
  create(): ExecutionContext {
    return {
      waitUntil: vi.fn(),
      passThroughOnException: vi.fn(),
      props: {},
    };
  },
} as const;

/**
 * Factory for creating mock Discord members (API response format)
 */
export const DiscordMemberFactory = {
  create(
    overrides: Partial<{
      id: string;
      username: string;
      discriminator: string;
      global_name: string;
      joined_at: string;
      nick: string;
      roles: string[];
    }> = {}
  ) {
    return {
      user: {
        id: overrides.id ?? faker.string.numeric(18),
        username: overrides.username ?? faker.internet.username(),
        discriminator: overrides.discriminator ?? '0001',
        global_name: overrides.global_name ?? faker.person.fullName(),
        avatar: null,
        bot: false,
      },
      nick: overrides.nick ?? null,
      roles: overrides.roles ?? ['role1'],
      joined_at: overrides.joined_at ?? faker.date.past().toISOString(),
      premium_since: null,
      deaf: false,
      mute: false,
      flags: 0,
      pending: false,
      permissions: '0',
      communication_disabled_until: null,
    };
  },

  createBatch(count: number) {
    return Array.from({ length: count }, (_, index) =>
      this.create({
        id: `${faker.string.numeric(17)}${index.toString()}`,
        username: `testuser${(index + 1).toString()}`,
        global_name: `Test User ${(index + 1).toString()}`,
      })
    );
  },
} as const;

/**
 * Factory for creating mock MemberData for User sheet structure
 */
export const MemberDataFactory = {
  create(
    overrides: Partial<{
      discord_id: string;
      discord_username_display: string;
      discord_username_actual: string;
      server_join_date: string;
      is_banned: boolean;
      is_active: boolean;
      last_updated: string;
    }> = {}
  ) {
    const baseTimestamp = faker.date.past().toISOString();
    return {
      discord_id: faker.string.numeric(18),
      discord_username_display: faker.internet.username(),
      discord_username_actual: faker.internet.username(),
      server_join_date: baseTimestamp,
      is_banned: false,
      is_active: true,
      last_updated: baseTimestamp,
      ...overrides,
    };
  },

  createBatch(count: number, baseOverrides: Record<string, unknown> = {}) {
    return Array.from({ length: count }, (_, index) =>
      this.create({
        discord_id: faker.string.numeric(18),
        discord_username_display: `testuser${(index + 1).toString()}`,
        discord_username_actual: `user${(index + 1).toString()}`,
        ...baseOverrides,
      })
    );
  },

  banned() {
    return this.create({ is_banned: true, is_active: false });
  },

  inactive() {
    return this.create({ is_active: false });
  },
} as const;

/**
 * Factory for creating mock Google Sheets credentials
 */
export const GoogleSheetsCredentialsFactory = {
  create(overrides: Record<string, unknown> = {}) {
    return {
      type: 'service_account' as const,
      project_id: `test-project-${faker.string.numeric(3)}`,
      private_key_id: `test-key-${faker.string.uuid()}`,
      private_key: '-----BEGIN PRIVATE KEY-----\nTEST_PRIVATE_KEY\n-----END PRIVATE KEY-----',
      client_email: `test-${faker.string.numeric(3)}@test-project.iam.gserviceaccount.com`,
      client_id: faker.string.numeric(21),
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/test%40test-project.iam.gserviceaccount.com`,
      universe_domain: 'googleapis.com',
      ...overrides,
    };
  },

  invalid() {
    return this.create({
      private_key: 'invalid-key-format',
    });
  },

  wrongType() {
    return this.create({
      type: 'user_account',
    });
  },
} as const;

/**
 * Factory for creating sync operations
 */
export const SyncOperationFactory = {
  create(overrides: Record<string, unknown> = {}) {
    return {
      guildId: faker.string.numeric(18),
      credentials: GoogleSheetsCredentialsFactory.create(),
      requestId: faker.string.uuid(),
      initiatedBy: faker.string.numeric(18),
      timestamp: new Date().toISOString(),
      ...overrides,
    };
  },

  withLargeGuild(memberCount: number = 50000) {
    return this.create({
      estimatedMemberCount: memberCount,
    });
  },

  withInvalidGuildId() {
    return this.create({
      guildId: 'invalid-guild-id',
    });
  },

  withoutRequestId() {
    return this.create({
      requestId: '',
    });
  },

  withMassiveGuild() {
    return this.create({
      estimatedMemberCount: 1000000,
    });
  },
} as const;

/**
 * Factory for creating Cloudflare Workers ExecutionContext
 */
export const CloudflareExecutionContextFactory = {
  create(): ExecutionContext {
    return {
      waitUntil: vi.fn(),
      passThroughOnException: vi.fn(),
      props: {},
    };
  },
} as const;

/**
 * Helper function to assert channel ID exists (for type safety)
 */
export function getRequestChannelId(env: Env): string {
  if (!env.REGISTER_COMMAND_REQUEST_CHANNEL_ID) {
    throw new Error('REGISTER_COMMAND_REQUEST_CHANNEL_ID is not configured in test environment');
  }
  return env.REGISTER_COMMAND_REQUEST_CHANNEL_ID;
}

export function createAtLimitRateLimit(limit: number = 100) {
  return createMockRateLimitData(limit);
}

export function createOverLimitRateLimit(limit: number = 100) {
  return createMockRateLimitData(limit + 10);
}

/**
 * Factory for creating test tracker URLs
 */
const VALID_PLATFORMS = ['steam', 'epic', 'psn', 'xbox', 'switch'] as const;
const BASE_URL = 'https://rocketleague.tracker.network/rocket-league/profile';

function generatePlayerId(platform: string): string {
  switch (platform) {
    case 'steam':
      return `7656119${faker.string.numeric(10)}`; // Steam ID64 format
    case 'epic':
      return faker.internet.username();
    case 'psn':
    case 'xbox':
    case 'switch':
      return faker.internet.username();
    default:
      return faker.internet.username();
  }
}

export function createValidTrackerUrl(platform?: string): string {
  const selectedPlatform = platform ?? faker.helpers.arrayElement(VALID_PLATFORMS);
  const playerId = generatePlayerId(selectedPlatform);
  return `${BASE_URL}/${selectedPlatform}/${playerId}/overview`;
}

export function createValidTrackerUrlBatch(count: number = 4): string[] {
  return Array.from({ length: count }, () => createValidTrackerUrl());
}

export function createInvalidTrackerUrl(): string {
  const invalidUrls = [
    'https://example.com/profile/steam/123',
    'not-a-url',
    'https://rocketleague.tracker.network/invalid',
    'https://different-site.com/rocket-league/profile/steam/123/overview',
  ];
  return faker.helpers.arrayElement(invalidUrls);
}

export function createSteamTrackerUrl(): string {
  return createValidTrackerUrl('steam');
}

export function createEpicTrackerUrl(): string {
  return createValidTrackerUrl('epic');
}

export function createPsnTrackerUrl(): string {
  return createValidTrackerUrl('psn');
}

export function createXboxTrackerUrl(): string {
  return createValidTrackerUrl('xbox');
}

export function createSwitchTrackerUrl(): string {
  return createValidTrackerUrl('switch');
}

/**
 * Factory for creating test error scenarios
 */
export function createNetworkError(): Error {
  return new Error('Network request failed');
}

export function createTimeoutError(): Error {
  return new Error('Request timeout');
}

export function createValidationError(field: string): Error {
  return new Error(`Validation failed for field: ${field}`);
}

export function createAuthenticationError(): Error {
  return new Error('Authentication failed');
}

export function createRateLimitError(): Error {
  return new Error('Rate limit exceeded');
}

export function createInternalError(): Error {
  return new Error('Internal server error');
}

/**
 * Factory for creating performance test data
 */
export function createMemoryTestData(sizeMB: number = 10): Array<{
  id: number;
  data: string;
  timestamp: Date;
}> {
  const itemSize = 1024; // 1KB per item
  const itemCount = (sizeMB * 1024 * 1024) / itemSize;

  return Array.from({ length: itemCount }, (_, index) => ({
    id: index,
    data: faker.string.alphanumeric(itemSize - 100), // Leave room for other properties
    timestamp: faker.date.recent(),
  }));
}

export function createCpuIntensiveTask(): () => number {
  return () => {
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      result += Math.random() * Math.random();
    }
    return result;
  };
}

export function createConcurrentRequests(count: number = 10): Promise<string>[] {
  return Array.from(
    { length: count },
    () =>
      new Promise<string>(resolve =>
        setTimeout(
          () => {
            resolve(faker.string.uuid());
          },
          faker.number.int({ min: 50, max: 200 })
        )
      )
  );
}

/**
 * Simple function for creating complex test scenarios
 */
export interface TestScenario {
  user?: { id: string; username?: string };
  command?: { name: string; options: unknown[] };
  securityContext?: SecurityContext;
  environment?: Env;
  rateLimit?: { count: number; resetTime: number };
}

export function createTestScenario(
  config: {
    user?: { id: string; username?: string };
    commandName?: string;
    commandOptions?: unknown[];
    securityContext?: SecurityContext;
    environment?: Env;
    rateLimit?: { count: number; resetTime: number };
  } = {}
): TestScenario {
  const scenario: TestScenario = {};

  if (config.user) {
    scenario.user = config.user;
  }

  if (config.commandName) {
    scenario.command = {
      name: config.commandName,
      options: config.commandOptions ?? [],
    };
  }

  if (config.securityContext) {
    scenario.securityContext = config.securityContext;
  }

  if (config.environment) {
    scenario.environment = config.environment;
  }

  if (config.rateLimit) {
    scenario.rateLimit = config.rateLimit;
  }

  return scenario;
}
