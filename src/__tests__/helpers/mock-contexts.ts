/**
 * Mock execution contexts for testing
 * 
 * Note: This file uses globalThis type assertions for test infrastructure
 * ESLint rules are relaxed for necessary global mocking
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { vi } from 'vitest';
import type { SecurityContext } from '../../middleware/security';
import type { Env } from '../../index';
import { SecurityContextFactory, EnvFactory } from './test-factories';

/**
 * Mock implementation of fetch for testing
 */
export function createMockFetch() {
  return vi.fn().mockImplementation((_url: string | Request, _init?: RequestInit) => {
    // Default successful response
    return Promise.resolve(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });
}

/**
 * Mock implementation of console methods for testing
 */
export function createMockConsole() {
  return {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  };
}

/**
 * Mock security context with spies for validation testing
 */
export function createMockSecurityContext(
  overrides: Partial<SecurityContext> = {}
): SecurityContext {
  return SecurityContextFactory.create(overrides);
}

/**
 * Mock environment with test-safe values
 */
export function createMockEnv(overrides: Partial<Env> = {}): Env {
  return EnvFactory.create({ ENVIRONMENT: 'test', ...overrides });
}

/**
 * Mock rate limit storage for testing
 */
export function createMockRateLimitStorage() {
  const storage = new Map<string, { count: number; resetTime: number }>();

  return {
    get: vi.fn((key: string) => storage.get(key)),
    set: vi.fn((key: string, value: { count: number; resetTime: number }) => {
      storage.set(key, value);
    }),
    delete: vi.fn((key: string) => storage.delete(key)),
    clear: vi.fn(() => {
      storage.clear();
    }),
    size: () => storage.size,
    keys: () => Array.from(storage.keys()),
    has: (key: string) => storage.has(key),
  };
}

/**
 * Mock Discord signature verification
 */
export function createMockDiscordVerification() {
  return {
    verifyKey: vi.fn().mockResolvedValue(true),
    isValidRequest: vi.fn().mockReturnValue(true),
  };
}

/**
 * Mock audit logger for testing
 */
export function createMockAuditLogger() {
  return {
    log: vi.fn(),
    logRequestReceived: vi.fn(),
    logRequestVerified: vi.fn(),
    logRequestRejected: vi.fn(),
    logCommandExecution: vi.fn(),
    logSecurityViolation: vi.fn(),
    logRateLimitExceeded: vi.fn(),
    logHealthCheck: vi.fn(),
    logError: vi.fn(),
  };
}

/**
 * Mock Cloudflare Workers execution context
 */
export function createMockExecutionContext() {
  return {
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
  };
}

/**
 * Mock request object with customizable properties
 */
export function createMockRequest(
  options: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {}
): Request {
  const { method = 'POST', url = 'https://example.com/', headers = {}, body } = options;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'User-Agent': 'Discord-Interactions/1.0',
    'CF-Connecting-IP': '192.168.1.1',
    ...headers,
  };

  const requestInit: RequestInit = {
    method,
    headers: defaultHeaders,
  };
  
  if (method !== 'GET' && body) {
    requestInit.body = body;
  }
  
  return new Request(url, requestInit);
}

/**
 * Mock Response class for testing
 */
export function createMockResponse(
  options: {
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
): Response {
  const { status = 200, statusText = 'OK', headers = {}, body = null } = options;

  const responseBody = body ? JSON.stringify(body) : null;
  const responseHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  return new Response(responseBody, {
    status,
    statusText,
    headers: responseHeaders,
  });
}

/**
 * Mock crypto object for testing
 */
export function createMockCrypto() {
  return {
    randomUUID: vi.fn(() => '123e4567-e89b-12d3-a456-426614174000'),
    getRandomValues: vi.fn((array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }),
  };
}

/**
 * Mock timing functions for performance testing
 */
export function createMockTiming() {
  let currentTime = Date.now();

  return {
    now: vi.fn(() => currentTime),
    advance: (ms: number) => {
      currentTime += ms;
    },
    reset: () => {
      currentTime = Date.now();
    },
  };
}

/**
 * Setup global mocks for testing environment
 */
export function setupGlobalMocks() {
  // Mock global fetch
  (globalThis as any).fetch = createMockFetch();

  // Mock global crypto
  (globalThis as any).crypto = createMockCrypto();

  // Mock console methods
  const mockConsole = createMockConsole();
  (globalThis as any).console = { ...(globalThis as any).console, ...mockConsole };

  // Mock setTimeout and setInterval for testing
  vi.useFakeTimers();

  return {
    fetch: (globalThis as any).fetch,
    crypto: (globalThis as any).crypto,
    console: mockConsole,
    restoreTimers: () => vi.useRealTimers(),
  };
}

/**
 * Clean up mocks after tests
 */
export function cleanupMocks() {
  vi.clearAllMocks();
  vi.useRealTimers();
}

/**
 * Create a test environment with all necessary mocks
 */
export function createTestEnvironment() {
  const globalMocks = setupGlobalMocks();
  const env = createMockEnv();
  const securityContext = createMockSecurityContext();
  const auditLogger = createMockAuditLogger();
  const rateLimitStorage = createMockRateLimitStorage();

  return {
    env,
    securityContext,
    auditLogger,
    rateLimitStorage,
    globalMocks,
    cleanup: cleanupMocks,
  };
}
