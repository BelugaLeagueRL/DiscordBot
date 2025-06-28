/**
 * Test data factories for consistent test data generation
 */

import { faker } from '@faker-js/faker';
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
      DISCORD_TOKEN: `mock_discord_token_${faker.string.alphanumeric(64)}`,
      DISCORD_PUBLIC_KEY: `mock_public_key_${faker.string.alphanumeric(64)}`,
      DISCORD_APPLICATION_ID: faker.string.numeric(18),
      DATABASE_URL: 'sqlite://test.db',
      GOOGLE_SHEETS_API_KEY: `mock_sheets_key_${faker.string.alphanumeric(32)}`,
      ENVIRONMENT: 'test',
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
export class AuditLogFactory {
  static createEntry(overrides: any = {}) {
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

  static securityViolation(violationType: string, details: string) {
    return this.createEntry({
      eventType: 'security_violation',
      success: false,
      error: `${violationType}: ${details}`,
      metadata: { violationType },
    });
  }

  static commandExecution(
    commandName: string,
    success: boolean = true,
    responseTime: number = 100
  ) {
    return this.createEntry({
      eventType: success ? 'command_executed' : 'command_failed',
      commandName,
      success,
      responseTime,
    });
  }
}

/**
 * Factory for creating test rate limiting scenarios
 */
export class RateLimitFactory {
  static createRateLimitData(requests: number, windowMs: number = 60000) {
    return {
      count: requests,
      resetTime: Date.now() + windowMs,
    };
  }

  static nearLimit(limit: number = 100) {
    return this.createRateLimitData(limit - 1);
  }

  static atLimit(limit: number = 100) {
    return this.createRateLimitData(limit);
  }

  static overLimit(limit: number = 100) {
    return this.createRateLimitData(limit + 10);
  }
}

/**
 * Factory for creating test tracker URLs
 */
export class TrackerUrlFactory {
  private static readonly VALID_PLATFORMS = ['steam', 'epic', 'psn', 'xbox', 'switch'];
  private static readonly BASE_URL = 'https://rocketleague.tracker.network/rocket-league/profile';

  static valid(platform?: string): string {
    const selectedPlatform = platform ?? faker.helpers.arrayElement(this.VALID_PLATFORMS);
    const playerId = this.generatePlayerId(selectedPlatform);
    return `${this.BASE_URL}/${selectedPlatform}/${playerId}/overview`;
  }

  static validBatch(count: number = 4): string[] {
    return Array.from({ length: count }, () => this.valid());
  }

  static invalid(): string {
    const invalidUrls = [
      'https://example.com/profile/steam/123',
      'not-a-url',
      'https://rocketleague.tracker.network/invalid',
      'https://different-site.com/rocket-league/profile/steam/123/overview',
    ];
    return faker.helpers.arrayElement(invalidUrls);
  }

  static steam(): string {
    return this.valid('steam');
  }

  static epic(): string {
    return this.valid('epic');
  }

  static psn(): string {
    return this.valid('psn');
  }

  static xbox(): string {
    return this.valid('xbox');
  }

  static switch(): string {
    return this.valid('switch');
  }

  private static generatePlayerId(platform: string): string {
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
}

/**
 * Factory for creating test error scenarios
 */
export class ErrorFactory {
  static networkError(): Error {
    return new Error('Network request failed');
  }

  static timeoutError(): Error {
    return new Error('Request timeout');
  }

  static validationError(field: string): Error {
    return new Error(`Validation failed for field: ${field}`);
  }

  static authenticationError(): Error {
    return new Error('Authentication failed');
  }

  static rateLimitError(): Error {
    return new Error('Rate limit exceeded');
  }

  static internalError(): Error {
    return new Error('Internal server error');
  }
}

/**
 * Factory for creating performance test data
 */
export class PerformanceFactory {
  static createMemoryTestData(sizeMB: number = 10): any[] {
    const itemSize = 1024; // 1KB per item
    const itemCount = (sizeMB * 1024 * 1024) / itemSize;

    return Array.from({ length: itemCount }, (_, index) => ({
      id: index,
      data: faker.string.alphanumeric(itemSize - 100), // Leave room for other properties
      timestamp: faker.date.recent(),
    }));
  }

  static createCpuIntensiveTask(): () => number {
    return () => {
      let result = 0;
      for (let i = 0; i < 1000000; i++) {
        result += Math.random() * Math.random();
      }
      return result;
    };
  }

  static createConcurrentRequests(count: number = 10): Promise<any>[] {
    return Array.from(
      { length: count },
      () =>
        new Promise(resolve =>
          setTimeout(
            () => {
              resolve(faker.string.uuid());
            },
            faker.number.int({ min: 50, max: 200 })
          )
        )
    );
  }
}

/**
 * Builder pattern for complex test scenarios
 */
export class TestScenarioBuilder {
  private scenario: any = {};

  withUser(user: any): this {
    this.scenario.user = user;
    return this;
  }

  withCommand(commandName: string, options: any[] = []): this {
    this.scenario.command = { name: commandName, options };
    return this;
  }

  withSecurityContext(context: SecurityContext): this {
    this.scenario.securityContext = context;
    return this;
  }

  withEnvironment(env: Env): this {
    this.scenario.environment = env;
    return this;
  }

  withRateLimit(rateLimitData: any): this {
    this.scenario.rateLimit = rateLimitData;
    return this;
  }

  build(): any {
    return { ...this.scenario };
  }

  static start(): TestScenarioBuilder {
    return new TestScenarioBuilder();
  }
}
