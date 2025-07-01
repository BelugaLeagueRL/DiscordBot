/**
 * Functional tests for URL validation business logic
 * Tests CURRENT implementation and identifies REAL gaps vs requirements
 */

import { describe, it, expect } from 'vitest';
import { validateTrackerUrl } from '../../application_commands/register/handler';

describe('Current URL Validation Implementation', () => {
  describe('Basic URL Structure Validation', () => {
    it('should accept valid tracker URLs', () => {
      const validUrl =
        'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198123456789/overview';
      const result = validateTrackerUrl(validUrl);

      // Behavioral validation: verify URL parsing extracted correct components
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('steam');
      expect(result.platformId).toBe('76561198123456789');
      expect(result.error).toBeUndefined();

      // Behavioral validation: verify Steam ID format is actually valid Steam ID64
      expect(result.platformId).toBeDefined();
      expect(result.platformId).toMatch(/^7656119\d{10}$/);
      expect(result.platformId?.length).toBe(17);
    });

    it('should reject wrong domain', () => {
      const invalidUrl = 'https://example.com/rocket-league/profile/steam/testuser/overview';
      const result = validateTrackerUrl(invalidUrl);

      // Behavioral validation: verify domain validation behavior
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('rocketleague.tracker.network');
      expect(result.platform).toBeUndefined();
      expect(result.platformId).toBeUndefined();

      // Behavioral validation: verify error message is helpful
      expect(result.error).toMatch(/domain|rocketleague\.tracker\.network/i);
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

      // Enhanced implementation now decodes and validates properly (spaces not allowed in Epic usernames)
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid Epic Games display name format');
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

  describe('Network and Availability Edge Cases', () => {
    it('should handle URLs with valid format but unreachable domains', () => {
      const unreachableUrl =
        'https://nonexistent.tracker.network/rocket-league/profile/steam/76561198123456789/overview';
      const result = validateTrackerUrl(unreachableUrl);

      // URL validation should focus on format, not network reachability
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('rocketleague.tracker.network');
    });

    it('should handle URLs with invalid subdomains', () => {
      const invalidSubdomain =
        'https://fake.rocketleague.tracker.network/rocket-league/profile/steam/76561198123456789/overview';
      const result = validateTrackerUrl(invalidSubdomain);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('rocketleague.tracker.network');
    });

    it('should handle URLs with query parameters', () => {
      const urlWithQuery =
        'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198123456789/overview?tab=overview&season=current';
      const result = validateTrackerUrl(urlWithQuery);

      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('steam');
      expect(result.platformId).toBe('76561198123456789');
    });

    it('should handle URLs with fragments', () => {
      const urlWithFragment =
        'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198123456789/overview#overview';
      const result = validateTrackerUrl(urlWithFragment);

      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('steam');
      expect(result.platformId).toBe('76561198123456789');
    });

    it('should handle URLs with encoded special characters', () => {
      const encodedUrl =
        'https://rocketleague.tracker.network/rocket-league/profile/epic/Test%2DPlayer/overview';
      const result = validateTrackerUrl(encodedUrl);

      // Should decode and validate the actual username
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('epic');
      expect(result.platformId).toBe('Test-Player');
    });

    it('should reject URLs with dangerous encoded characters', () => {
      const maliciousUrl =
        'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198123456789%2F..%2F..%2Fadmin/overview';
      const result = validateTrackerUrl(maliciousUrl);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid Steam ID64 format');
    });
  });

  describe('Input Validation Boundary Cases', () => {
    it('should handle extremely long URLs', () => {
      const baseUrl = 'https://rocketleague.tracker.network/rocket-league/profile/steam/';
      const longId = '7656119812345678' + 'x'.repeat(1000);
      const longUrl = baseUrl + longId + '/overview';

      const result = validateTrackerUrl(longUrl);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Platform ID too long (maximum 100 characters)');
    });

    it('should handle URLs with null bytes', () => {
      const nullByteUrl =
        'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198123456789\x00/overview';
      const result = validateTrackerUrl(nullByteUrl);

      expect(result.isValid).toBe(false);
    });

    it('should handle URLs with Unicode characters', () => {
      const unicodeUrl =
        'https://rocketleague.tracker.network/rocket-league/profile/epic/Tëst_Üser123/overview';
      const result = validateTrackerUrl(unicodeUrl);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid Epic Games display name format');
    });

    it('should handle empty platform ID', () => {
      const emptyIdUrl =
        'https://rocketleague.tracker.network/rocket-league/profile/steam//overview';
      const result = validateTrackerUrl(emptyIdUrl);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('URL must follow the format');
    });

    it('should handle case sensitivity in platform names', () => {
      const mixedCaseUrl =
        'https://rocketleague.tracker.network/rocket-league/profile/Steam/76561198123456789/overview';
      const result = validateTrackerUrl(mixedCaseUrl);

      // Should normalize to lowercase
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('steam');
    });
  });
});
