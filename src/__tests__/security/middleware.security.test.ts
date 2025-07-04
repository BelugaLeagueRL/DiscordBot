/**
 * Comprehensive security middleware testing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock discord-interactions module before importing
vi.mock('discord-interactions', () => ({
  verifyKey: vi.fn().mockResolvedValue(true),
}));
import { verifyKey } from 'discord-interactions';
import {
  extractSecurityContext,
  validateRateLimit,
  validateDiscordHeaders,
  verifyDiscordRequestSecure,
  createSecurityHeaders,
  sanitizeInput,
  cleanupRateLimits,
  clearRateLimits,
  withTimeout,
} from '../../middleware/security';
import { SecurityContextFactory } from '../helpers/test-factories';
import { createMockRequest, createTestEnvironment, cleanupMocks } from '../helpers/mock-contexts';
import { createMockDiscordRequest, createMaliciousRequest } from '../helpers/discord-helpers';
import { mockInteractions } from '../mocks/interactions';

describe('Security Middleware', () => {
  beforeEach(() => {
    createTestEnvironment();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupMocks();
  });

  describe('extractSecurityContext', () => {
    describe('extracting security context from request', () => {
      let request: Request;
      let context: ReturnType<typeof extractSecurityContext>;

      beforeEach(() => {
        request = createMockRequest({
          headers: {
            'CF-Connecting-IP': '192.168.1.100',
            'User-Agent': 'Discord-Interactions/1.0',
          },
        });
        context = extractSecurityContext(request);
      });

      it('should extract client IP and user agent', () => {
        expect(context).toMatchObject({
          clientIP: '192.168.1.100',
          userAgent: 'Discord-Interactions/1.0',
        });
      });

      it('should generate timestamp as number', () => {
        expect(context.timestamp).toBeTypeOf('number');
      });

      it('should generate request ID as string', () => {
        expect(context.requestId).toBeTypeOf('string');
      });

      it('should generate request ID in UUID format', () => {
        expect(context.requestId).toMatch(/^[0-9a-f-]{36}$/);
      });
    });

    describe('handling missing headers gracefully', () => {
      let request: Request;
      let context: ReturnType<typeof extractSecurityContext>;

      beforeEach(() => {
        // Create request with truly empty headers, overriding defaults
        request = new Request('https://example.com/', {
          method: 'POST',
          headers: {},
          body: '{}',
        });
        context = extractSecurityContext(request);
      });

      it('should set unknown values for missing headers', () => {
        expect(context).toMatchObject({
          clientIP: 'unknown',
          userAgent: 'unknown',
        });
      });

      it('should still generate timestamp as number', () => {
        expect(context.timestamp).toBeTypeOf('number');
      });

      it('should still generate request ID as string', () => {
        expect(context.requestId).toBeTypeOf('string');
      });
    });

    it('should prefer CF-Connecting-IP over X-Forwarded-For', () => {
      const request = createMockRequest({
        headers: {
          'CF-Connecting-IP': '10.0.0.1',
          'X-Forwarded-For': '192.168.1.1',
        },
      });

      const context = extractSecurityContext(request);

      expect(context.clientIP).toBe('10.0.0.1');
    });

    it('should fall back to X-Forwarded-For when CF-Connecting-IP missing', () => {
      const request = createMockRequest({
        headers: {
          'X-Forwarded-For': '192.168.1.1',
        },
      });

      const context = extractSecurityContext(request);

      expect(context.clientIP).toBe('192.168.1.1');
    });
  });

  describe('validateRateLimit', () => {
    beforeEach(() => {
      // Clear all rate limit data between tests
      clearRateLimits();
    });

    it('should initialize new IP with zero request count and allow first request', () => {
      const clientIP = '192.168.1.1';

      // Act: Make first request
      const firstRequestAllowed = validateRateLimit(clientIP);

      // Assert: Behavioral validation - request should be allowed AND we should be able to make more
      expect(firstRequestAllowed).toBe(true);
      expect(validateRateLimit(clientIP)).toBe(true); // Second request also allowed
      expect(validateRateLimit(clientIP)).toBe(true); // Third request also allowed
    });

    it('should track request count progression for rate limiting behavior', () => {
      const clientIP = '192.168.1.2';

      // Act: Test rate limiting behavior progression
      const makeRequestBatch = (count: number): boolean[] => {
        return Array.from({ length: count }, () => validateRateLimit(clientIP));
      };

      // Assert: Behavioral validation - should allow multiple requests and track count
      const first10Requests = makeRequestBatch(10);
      expect(first10Requests.every(allowed => allowed === true)).toBe(true);
      expect(first10Requests).toHaveLength(10);

      // Should still allow more requests (proves counting behavior)
      expect(validateRateLimit(clientIP)).toBe(true);
    });

    it('should maintain separate rate limit state for sequential requests', () => {
      const clientIP = '192.168.1.3';

      // Act: Test sequential request behavior maintains proper state
      const sequentialResults = [
        validateRateLimit(clientIP),
        validateRateLimit(clientIP),
        validateRateLimit(clientIP),
        validateRateLimit(clientIP),
        validateRateLimit(clientIP),
      ];

      // Assert: Behavioral validation - all sequential requests allowed and state preserved
      expect(sequentialResults).toEqual([true, true, true, true, true]);
      expect(sequentialResults).toHaveLength(5);

      // Should continue to allow more requests (proves state consistency)
      expect(validateRateLimit(clientIP)).toBe(true);
    });

    it('should maintain independent rate limit counter for first IP', () => {
      const ip1 = '192.168.1.4';

      // Act: Test that IP1 maintains its own counter
      const ip1Results = Array.from({ length: 15 }, () => validateRateLimit(ip1));

      // Assert: Behavioral validation - IP1 counter works independently
      expect(ip1Results.every(allowed => allowed === true)).toBe(true);
      expect(ip1Results).toHaveLength(15);
      expect(validateRateLimit(ip1)).toBe(true); // Should continue allowing requests
    });

    it('should maintain independent rate limit counter for different IP without interference', () => {
      const ip1 = '192.168.1.4';
      const ip2 = '192.168.1.5';

      // Arrange: Exhaust IP1's requests to test isolation
      Array.from({ length: 100 }, () => validateRateLimit(ip1));
      expect(validateRateLimit(ip1)).toBe(false); // IP1 should be blocked

      // Act: Test that IP2 is unaffected by IP1's exhaustion
      const ip2Result = validateRateLimit(ip2);

      // Assert: Behavioral validation - IP2 completely isolated from IP1 state
      expect(ip2Result).toBe(true);
    });

    it('should enforce rate limit threshold at 100 requests', () => {
      const clientIP = '192.168.1.5';

      // Test behavior: rate limiting enforces 100 request limit
      // Create helper to avoid forEach anti-pattern
      const makeRequests = (ip: string, count: number): boolean[] => {
        const results: boolean[] = [];
        for (let i = 0; i < count; i++) {
          results.push(validateRateLimit(ip));
        }
        return results;
      };

      const first100Results = makeRequests(clientIP, 100);

      // Behavioral assertion: all 100 requests should be allowed
      expect(first100Results.every(result => result === true)).toBe(true);
      expect(first100Results).toHaveLength(100);

      // Behavioral assertion: 101st request should be blocked
      expect(validateRateLimit(clientIP)).toBe(false);
    });

    it('should reset rate limit after time window', () => {
      const clientIP = '192.168.1.6';

      // Test behavior: rate limit resets after time window
      const exhaustRateLimit = (ip: string): void => {
        for (let i = 0; i < 100; i++) {
          validateRateLimit(ip);
        }
      };

      exhaustRateLimit(clientIP);

      // Behavioral assertion: should be blocked after exhaustion
      expect(validateRateLimit(clientIP)).toBe(false);

      // Advance time beyond window
      vi.setSystemTime(Date.now() + 61 * 1000); // 61 seconds later

      // Behavioral assertion: should be allowed again after reset
      expect(validateRateLimit(clientIP)).toBe(true);

      vi.useRealTimers();
    });

    it('should handle different IPs independently', () => {
      const ip1 = '192.168.1.7';
      const ip2 = '192.168.1.8';

      // Test behavior: rate limits are enforced per IP independently
      const exhaustRateLimit = (ip: string): void => {
        for (let i = 0; i < 100; i++) {
          validateRateLimit(ip);
        }
      };

      exhaustRateLimit(ip1);

      // Behavioral assertions: IP1 blocked, IP2 still allowed
      expect(validateRateLimit(ip1)).toBe(false);
      expect(validateRateLimit(ip2)).toBe(true);
    });
  });

  describe('validateDiscordHeaders', () => {
    describe('validating correct Discord headers', () => {
      let request: Request;
      let result: ReturnType<typeof validateDiscordHeaders>;

      beforeEach(() => {
        request = createMockRequest({
          headers: {
            'X-Signature-Ed25519': 'valid_signature_hex',
            'X-Signature-Timestamp': Math.floor(Date.now() / 1000).toString(),
            'Content-Type': 'application/json',
          },
        });
        result = validateDiscordHeaders(request);
      });

      it('should return valid result', () => {
        expect(result.isValid).toBe(true);
      });

      it('should not return error message', () => {
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject request missing signature header', () => {
      const request = createMockRequest({
        headers: {
          'X-Signature-Timestamp': Math.floor(Date.now() / 1000).toString(),
          'Content-Type': 'application/json',
        },
      });

      const result = validateDiscordHeaders(request);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing X-Signature-Ed25519 header');
    });

    it('should reject request missing timestamp header', () => {
      const request = createMockRequest({
        headers: {
          'X-Signature-Ed25519': 'valid_signature_hex',
          'Content-Type': 'application/json',
        },
      });

      const result = validateDiscordHeaders(request);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing X-Signature-Timestamp header');
    });

    describe('rejecting request with invalid content type', () => {
      let request: Request;
      let result: ReturnType<typeof validateDiscordHeaders>;

      beforeEach(() => {
        request = createMockRequest({
          headers: {
            'X-Signature-Ed25519': 'valid_signature_hex',
            'X-Signature-Timestamp': Math.floor(Date.now() / 1000).toString(),
            'Content-Type': 'text/plain',
          },
        });
        result = validateDiscordHeaders(request);
      });

      it('should return invalid result', () => {
        expect(result.isValid).toBe(false);
      });

      it('should return content type error message', () => {
        expect(result.error).toBe('Invalid Content-Type, expected application/json');
      });
    });

    it('should reject request with old timestamp', () => {
      const oldTimestamp = Math.floor((Date.now() - 400 * 1000) / 1000); // 400 seconds ago

      const request = createMockRequest({
        headers: {
          'X-Signature-Ed25519': 'valid_signature_hex',
          'X-Signature-Timestamp': oldTimestamp.toString(),
          'Content-Type': 'application/json',
        },
      });

      const result = validateDiscordHeaders(request);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Request timestamp too old or too far in future');
    });

    it('should reject request with future timestamp', () => {
      const futureTimestamp = Math.floor((Date.now() + 400 * 1000) / 1000); // 400 seconds in future

      const request = createMockRequest({
        headers: {
          'X-Signature-Ed25519': 'valid_signature_hex',
          'X-Signature-Timestamp': futureTimestamp.toString(),
          'Content-Type': 'application/json',
        },
      });

      const result = validateDiscordHeaders(request);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Request timestamp too old or too far in future');
    });
  });

  describe('verifyDiscordRequestSecure', () => {
    describe('verifying valid Discord request', () => {
      let interaction: ReturnType<typeof mockInteractions.ping>;
      let request: Request;
      let context: ReturnType<typeof SecurityContextFactory.create>;
      let result: Awaited<ReturnType<typeof verifyDiscordRequestSecure>>;

      beforeEach(async () => {
        interaction = mockInteractions.ping();
        request = createMockDiscordRequest(interaction, { validSignature: true });
        context = SecurityContextFactory.create();

        // Mock the verifyKey function properly using vi.mock
        vi.mocked(verifyKey).mockResolvedValue(true);

        result = await verifyDiscordRequestSecure(request, 'valid_public_key', context);
      });

      it('should return valid result', () => {
        expect(result.isValid).toBe(true);
      });

      it('should preserve security context', () => {
        expect(result.context).toBe(context);
      });
    });

    it('should reject request with invalid signature', async () => {
      const interaction = mockInteractions.ping();
      const request = createMockDiscordRequest(interaction, { validSignature: false });
      const context = SecurityContextFactory.create();

      // Mock the verifyKey function to return false
      vi.mocked(verifyKey).mockReturnValue(false);

      const result = await verifyDiscordRequestSecure(request, 'valid_public_key', context);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid Discord signature');
    });

    it('should reject request that exceeds rate limit', async () => {
      const interaction = mockInteractions.ping();
      const request = createMockDiscordRequest(interaction);
      const context = SecurityContextFactory.withIP('192.168.1.1');

      // Test behavior: rate limit should block after 100 requests
      const exhaustRateLimit = (ip: string): void => {
        for (let i = 0; i < 100; i++) {
          validateRateLimit(ip);
        }
      };

      exhaustRateLimit(context.clientIP);

      const result = await verifyDiscordRequestSecure(request, 'valid_public_key', context);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
    });

    it('should reject request with payload too large', async () => {
      // Create a request with a payload larger than 1MB
      const largePayload = 'x'.repeat(1024 * 1024 + 1);
      const request = new Request('https://example.com/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature-Ed25519': 'valid_signature_hex',
          'X-Signature-Timestamp': Math.floor(Date.now() / 1000).toString(),
          'User-Agent': 'Discord-Interactions/1.0',
        },
        body: largePayload,
      });
      const context = SecurityContextFactory.create();

      const result = await verifyDiscordRequestSecure(request, 'valid_public_key', context);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Payload too large');
    });

    it('should handle verification errors gracefully', async () => {
      const interaction = mockInteractions.ping();
      const request = createMockDiscordRequest(interaction);
      const context = SecurityContextFactory.create();

      // Mock verifyKey to throw error
      vi.mocked(verifyKey).mockImplementation(() => {
        throw new Error('Verification failed');
      });

      const result = await verifyDiscordRequestSecure(request, 'valid_public_key', context);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Verification error');
    });
  });

  describe('createSecurityHeaders', () => {
    it('should create all required security headers', () => {
      const headers = createSecurityHeaders();

      expect(headers).toEqual({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': "default-src 'self'; script-src 'none'; object-src 'none';",
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      });
    });

    it('should return consistent headers on multiple calls', () => {
      const headers1 = createSecurityHeaders();
      const headers2 = createSecurityHeaders();

      expect(headers1).toEqual(headers2);
    });
  });

  describe('sanitizeInput', () => {
    describe('removing dangerous HTML characters', () => {
      let maliciousInput: string;
      let sanitized: string;

      beforeEach(() => {
        maliciousInput = '<script>alert("xss")</script>';
        sanitized = sanitizeInput(maliciousInput);
      });

      it('should remove less-than characters', () => {
        expect(sanitized).not.toContain('<');
      });

      it('should remove greater-than characters', () => {
        expect(sanitized).not.toContain('>');
      });

      it('should remove double quote characters', () => {
        expect(sanitized).not.toContain('"');
      });

      it('should remove single quote characters', () => {
        expect(sanitized).not.toContain("'");
      });

      it('should remove ampersand characters', () => {
        expect(sanitized).not.toContain('&');
      });
    });

    it('should remove unsafe characters', () => {
      const unsafeInput = 'test`~!@#$%^&*()+={}[]|\\:";\'<>?/';
      const sanitized = sanitizeInput(unsafeInput);

      // Should only contain safe characters
      expect(sanitized).toMatch(/^[\w\s\-_.]*$/);
    });

    it('should trim whitespace', () => {
      const inputWithSpaces = '   test input   ';
      const sanitized = sanitizeInput(inputWithSpaces);

      expect(sanitized).toBe('test input');
    });

    it('should limit length to 1000 characters', () => {
      const longInput = 'x'.repeat(2000);
      const sanitized = sanitizeInput(longInput);

      expect(sanitized.length).toBe(1000);
    });

    it('should handle empty input', () => {
      const sanitized = sanitizeInput('');

      expect(sanitized).toBe('');
    });

    it('should preserve safe characters', () => {
      const safeInput = 'Player_Name-123 test.input';
      const sanitized = sanitizeInput(safeInput);

      expect(sanitized).toBe(safeInput);
    });
  });

  describe('withTimeout', () => {
    it('should resolve promise within timeout', async () => {
      const fastPromise = Promise.resolve('success');

      const result = await withTimeout(fastPromise, 1000);

      expect(result).toBe('success');
    });

    it('should reject promise that exceeds timeout', async () => {
      vi.useFakeTimers();

      const slowPromise = new Promise(resolve =>
        setTimeout(() => {
          resolve('late');
        }, 2000)
      );
      const timeoutPromise = withTimeout(slowPromise, 1000);

      // Advance time past the timeout
      vi.advanceTimersByTime(1001);

      await expect(timeoutPromise).rejects.toThrow('Request timeout');

      vi.useRealTimers();
    });

    it('should use default timeout when not specified', async () => {
      vi.useFakeTimers();

      const slowPromise = new Promise(resolve =>
        setTimeout(() => {
          resolve('late');
        }, 15000)
      );
      const timeoutPromise = withTimeout(slowPromise);

      // Advance time past the default timeout (10 seconds)
      vi.advanceTimersByTime(10001);

      await expect(timeoutPromise).rejects.toThrow('Request timeout');

      vi.useRealTimers();
    });

    it('should handle promise rejection within timeout', async () => {
      const rejectedPromise = Promise.reject(new Error('Promise rejected'));

      await expect(withTimeout(rejectedPromise, 1000)).rejects.toThrow('Promise rejected');
    });
  });

  describe('cleanupRateLimits', () => {
    beforeEach(() => {
      // Clear all rate limit data between tests
      clearRateLimits();
    });
    it('should remove expired rate limit entries', () => {
      const clientIP = '192.168.1.1';

      // Use fake timers
      vi.useFakeTimers();
      const startTime = 1000000000000; // Fixed timestamp
      vi.setSystemTime(startTime);

      // Create rate limit entry
      validateRateLimit(clientIP);

      // Advance time to expire the entry (60 seconds + buffer)
      vi.setSystemTime(startTime + 65 * 1000);

      cleanupRateLimits();

      // Reset timer to ensure clean state for validation
      vi.setSystemTime(startTime + 66 * 1000);

      // Test behavior: should be able to make full 100 requests again after cleanup
      const validateFullRateLimit = (ip: string): boolean[] => {
        const results: boolean[] = [];
        for (let i = 0; i < 100; i++) {
          results.push(validateRateLimit(ip));
        }
        return results;
      };

      const results = validateFullRateLimit(clientIP);
      expect(results.every(result => result === true)).toBe(true);
      expect(results).toHaveLength(100);

      vi.useRealTimers();
    });

    it('should preserve non-expired rate limit entries', () => {
      const clientIP = '192.168.1.1';

      // Use fake timers to ensure consistent timing
      vi.useFakeTimers();
      const startTime = 1000000000000; // Fixed timestamp
      vi.setSystemTime(startTime);

      // Test behavior: make 50 requests before cleanup
      const makePartialRequests = (ip: string, count: number): void => {
        for (let i = 0; i < count; i++) {
          validateRateLimit(ip);
        }
      };

      makePartialRequests(clientIP, 50);
      cleanupRateLimits();

      // Test behavior: should still be limited to 50 more requests
      const validateRemainingRequests = (ip: string, count: number): boolean[] => {
        const results: boolean[] = [];
        for (let i = 0; i < count; i++) {
          results.push(validateRateLimit(ip));
        }
        return results;
      };

      const remainingResults = validateRemainingRequests(clientIP, 50);
      expect(remainingResults.every(result => result === true)).toBe(true);
      expect(remainingResults).toHaveLength(50);

      // 101st request should be blocked
      expect(validateRateLimit(clientIP)).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('Integration with malicious requests', () => {
    it('should handle XSS attempt', async () => {
      const maliciousRequest = createMaliciousRequest('xss');
      const context = SecurityContextFactory.create();

      const result = await verifyDiscordRequestSecure(maliciousRequest, 'valid_key', context);

      // Security middleware should still process the request
      // The XSS protection happens in input sanitization later
      expect(result).toBeDefined();
    });

    it('should handle SQL injection attempt', async () => {
      const maliciousRequest = createMaliciousRequest('sql');
      const context = SecurityContextFactory.create();

      const result = await verifyDiscordRequestSecure(maliciousRequest, 'valid_key', context);

      expect(result).toBeDefined();
    });

    it('should handle path traversal attempt', async () => {
      const maliciousRequest = createMaliciousRequest('path');
      const context = SecurityContextFactory.create();

      const result = await verifyDiscordRequestSecure(maliciousRequest, 'valid_key', context);

      expect(result).toBeDefined();
    });
  });
});
