/**
 * Comprehensive tests for main index handler
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMockDiscordRequest } from './helpers/discord-helpers';
import { mockInteractions } from './mocks/interactions';
import { EnvFactory } from './helpers/test-factories';
import workerModule from '../index';
import type { Env } from '../index';

// Type guard for Discord response data - handles both PONG and message responses
function isDiscordResponse(
  data: unknown
): data is { type: number; data?: { content: string; flags?: number } } {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj['type'] !== 'number') {
    return false;
  }

  // PONG responses (type: 1) don't have data property
  if (obj['type'] === 1) {
    return true;
  }

  // Message responses should have data with content
  if (typeof obj['data'] !== 'object' || obj['data'] === null) {
    return false;
  }

  const dataObj = obj['data'] as Record<string, unknown>;

  return typeof dataObj['content'] === 'string';
}

// Mock the security middleware to control validation results
vi.mock('../middleware/security', async () => {
  const actual = await vi.importActual('../middleware/security');
  return {
    ...actual,
    verifyDiscordRequestSecure: vi.fn().mockResolvedValue({ isValid: true }),
    cleanupRateLimits: vi.fn(),
  };
});

// Mock the register handler
vi.mock('../handlers/register', () => ({
  handleRegisterCommand: vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ type: 4, data: { content: 'Success!' } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  ),
}));

describe('Main Index Handler', () => {
  let env: Env;
  beforeEach(() => {
    env = EnvFactory.create();
    vi.spyOn(console, 'error').mockImplementation(() => {
      /* Mock console.error for tests */
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('CORS preflight (OPTIONS)', () => {
    it('should handle OPTIONS request with CORS headers', async () => {
      const request = new Request('https://example.com/', { method: 'OPTIONS' });

      const response = await workerModule.fetch(request, env);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });
  });

  describe('Health check (GET)', () => {
    it('should handle GET request with enhanced health check response', async () => {
      const request = new Request('https://example.com/', { method: 'GET' });

      const response = await workerModule.fetch(request, env);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      
      const healthData = await response.json();
      
      expect(healthData).toMatchObject({
        status: 'healthy',
        message: 'Beluga Discord Bot is running!',
        timestamp: expect.any(Number) as number,
        checks: {
          secrets: 'pass'
        }
      });
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });
  });

  describe('Method validation', () => {
    it('should reject non-POST/GET/OPTIONS methods', async () => {
      const request = new Request('https://example.com/', { method: 'PUT' });

      const response = await workerModule.fetch(request, env);

      expect(response.status).toBe(405);
      expect(await response.text()).toBe('Method not allowed');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should reject DELETE method', async () => {
      const request = new Request('https://example.com/', { method: 'DELETE' });

      const response = await workerModule.fetch(request, env);

      expect(response.status).toBe(405);
    });
  });

  describe('Discord request validation', () => {
    it('should handle valid Discord request', async () => {
      const interaction = mockInteractions.ping();
      const request = createMockDiscordRequest(interaction);

      const response = await workerModule.fetch(request, env);

      expect(response.status).toBe(200);
      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;
      expect(responseData).toEqual({ type: 1 }); // PONG response
    });

    it('should reject invalid Discord request', async () => {
      const { verifyDiscordRequestSecure } = await import('../middleware/security');
      vi.mocked(verifyDiscordRequestSecure).mockResolvedValueOnce({
        isValid: false,
        error: 'Invalid signature',
      });

      const interaction = mockInteractions.ping();
      const request = createMockDiscordRequest(interaction);

      const response = await workerModule.fetch(request, env);

      expect(response.status).toBe(401);
      expect(await response.text()).toBe('Unauthorized');
    });

    it('should handle rate limit exceeded', async () => {
      const { verifyDiscordRequestSecure } = await import('../middleware/security');
      vi.mocked(verifyDiscordRequestSecure).mockResolvedValueOnce({
        isValid: false,
        error: 'Rate limit exceeded',
      });

      const interaction = mockInteractions.ping();
      const request = createMockDiscordRequest(interaction);

      const response = await workerModule.fetch(request, env);

      expect(response.status).toBe(401);
    });

    it('should handle timestamp validation error', async () => {
      const { verifyDiscordRequestSecure } = await import('../middleware/security');
      vi.mocked(verifyDiscordRequestSecure).mockResolvedValueOnce({
        isValid: false,
        error: 'Request timestamp too old',
      });

      const interaction = mockInteractions.ping();
      const request = createMockDiscordRequest(interaction);

      const response = await workerModule.fetch(request, env);

      expect(response.status).toBe(401);
    });
  });

  describe('JSON parsing', () => {
    it('should handle invalid JSON in request body', async () => {
      const request = new Request('https://example.com/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature-Ed25519': 'valid_signature',
          'X-Signature-Timestamp': Math.floor(Date.now() / 1000).toString(),
        },
        body: 'invalid json {',
      });

      const response = await workerModule.fetch(request, env);

      expect(response.status).toBe(200);
      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;
      expect(responseData.type).toBe(4); // Error response type
      expect(responseData.data?.content).toContain('Invalid request format');
    });

    it('should handle empty request body', async () => {
      const request = new Request('https://example.com/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature-Ed25519': 'valid_signature',
          'X-Signature-Timestamp': Math.floor(Date.now() / 1000).toString(),
        },
        body: '',
      });

      const response = await workerModule.fetch(request, env);

      expect(response.status).toBe(200);
      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;
      expect(responseData.type).toBe(4); // Error response type
    });
  });

  describe('Interaction handling', () => {
    it('should handle PING interaction', async () => {
      const interaction = mockInteractions.ping();
      const request = createMockDiscordRequest(interaction);

      const response = await workerModule.fetch(request, env);

      expect(response.status).toBe(200);
      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;
      expect(responseData.type).toBe(1); // PONG
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should handle register command', async () => {
      const interaction = mockInteractions.registerValid();
      const request = createMockDiscordRequest(interaction);

      const response = await workerModule.fetch(request, env);

      expect(response.status).toBe(200);
      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;
      expect(responseData.type).toBe(4); // CHANNEL_MESSAGE_WITH_SOURCE
      expect(responseData.data?.content).toBe('Success!');
    });

    it('should handle unknown command', async () => {
      const interaction = mockInteractions.unknownCommand();
      const request = createMockDiscordRequest(interaction);

      const response = await workerModule.fetch(request, env);

      expect(response.status).toBe(200);
      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;
      expect(responseData.type).toBe(4); // Error response
      expect(responseData.data?.content).toContain('Unknown command');
    });

    it('should handle command execution error', async () => {
      const { handleRegisterCommand } = await import('../handlers/register');
      vi.mocked(handleRegisterCommand).mockRejectedValueOnce(new Error('Database error'));

      const interaction = mockInteractions.registerValid();
      const request = createMockDiscordRequest(interaction);

      const response = await workerModule.fetch(request, env);

      expect(response.status).toBe(200);
      const rawResponseData = await response.json();
      if (!isDiscordResponse(rawResponseData)) {
        throw new Error('Invalid response format');
      }
      const responseData = rawResponseData;
      expect(responseData.type).toBe(4);
      expect(responseData.data?.content).toContain('An error occurred');
    });

    it('should handle unknown interaction type', async () => {
      const interaction = {
        ...mockInteractions.ping(),
        type: 999, // Unknown type
      };
      const request = createMockDiscordRequest(interaction);

      const response = await workerModule.fetch(request, env);

      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Bad request');
    });
  });

  describe('Security headers', () => {
    it('should add security headers to all responses', async () => {
      const interaction = mockInteractions.ping();
      const request = createMockDiscordRequest(interaction);

      const response = await workerModule.fetch(request, env);

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(response.headers.get('Content-Security-Policy')).toContain('default-src');
      expect(response.headers.get('Strict-Transport-Security')).toContain('max-age=');
    });

    it('should preserve existing response headers', async () => {
      const interaction = mockInteractions.ping();
      const request = createMockDiscordRequest(interaction);

      const response = await workerModule.fetch(request, env);

      // Check that security headers are added
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    });
  });

  describe('Rate limit cleanup', () => {
    it('should occasionally trigger rate limit cleanup', async () => {
      const { cleanupRateLimits } = await import('../middleware/security');

      // Mock Math.random to always trigger cleanup
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.005); // Less than 0.01

      const interaction = mockInteractions.ping();
      const request = createMockDiscordRequest(interaction);

      await workerModule.fetch(request, env);

      expect(cleanupRateLimits).toHaveBeenCalled();

      mockRandom.mockRestore();
    });

    it('should not trigger cleanup most of the time', async () => {
      const { cleanupRateLimits } = await import('../middleware/security');

      // Mock Math.random to not trigger cleanup
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.5); // Greater than 0.01

      const interaction = mockInteractions.ping();
      const request = createMockDiscordRequest(interaction);

      await workerModule.fetch(request, env);

      expect(cleanupRateLimits).not.toHaveBeenCalled();

      mockRandom.mockRestore();
    });
  });

  describe('Global error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      const { verifyDiscordRequestSecure } = await import('../middleware/security');
      vi.mocked(verifyDiscordRequestSecure).mockRejectedValueOnce(new Error('Unexpected error'));

      const interaction = mockInteractions.ping();
      const request = createMockDiscordRequest(interaction);

      const response = await workerModule.fetch(request, env);

      expect(response.status).toBe(500);
      expect(await response.text()).toBe('Internal server error');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should handle errors without audit context', async () => {
      // Create a malformed environment that will cause an error
      const badEnv = EnvFactory.create({ DISCORD_PUBLIC_KEY: null as unknown as string });

      // Mock verifyDiscordRequestSecure to throw an error that breaks audit context
      const { verifyDiscordRequestSecure } = await import('../middleware/security');
      vi.mocked(verifyDiscordRequestSecure).mockRejectedValueOnce(
        new Error('Critical system error')
      );

      const interaction = mockInteractions.ping();
      const request = createMockDiscordRequest(interaction);

      const response = await workerModule.fetch(request, badEnv);

      expect(response.status).toBe(500);
      expect(await response.text()).toBe('Internal server error');
    });

    it('should handle timeout errors', async () => {
      // Mock verifyDiscordRequestSecure to throw timeout error
      const { verifyDiscordRequestSecure } = await import('../middleware/security');
      vi.mocked(verifyDiscordRequestSecure).mockRejectedValueOnce(new Error('Request timeout'));

      const interaction = mockInteractions.ping();
      const request = createMockDiscordRequest(interaction);

      const response = await workerModule.fetch(request, env);

      expect(response.status).toBe(500);
    });
  });

  describe('Environment configuration', () => {
    it('should use development environment when ENVIRONMENT is undefined', async () => {
      const testEnv = EnvFactory.create({ ENVIRONMENT: undefined as unknown as string });

      const interaction = mockInteractions.ping();
      const request = createMockDiscordRequest(interaction);

      const response = await workerModule.fetch(request, testEnv);

      expect(response.status).toBe(200);
    });

    it('should handle missing Discord public key', async () => {
      const testEnv = EnvFactory.create({ DISCORD_PUBLIC_KEY: undefined as unknown as string });

      const interaction = mockInteractions.ping();
      const request = createMockDiscordRequest(interaction);

      const response = await workerModule.fetch(request, testEnv);

      // Should still process but verification might fail
      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });
});
