/**
 * Functional tests for URL validation business logic
 * Tests CURRENT implementation and identifies REAL gaps vs requirements
 */

import { describe, it, expect } from 'vitest';
import { validateTrackerUrl } from '../../application_commands/register/handler';
import { createValidEpicTrackerUrl, createInvalidEpicTrackerUrl } from '../helpers/test-factories';

describe('Current URL Validation Implementation', () => {
  describe('Basic URL Structure Validation', () => {
    it('should accept valid tracker URLs', () => {
      const validUrl =
        'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198123456789/overview';
      const result = validateTrackerUrl(validUrl);

      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('steam');
      expect(result.platformId).toBe('76561198123456789');
    });

    it('should reject wrong domain', () => {
      const invalidUrl = 'https://example.com/rocket-league/profile/steam/testuser/overview';
      const result = validateTrackerUrl(invalidUrl);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('rocketleague.tracker.network');
    });

    it('should reject malformed URLs', () => {
      const invalidUrl = 'not-a-url';
      const result = validateTrackerUrl(invalidUrl);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid URL format');
    });

    it('should validate exact path structure', () => {
      const invalidPath = 'https://rocketleague.tracker.network/wrong/path/steam/testuser/overview';
      const result = validateTrackerUrl(invalidPath);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('URL must follow the format');
    });
  });

  describe('Platform Support Validation', () => {
    it('should accept all supported platforms', () => {
      const validPlatformIds = {
        steam: '76561198123456789', // Valid Steam ID64
        epic: 'TestUser123', // Valid Epic username
        psn: 'TestUser123', // Valid PSN ID
        xbl: 'TestUser123', // Valid Xbox gamertag
        switch: 'TestUser123', // Valid Nintendo Switch ID
      };

      Object.entries(validPlatformIds).forEach(([platform, platformId]) => {
        const url = `https://rocketleague.tracker.network/rocket-league/profile/${platform}/${platformId}/overview`;
        const result = validateTrackerUrl(url);

        expect(result.isValid).toBe(true);
        expect(result.platform).toBe(platform);
      });
    });

    it('should reject unsupported platforms', () => {
      const invalidUrl =
        'https://rocketleague.tracker.network/rocket-league/profile/mobile/testuser/overview';
      const result = validateTrackerUrl(invalidUrl);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unsupported platform');
    });

    it('should handle platform case sensitivity', () => {
      const upperUrl =
        'https://rocketleague.tracker.network/rocket-league/profile/STEAM/76561198123456789/overview';
      const result = validateTrackerUrl(upperUrl);

      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('steam'); // Should normalize to lowercase
    });
  });

  describe('Platform ID Basic Validation', () => {
    it('should reject platform IDs that are too short', () => {
      const shortUrl =
        'https://rocketleague.tracker.network/rocket-league/profile/steam/ab/overview';
      const result = validateTrackerUrl(shortUrl);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid Steam ID64 format');
    });

    it('should accept minimum length platform IDs for appropriate platforms', () => {
      const minUrl = 'https://rocketleague.tracker.network/rocket-league/profile/epic/abc/overview';
      const result = validateTrackerUrl(minUrl);

      expect(result.isValid).toBe(true);
      expect(result.platformId).toBe('abc');
    });
  });
});

describe('Security and Edge Case Analysis', () => {
  describe('Current Security Gaps', () => {
    it('SECURITY: path validation rejects URLs with HTML/script tags', () => {
      // The path validation rejects URLs that don't match exact format
      const xssUrl =
        'https://rocketleague.tracker.network/rocket-league/profile/steam/<script>alert(1)</script>/overview';
      const result = validateTrackerUrl(xssUrl);

      // Path validation fails because HTML tags break the path count - this is GOOD
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('URL must follow the format');
    });

    it('SECURITY FIXED: rejects URLs with SQL injection attempts', () => {
      // Security vulnerability has been FIXED - now properly rejects malicious input
      const sqlUrl =
        "https://rocketleague.tracker.network/rocket-league/profile/steam/test'; DROP TABLE users; --/overview";
      const result = validateTrackerUrl(sqlUrl);

      // Enhanced validation now blocks this - SECURITY FIXED
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid Steam ID64 format');
    });

    it('SECURITY FIXED: rejects extremely long platform IDs (DoS protection)', () => {
      // DoS vulnerability has been FIXED - now limits platform ID length
      const longId = 'a'.repeat(10000);
      const longUrl = `https://rocketleague.tracker.network/rocket-league/profile/steam/${longId}/overview`;
      const result = validateTrackerUrl(longUrl);

      // Enhanced validation now blocks this - DoS PROTECTION ACTIVE
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Platform ID too long (maximum 100 characters)');
    });
  });

  describe('URL Encoding Issues', () => {
    it('FUNCTIONAL FIXED: now properly handles and validates URL encoded characters', () => {
      // Real tracker URLs might have encoded characters - now properly decoded and validated
      const encodedUrl =
        'https://rocketleague.tracker.network/rocket-league/profile/epic/Test%20Player/overview';
      const result = validateTrackerUrl(encodedUrl);

      // Enhanced implementation now decodes and validates properly (spaces are allowed in Epic usernames)
      expect(result.isValid).toBe(true);
    });

    it('FUNCTIONAL FIXED: now validates platform-specific format constraints', () => {
      // Based on research, PSN doesn't allow spaces in IDs - now properly validated
      const spaceUrl =
        'https://rocketleague.tracker.network/rocket-league/profile/psn/Test Player/overview';
      const result = validateTrackerUrl(spaceUrl);

      // Enhanced validation now enforces platform-specific constraints
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid PSN ID format');
    });
  });
});

