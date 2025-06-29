/**
 * Production validation integration tests
 * These tests validate actual production readiness with real secrets and environments
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { validateProductionSecrets } from '../../utils/production-secrets';
import { createProductionHealthCheck } from '../../utils/health-check';
import type { Env } from '../../index';

describe('Production Validation Integration Tests', () => {
  let realEnv: Partial<Env>;
  
  beforeAll(() => {
    // Use real environment variables if available
    realEnv = {
      DISCORD_TOKEN: process.env.DISCORD_TOKEN,
      DISCORD_PUBLIC_KEY: process.env.DISCORD_PUBLIC_KEY,
      DISCORD_APPLICATION_ID: process.env.DISCORD_APPLICATION_ID,
      DATABASE_URL: process.env.DATABASE_URL,
      GOOGLE_SHEETS_API_KEY: process.env.GOOGLE_SHEETS_API_KEY,
      ENVIRONMENT: process.env.ENVIRONMENT ?? 'test',
    };
  });

  describe('Real Secret Validation', () => {
    it('should validate production secrets when they exist', () => {
      const result = validateProductionSecrets(realEnv);
      
      // If we have real secrets, they should be valid
      if (realEnv.DISCORD_TOKEN && realEnv.DISCORD_PUBLIC_KEY && realEnv.DISCORD_APPLICATION_ID) {
        expect(result.isValid).toBe(true);
        expect(result.missingSecrets).toHaveLength(0);
      } else {
        // If we don't have real secrets, validation should fail appropriately
        expect(result.isValid).toBe(false);
        expect(result.missingSecrets.length).toBeGreaterThan(0);
      }
    });

    it('should identify missing production secrets', () => {
      const emptyEnv = {};
      const result = validateProductionSecrets(emptyEnv);
      
      expect(result.isValid).toBe(false);
      expect(result.missingSecrets).toEqual([
        'DISCORD_TOKEN',
        'DISCORD_PUBLIC_KEY', 
        'DISCORD_APPLICATION_ID'
      ]);
    });
  });

  describe('Real Health Check Integration', () => {
    it('should create health check with real environment', () => {
      const healthCheck = createProductionHealthCheck(realEnv);
      const status = healthCheck.getStatus();
      
      expect(status).toMatchObject({
        status: expect.stringMatching(/^(healthy|unhealthy)$/) as string,
        timestamp: expect.any(Number) as number,
        checks: {
          secrets: expect.stringMatching(/^(pass|fail)$/) as string
        }
      });
      
      // If we have real secrets, health should be healthy
      if (realEnv.DISCORD_TOKEN && realEnv.DISCORD_PUBLIC_KEY && realEnv.DISCORD_APPLICATION_ID) {
        expect(status.status).toBe('healthy');
        expect(status.checks.secrets).toBe('pass');
      } else {
        expect(status.status).toBe('unhealthy');
        expect(status.checks.secrets).toBe('fail');
      }
    });
  });

  describe('Discord Public Key Format Validation', () => {
    it('should validate Discord public key format if present', () => {
      if (realEnv.DISCORD_PUBLIC_KEY) {
        // Discord public keys should be 64 character hex strings
        expect(realEnv.DISCORD_PUBLIC_KEY).toMatch(/^[0-9a-fA-F]{64}$/);
      }
    });

    it('should validate Discord application ID format if present', () => {
      if (realEnv.DISCORD_APPLICATION_ID) {
        // Discord application IDs should be 17-19 digit strings
        expect(realEnv.DISCORD_APPLICATION_ID).toMatch(/^\d{17,19}$/);
      }
    });

    it('should validate Discord token format if present', () => {
      if (realEnv.DISCORD_TOKEN) {
        // Discord bot tokens should start with the bot ID
        expect(realEnv.DISCORD_TOKEN).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
      }
    });
  });

  describe('Real Network Connectivity Tests', () => {
    it.skip('should be able to reach Discord API endpoints', async () => {
      // This test is skipped by default to avoid making real API calls in CI
      // Uncomment and run manually for production validation
      
      if (!realEnv.DISCORD_TOKEN) {
        return; // Skip if no real token
      }

      const response = await fetch('https://discord.com/api/v10/applications/@me', {
        headers: {
          'Authorization': `Bot ${realEnv.DISCORD_TOKEN}`,
          'User-Agent': 'BelugaBot/1.0',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('id', realEnv.DISCORD_APPLICATION_ID);
    });

    it.skip('should be able to reach Google Sheets API if configured', async () => {
      // This test is skipped by default to avoid making real API calls in CI
      
      if (!realEnv.GOOGLE_SHEETS_API_KEY) {
        return; // Skip if no API key
      }

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/test?key=${realEnv.GOOGLE_SHEETS_API_KEY}`
      );

      // Should get a 400 or 404 (not 401/403 which would indicate auth issues)
      expect([400, 404]).toContain(response.status);
    });
  });
});