/**
 * Comprehensive security middleware testing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  extractSecurityContext,
  validateRateLimit,
  validateDiscordHeaders,
  verifyDiscordRequestSecure,
  createSecurityHeaders,
  sanitizeInput,
  cleanupRateLimits,
  withTimeout,
} from '../../middleware/security';
import { SecurityContextFactory, EnvFactory } from '../helpers/test-factories';
import { createMockRequest, createTestEnvironment, cleanupMocks } from '../helpers/mock-contexts';
import { createMockDiscordRequest, createMaliciousRequest, createTimeoutRequest } from '../helpers/discord-helpers';
import { mockInteractions } from '../mocks/interactions';

describe('Security Middleware', () => {
  let testEnv: ReturnType<typeof createTestEnvironment>;

  beforeEach(() => {
    testEnv = createTestEnvironment();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupMocks();
  });

  describe('extractSecurityContext', () => {
    it('should extract security context from request', () => {
      const request = createMockRequest({
        headers: {
          'CF-Connecting-IP': '192.168.1.100',
          'User-Agent': 'Discord-Interactions/1.0',
        },
      });

      const context = extractSecurityContext(request);

      expect(context).toMatchObject({
        clientIP: '192.168.1.100',
        userAgent: 'Discord-Interactions/1.0',
        timestamp: expect.any(Number),
        requestId: expect.any(String),
      });
      expect(context.requestId).toMatch(/^[0-9a-f-]{36}$/); // UUID format
    });

    it('should handle missing headers gracefully', () => {
      const request = createMockRequest({ headers: {} });

      const context = extractSecurityContext(request);

      expect(context).toMatchObject({
        clientIP: 'unknown',
        userAgent: 'unknown',
        timestamp: expect.any(Number),
        requestId: expect.any(String),
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
      // Clean up any existing rate limit data
      cleanupRateLimits();
    });

    it('should allow requests within rate limit', () => {
      const clientIP = '192.168.1.1';

      // First request should be allowed
      expect(validateRateLimit(clientIP)).toBe(true);
    });

    it('should track request count correctly', () => {
      const clientIP = '192.168.1.1';

      // Make several requests
      for (let i = 0; i < 5; i++) {
        expect(validateRateLimit(clientIP)).toBe(true);
      }
    });

    it('should block requests after exceeding rate limit', () => {
      const clientIP = '192.168.1.1';

      // Exhaust rate limit (100 requests)
      for (let i = 0; i < 100; i++) {
        validateRateLimit(clientIP);
      }

      // 101st request should be blocked
      expect(validateRateLimit(clientIP)).toBe(false);
    });

    it('should reset rate limit after time window', () => {
      const clientIP = '192.168.1.1';

      // Exhaust rate limit
      for (let i = 0; i < 100; i++) {
        validateRateLimit(clientIP);
      }

      // Should be blocked
      expect(validateRateLimit(clientIP)).toBe(false);

      // Advance time beyond window (mock implementation would need time mocking)
      vi.setSystemTime(Date.now() + 61 * 1000); // 61 seconds later

      // Should be allowed again
      expect(validateRateLimit(clientIP)).toBe(true);

      vi.useRealTimers();
    });

    it('should handle different IPs independently', () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';

      // Exhaust rate limit for IP1
      for (let i = 0; i < 100; i++) {
        validateRateLimit(ip1);
      }

      // IP1 should be blocked
      expect(validateRateLimit(ip1)).toBe(false);

      // IP2 should still be allowed
      expect(validateRateLimit(ip2)).toBe(true);
    });
  });

  describe('validateDiscordHeaders', () => {
    it('should validate correct Discord headers', () => {
      const request = createMockRequest({
        headers: {
          'X-Signature-Ed25519': 'valid_signature_hex',
          'X-Signature-Timestamp': Math.floor(Date.now() / 1000).toString(),
          'Content-Type': 'application/json',
        },
      });

      const result = validateDiscordHeaders(request);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
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

    it('should reject request with invalid content type', () => {
      const request = createMockRequest({
        headers: {
          'X-Signature-Ed25519': 'valid_signature_hex',
          'X-Signature-Timestamp': Math.floor(Date.now() / 1000).toString(),
          'Content-Type': 'text/plain',
        },
      });

      const result = validateDiscordHeaders(request);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid Content-Type, expected application/json');
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
    it('should verify valid Discord request', async () => {
      const interaction = mockInteractions.ping();
      const request = createMockDiscordRequest(interaction, { validSignature: true });
      const context = SecurityContextFactory.create();

      // Mock verifyKey to return true
      vi.doMock('discord-interactions', () => ({
        verifyKey: vi.fn().mockResolvedValue(true),
      }));

      const result = await verifyDiscordRequestSecure(request, 'valid_public_key', context);

      expect(result.isValid).toBe(true);
      expect(result.context).toBe(context);
    });

    it('should reject request with invalid signature', async () => {
      const interaction = mockInteractions.ping();
      const request = createMockDiscordRequest(interaction, { validSignature: false });
      const context = SecurityContextFactory.create();

      // Mock verifyKey to return false
      vi.doMock('discord-interactions', () => ({
        verifyKey: vi.fn().mockResolvedValue(false),
      }));

      const result = await verifyDiscordRequestSecure(request, 'valid_public_key', context);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid Discord signature');
    });

    it('should reject request that exceeds rate limit', async () => {
      const interaction = mockInteractions.ping();
      const request = createMockDiscordRequest(interaction);
      const context = SecurityContextFactory.withIP('192.168.1.1');

      // Exhaust rate limit first
      for (let i = 0; i < 100; i++) {
        validateRateLimit(context.clientIP);
      }

      const result = await verifyDiscordRequestSecure(request, 'valid_public_key', context);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
    });

    it('should reject request with payload too large', async () => {
      const largeInteraction = mockInteractions.largePayload();
      const request = createMockDiscordRequest(largeInteraction);
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
      vi.doMock('discord-interactions', () => ({
        verifyKey: vi.fn().mockRejectedValue(new Error('Verification failed')),
      }));

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
    it('should remove dangerous HTML characters', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const sanitized = sanitizeInput(maliciousInput);

      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).not.toContain('"');
      expect(sanitized).not.toContain("'");
      expect(sanitized).not.toContain('&');
    });

    it('should remove unsafe characters', () => {
      const unsafeInput = 'test`~!@#$%^&*()+={}[]|\\:";\'<>?/';
      const sanitized = sanitizeInput(unsafeInput);

      // Should only contain safe characters
      expect(sanitized).toMatch(/^[w\s\-_.]*$/);
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
      const slowPromise = new Promise(resolve => setTimeout(() => resolve('late'), 2000));

      await expect(withTimeout(slowPromise, 1000)).rejects.toThrow('Request timeout');
    });

    it('should use default timeout when not specified', async () => {
      const slowPromise = new Promise(resolve => setTimeout(() => resolve('late'), 15000));

      await expect(withTimeout(slowPromise)).rejects.toThrow('Request timeout');
    });

    it('should handle promise rejection within timeout', async () => {
      const rejectedPromise = Promise.reject(new Error('Promise rejected'));

      await expect(withTimeout(rejectedPromise, 1000)).rejects.toThrow('Promise rejected');
    });
  });

  describe('cleanupRateLimits', () => {
    it('should remove expired rate limit entries', () => {
      const clientIP = '192.168.1.1';

      // Create rate limit entry
      validateRateLimit(clientIP);

      // Advance time to expire the entry
      vi.setSystemTime(Date.now() + 65 * 1000); // 65 seconds later

      cleanupRateLimits();

      // Should be able to make full 100 requests again
      for (let i = 0; i < 100; i++) {
        expect(validateRateLimit(clientIP)).toBe(true);
      }

      vi.useRealTimers();
    });

    it('should preserve non-expired rate limit entries', () => {
      const clientIP = '192.168.1.1';

      // Make 50 requests
      for (let i = 0; i < 50; i++) {
        validateRateLimit(clientIP);
      }

      cleanupRateLimits();

      // Should still be limited to 50 more requests
      for (let i = 0; i < 50; i++) {
        expect(validateRateLimit(clientIP)).toBe(true);
      }

      // 101st request should be blocked
      expect(validateRateLimit(clientIP)).toBe(false);
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