describe('Platform-Specific Validation Gaps', () => {
  describe('Steam ID Format Issues', () => {
    it('FUNCTIONAL FIXED: now rejects invalid Steam ID formats', () => {
      // Steam IDs should be 17-digit numbers starting with 7656119 - now properly validated
      const invalidSteamUrl =
        'https://rocketleague.tracker.network/rocket-league/profile/steam/invalid_steam_id/overview';
      const result = validateTrackerUrl(invalidSteamUrl);

      // Enhanced implementation now enforces Steam ID64 format
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid Steam ID64 format');
    });

    it('FUNCTIONAL GAP: should validate 64-bit Steam ID format', () => {
      // Real Steam ID format validation is missing
      const realSteamUrl =
        'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198144145654/overview';
      const result = validateTrackerUrl(realSteamUrl);

      // This should pass but for wrong reasons (any string > 3 chars)
      expect(result.isValid).toBe(true);
      expect(result.platformId).toBe('76561198144145654');
    });
  });

  describe('PSN ID Format Issues', () => {
    it('FUNCTIONAL FIXED: now rejects PSN IDs starting with numbers', () => {
      // PSN IDs must start with a letter according to research - now properly validated
      const invalidPsnUrl =
        'https://rocketleague.tracker.network/rocket-league/profile/psn/123invalid/overview';
      const result = validateTrackerUrl(invalidPsnUrl);

      // Enhanced implementation now enforces PSN letter-start requirement
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid PSN ID format');
    });

    it('FUNCTIONAL FIXED: now rejects PSN IDs with invalid characters', () => {
      // PSN only allows letters, numbers, hyphens, underscores - now properly validated
      const invalidPsnUrl =
        'https://rocketleague.tracker.network/rocket-league/profile/psn/test@user/overview';
      const result = validateTrackerUrl(invalidPsnUrl);

      // Enhanced implementation now enforces PSN character restrictions
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid PSN ID format');
    });
  });

  describe('Xbox Gamertag Issues', () => {
    it('FUNCTIONAL FIXED: now rejects Xbox gamertags that are too long', () => {
      // Xbox gamertags are limited to 12 characters - now properly validated
      const longXboxUrl =
        'https://rocketleague.tracker.network/rocket-league/profile/xbl/VeryLongGamertagName/overview';
      const result = validateTrackerUrl(longXboxUrl);

      // Enhanced implementation now enforces Xbox 12-character limit
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid Xbox gamertag format');
    });
  });
});

describe('Epic Games Display Name Validation', () => {
  describe('Valid Epic URLs', () => {
    it('should accept valid Epic URLs', () => {
      const url = createValidEpicTrackerUrl();
      const result = validateTrackerUrl(url);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Invalid Epic URLs', () => {
    it('should reject invalid Epic URLs', () => {
      const url = createInvalidEpicTrackerUrl();
      const result = validateTrackerUrl(url);

      expect(result.isValid).toBe(false);
    });
  });
});

describe('Real-World Use Case Testing', () => {
  describe('Actual Tracker URLs', () => {
    it('should handle real Steam profile URLs', () => {
      // Based on research: actual Steam 64-bit ID format
      const realUrl =
        'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198144145654/overview';
      const result = validateTrackerUrl(realUrl);

      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('steam');
      expect(result.platformId).toBe('76561198144145654');
    });

    it('should handle Epic Games usernames with hyphens', () => {
      // Based on research: spaces become hyphens in URLs
      const epicUrl =
        'https://rocketleague.tracker.network/rocket-league/profile/epic/test-user-name/overview';
      const result = validateTrackerUrl(epicUrl);

      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('epic');
      expect(result.platformId).toBe('test-user-name');
    });
  });

  describe('Integration with Discord Command', () => {
    it('should properly extract platform info for Discord response', () => {
      const validUrl =
        'https://rocketleague.tracker.network/rocket-league/profile/psn/testplayer123/overview';
      const result = validateTrackerUrl(validUrl);

      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('psn');
      expect(result.platformId).toBe('testplayer123');

      // This data should be usable in Discord response formatting
      expect(typeof result.platform).toBe('string');
      expect(typeof result.platformId).toBe('string');
    });
  });
});
