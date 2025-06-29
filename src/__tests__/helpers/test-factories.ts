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
      DISCORD_TOKEN:
        process.env['DISCORD_TOKEN'] ?? `mock_discord_token_${faker.string.alphanumeric(64)}`,
      DISCORD_PUBLIC_KEY:
        process.env['DISCORD_PUBLIC_KEY'] ?? `mock_public_key_${faker.string.alphanumeric(64)}`,
      DISCORD_APPLICATION_ID: process.env['DISCORD_APPLICATION_ID'] ?? faker.string.numeric(18),
      DATABASE_URL: process.env['DATABASE_URL'] ?? 'sqlite://test.db',
      GOOGLE_SHEETS_API_KEY:
        process.env['GOOGLE_SHEETS_API_KEY'] ?? `mock_sheets_key_${faker.string.alphanumeric(32)}`,
      ENVIRONMENT: process.env['ENVIRONMENT'] ?? 'test',
      REGISTER_COMMAND_REQUEST_CHANNEL_ID:
        process.env['REGISTER_COMMAND_REQUEST_CHANNEL_ID'] ?? '1388177835331424386',
      REGISTER_COMMAND_RESPONSE_CHANNEL_ID:
        process.env['REGISTER_COMMAND_RESPONSE_CHANNEL_ID'] ?? '1388058893552320655',
      ...overrides,
    };
  },

  development(): Env {
    return this.create({ ENVIRONMENT: 'development' });
  },

  production(): Env {
    return this.create({ ENVIRONMENT: 'production' });
  },

  test(): Env {
    return this.create({ ENVIRONMENT: 'test' });
  },
} as const;

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
