/**
 * Functional tests for URL validation business logic
 * Tests CURRENT implementation and identifies REAL gaps vs requirements
 */

import { describe, it, expect } from 'vitest';
import { validateTrackerUrl } from '../../application_commands/register/handler';
import { UrlFactory } from '../helpers/url-factories';
import { TEST_URLS } from '../config/test-urls';

describe('Current URL Validation Implementation', () => {
  describe('Basic URL Structure Validation', () => {
    it('should accept valid tracker URLs', () => {
      const validUrl = UrlFactory.rocketLeague.knownProfiles.steam();
      const result = validateTrackerUrl(validUrl);

      expect(result.isValid).toBe(true);
    });

    it('should extract correct platform from valid URL', () => {
      const validUrl = UrlFactory.rocketLeague.knownProfiles.steam();
      const result = validateTrackerUrl(validUrl);

      expect(result.platform).toBe('steam');
    });

    it('should extract correct platform ID from valid URL', () => {
      const validUrl = UrlFactory.rocketLeague.knownProfiles.steam();
      const result = validateTrackerUrl(validUrl);

      expect(result.platformId).toBe('76561198123456789');
    });

    it('should not return error for valid URL', () => {
      const validUrl = UrlFactory.rocketLeague.knownProfiles.steam();
      const result = validateTrackerUrl(validUrl);

      expect(result.error).toBeUndefined();
    });

    it('should validate Steam ID format follows Steam ID64 pattern', () => {
      const validUrl = UrlFactory.rocketLeague.knownProfiles.steam();
      const result = validateTrackerUrl(validUrl);

      expect(result.platformId).toMatch(/^7656119\d{10}$/);
    });

    it('should validate Steam ID has correct length', () => {
      const validUrl = UrlFactory.rocketLeague.knownProfiles.steam();
      const result = validateTrackerUrl(validUrl);

      expect(result.platformId?.length).toBe(17);
    });

    it('should reject wrong domain', () => {
      const invalidUrl =
        UrlFactory.testDomains.invalid.general() + '/rocket-league/profile/steam/testuser/overview';
      const result = validateTrackerUrl(invalidUrl);

      expect(result.isValid).toBe(false);
    });

    it('should return domain error for wrong domain', () => {
      const invalidUrl =
        UrlFactory.testDomains.invalid.general() + '/rocket-league/profile/steam/testuser/overview';
      const result = validateTrackerUrl(invalidUrl);

      expect(result.error).toContain('rocketleague.tracker.network');
    });

    it('should not extract platform from wrong domain', () => {
      const invalidUrl =
        UrlFactory.testDomains.invalid.general() + '/rocket-league/profile/steam/testuser/overview';
      const result = validateTrackerUrl(invalidUrl);

      expect(result.platform).toBeUndefined();
    });

    it('should not extract platform ID from wrong domain', () => {
      const invalidUrl =
        UrlFactory.testDomains.invalid.general() + '/rocket-league/profile/steam/testuser/overview';
      const result = validateTrackerUrl(invalidUrl);

      expect(result.platformId).toBeUndefined();
    });

    it('should provide helpful error message for wrong domain', () => {
      const invalidUrl =
        UrlFactory.testDomains.invalid.general() + '/rocket-league/profile/steam/testuser/overview';
      const result = validateTrackerUrl(invalidUrl);

      expect(result.error).toMatch(/domain|rocketleague\.tracker\.network/i);
    });

    it('should reject malformed URLs', () => {
      const invalidUrl = 'not-a-url';
      const result = validateTrackerUrl(invalidUrl);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid URL format');
    });

    it('should validate exact path structure', () => {
      const invalidPath = UrlFactory.rocketLeague.invalid.wrongPath();
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

      const results = Object.entries(validPlatformIds).map(([platform, platformId]) => {
        const url =
          UrlFactory.rocketLeague.profiles[
            platform as keyof typeof UrlFactory.rocketLeague.profiles
          ]?.(platformId as string) ?? TEST_URLS.ROCKET_LEAGUE.PROFILE(platform, platformId);
        return { platform, platformId, result: validateTrackerUrl(url) };
      });

      const allValid = results.every(({ result }) => result.isValid);
      expect(allValid).toBe(true);
    });

    it('should process correct number of supported platforms', () => {
      const validPlatformIds = {
        steam: '76561198123456789',
        epic: 'TestUser123',
        psn: 'TestUser123',
        xbl: 'TestUser123',
        switch: 'TestUser123',
      };

      const results = Object.entries(validPlatformIds).map(([platform, platformId]) => {
        const url =
          UrlFactory.rocketLeague.profiles[
            platform as keyof typeof UrlFactory.rocketLeague.profiles
          ]?.(platformId as string) ?? TEST_URLS.ROCKET_LEAGUE.PROFILE(platform, platformId);
        return { platform, platformId, result: validateTrackerUrl(url) };
      });

      expect(results).toHaveLength(5);
    });

    it('should correctly parse Steam platform from URL', () => {
      const url = UrlFactory.rocketLeague.knownProfiles.steam();
      const result = validateTrackerUrl(url);

      expect(result.platform).toBe('steam');
      expect(result.platformId).toBe('76561198123456789');
      expect(result.error).toBeUndefined();
    });

    it('should correctly parse Epic platform from URL', () => {
      const url = UrlFactory.rocketLeague.profiles.epic('TestUser123');
      const result = validateTrackerUrl(url);

      expect(result.platform).toBe('epic');
      expect(result.platformId).toBe('TestUser123');
      expect(result.error).toBeUndefined();
    });

    it('should correctly parse PSN platform from URL', () => {
      const url = UrlFactory.rocketLeague.profiles.psn('TestUser123');
      const result = validateTrackerUrl(url);

      expect(result.platform).toBe('psn');
      expect(result.platformId).toBe('TestUser123');
      expect(result.error).toBeUndefined();
    });

    it('should correctly parse Xbox platform from URL', () => {
      const url = UrlFactory.rocketLeague.profiles.xbox('TestUser123');
      const result = validateTrackerUrl(url);

      expect(result.platform).toBe('xbl');
      expect(result.platformId).toBe('TestUser123');
      expect(result.error).toBeUndefined();
    });

    it('should correctly parse Nintendo Switch platform from URL', () => {
      const url = UrlFactory.rocketLeague.profiles.switch('TestUser123');
      const result = validateTrackerUrl(url);

      expect(result.platform).toBe('switch');
      expect(result.platformId).toBe('TestUser123');
      expect(result.error).toBeUndefined();
    });

    it('should reject unsupported platforms', () => {
      const invalidUrl = TEST_URLS.ROCKET_LEAGUE.PROFILE('mobile', 'testuser');
      const result = validateTrackerUrl(invalidUrl);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unsupported platform');
    });

    it('should handle platform case sensitivity', () => {
      const upperUrl = UrlFactory.rocketLeague.edgeCases.withCaseMismatch();
      const result = validateTrackerUrl(upperUrl);

      expect(result.isValid).toBe(true);
    });

    it('should normalize platform to lowercase from uppercase', () => {
      const upperUrl = UrlFactory.rocketLeague.edgeCases.withCaseMismatch();
      const result = validateTrackerUrl(upperUrl);

      expect(result.platform).toBe('steam');
    });
  });

  describe('Platform ID Basic Validation', () => {
    it('should reject platform IDs that are too short', () => {
      const shortUrl = UrlFactory.rocketLeague.profiles.steam('ab');
      const result = validateTrackerUrl(shortUrl);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid Steam ID64 format');
    });

    it('should accept minimum length platform IDs for appropriate platforms', () => {
      const minUrl = UrlFactory.rocketLeague.profiles.epic('abc');
      const result = validateTrackerUrl(minUrl);

      expect(result.isValid).toBe(true);
      expect(result.platformId).toBe('abc');
    });
  });
});

describe('Security and Edge Case Analysis', () => {
  describe('Current Security Gaps', () => {
    it('SECURITY: path validation rejects URLs with HTML/script tags', () => {
      const xssUrl = UrlFactory.rocketLeague.profiles.steam('<script>alert(1)</script>');
      const result = validateTrackerUrl(xssUrl);

      expect(result.isValid).toBe(false);
    });

    it('SECURITY: provides format error for URLs with HTML tags', () => {
      const xssUrl = UrlFactory.rocketLeague.profiles.steam('<script>alert(1)</script>');
      const result = validateTrackerUrl(xssUrl);

      expect(result.error).toContain('URL must follow the format');
    });

    it('SECURITY FIXED: rejects URLs with SQL injection attempts', () => {
      const sqlUrl = UrlFactory.rocketLeague.profiles.steam("test'; DROP TABLE users; --");
      const result = validateTrackerUrl(sqlUrl);

      expect(result.isValid).toBe(false);
    });

    it('SECURITY FIXED: provides Steam ID format error for SQL injection', () => {
      const sqlUrl = UrlFactory.rocketLeague.profiles.steam("test'; DROP TABLE users; --");
      const result = validateTrackerUrl(sqlUrl);

      expect(result.error).toContain('Invalid Steam ID64 format');
    });

    it('SECURITY FIXED: rejects extremely long platform IDs (DoS protection)', () => {
      const longId = 'a'.repeat(10000);
      const longUrl = UrlFactory.rocketLeague.profiles.steam(longId);
      const result = validateTrackerUrl(longUrl);

      expect(result.isValid).toBe(false);
    });

    it('SECURITY FIXED: provides length limit error for extremely long platform IDs', () => {
      const longId = 'a'.repeat(10000);
      const longUrl = UrlFactory.rocketLeague.profiles.steam(longId);
      const result = validateTrackerUrl(longUrl);

      expect(result.error).toBe('Platform ID too long (maximum 100 characters)');
    });
  });

  describe('URL Encoding Issues', () => {
    it('FUNCTIONAL FIXED: now properly handles and validates URL encoded characters', () => {
      const encodedUrl = UrlFactory.rocketLeague.profiles.epic('Test%20Player');
      const result = validateTrackerUrl(encodedUrl);

      expect(result.isValid).toBe(false);
    });

    it('FUNCTIONAL FIXED: provides Epic format error for URL encoded spaces', () => {
      const encodedUrl = UrlFactory.rocketLeague.profiles.epic('Test%20Player');
      const result = validateTrackerUrl(encodedUrl);

      expect(result.error).toContain('Invalid Epic Games display name format');
    });

    it('FUNCTIONAL FIXED: now validates platform-specific format constraints', () => {
      const spaceUrl = UrlFactory.rocketLeague.profiles.psn('Test Player');
      const result = validateTrackerUrl(spaceUrl);

      expect(result.isValid).toBe(false);
    });

    it('FUNCTIONAL FIXED: provides PSN format error for spaces in PSN IDs', () => {
      const spaceUrl = UrlFactory.rocketLeague.profiles.psn('Test Player');
      const result = validateTrackerUrl(spaceUrl);

      expect(result.error).toContain('Invalid PSN ID format');
    });
  });
});

describe('Platform-Specific Validation Gaps', () => {
  describe('Steam ID Format Issues', () => {
    it('FUNCTIONAL FIXED: now rejects invalid Steam ID formats', () => {
      const invalidSteamUrl = UrlFactory.rocketLeague.profiles.steam('invalid_steam_id');
      const result = validateTrackerUrl(invalidSteamUrl);

      expect(result.isValid).toBe(false);
    });

    it('FUNCTIONAL FIXED: provides Steam ID format error for invalid Steam IDs', () => {
      const invalidSteamUrl = UrlFactory.rocketLeague.profiles.steam('invalid_steam_id');
      const result = validateTrackerUrl(invalidSteamUrl);

      expect(result.error).toContain('Invalid Steam ID64 format');
    });

    it('FUNCTIONAL GAP: should validate 64-bit Steam ID format', () => {
      const realSteamUrl = UrlFactory.rocketLeague.profiles.steam('76561198144145654');
      const result = validateTrackerUrl(realSteamUrl);

      expect(result.isValid).toBe(true);
    });

    it('FUNCTIONAL GAP: should extract correct Steam ID from valid Steam URL', () => {
      const realSteamUrl = UrlFactory.rocketLeague.profiles.steam('76561198144145654');
      const result = validateTrackerUrl(realSteamUrl);

      expect(result.platformId).toBe('76561198144145654');
    });
  });

  describe('PSN ID Format Issues', () => {
    it('FUNCTIONAL FIXED: now rejects PSN IDs starting with numbers', () => {
      const invalidPsnUrl = UrlFactory.rocketLeague.profiles.psn('123invalid');
      const result = validateTrackerUrl(invalidPsnUrl);

      expect(result.isValid).toBe(false);
    });

    it('FUNCTIONAL FIXED: provides PSN format error for IDs starting with numbers', () => {
      const invalidPsnUrl = UrlFactory.rocketLeague.profiles.psn('123invalid');
      const result = validateTrackerUrl(invalidPsnUrl);

      expect(result.error).toContain('Invalid PSN ID format');
    });

    it('FUNCTIONAL FIXED: now rejects PSN IDs with invalid characters', () => {
      const invalidPsnUrl = UrlFactory.rocketLeague.profiles.psn('test@user');
      const result = validateTrackerUrl(invalidPsnUrl);

      expect(result.isValid).toBe(false);
    });

    it('FUNCTIONAL FIXED: provides PSN format error for invalid characters', () => {
      const invalidPsnUrl = UrlFactory.rocketLeague.profiles.psn('test@user');
      const result = validateTrackerUrl(invalidPsnUrl);

      expect(result.error).toContain('Invalid PSN ID format');
    });
  });

  describe('Xbox Gamertag Issues', () => {
    it('FUNCTIONAL FIXED: now rejects Xbox gamertags that are too long', () => {
      const longXboxUrl = UrlFactory.rocketLeague.profiles.xbox('VeryLongGamertagName');
      const result = validateTrackerUrl(longXboxUrl);

      expect(result.isValid).toBe(false);
    });

    it('FUNCTIONAL FIXED: provides Xbox format error for long gamertags', () => {
      const longXboxUrl = UrlFactory.rocketLeague.profiles.xbox('VeryLongGamertagName');
      const result = validateTrackerUrl(longXboxUrl);

      expect(result.error).toContain('Invalid Xbox gamertag format');
    });
  });
});

describe('Real-World Use Case Testing', () => {
  describe('Actual Tracker URLs', () => {
    it('should handle real Steam profile URLs', () => {
      // Based on research: actual Steam 64-bit ID format
      const realUrl = UrlFactory.rocketLeague.profiles.steam('76561198144145654');
      const result = validateTrackerUrl(realUrl);

      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('steam');
      expect(result.platformId).toBe('76561198144145654');
    });

    it('should handle Epic Games usernames with hyphens', () => {
      // Based on research: spaces become hyphens in URLs
      const epicUrl = UrlFactory.rocketLeague.profiles.epic('test-user-name');
      const result = validateTrackerUrl(epicUrl);

      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('epic');
      expect(result.platformId).toBe('test-user-name');
    });
  });

  describe('Integration with Discord Command', () => {
    it('should properly extract platform info for Discord response', () => {
      const validUrl = UrlFactory.rocketLeague.profiles.psn('testplayer123');
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
      const unreachableUrl = UrlFactory.rocketLeague.invalid.nonexistentDomain();
      const result = validateTrackerUrl(unreachableUrl);

      // URL validation should focus on format, not network reachability
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('rocketleague.tracker.network');
    });

    it('should handle URLs with invalid subdomains', () => {
      const invalidSubdomain = UrlFactory.rocketLeague.invalid.fakeDomain();
      const result = validateTrackerUrl(invalidSubdomain);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('rocketleague.tracker.network');
    });

    it('should handle URLs with query parameters', () => {
      const urlWithQuery = UrlFactory.rocketLeague.edgeCases.withQueryParams();
      const result = validateTrackerUrl(urlWithQuery);

      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('steam');
      expect(result.platformId).toBe('76561198123456789');
    });

    it('should handle URLs with fragments', () => {
      const urlWithFragment = UrlFactory.rocketLeague.edgeCases.withFragment();
      const result = validateTrackerUrl(urlWithFragment);

      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('steam');
      expect(result.platformId).toBe('76561198123456789');
    });

    it('should handle URLs with encoded special characters', () => {
      const encodedUrl = UrlFactory.rocketLeague.edgeCases.withSpecialChars();
      const result = validateTrackerUrl(encodedUrl);

      // Should decode and validate the actual username
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('epic');
      expect(result.platformId).toBe('Test-Player');
    });

    it('should reject URLs with dangerous encoded characters', () => {
      const maliciousUrl = UrlFactory.rocketLeague.edgeCases.withPathTraversal();
      const result = validateTrackerUrl(maliciousUrl);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid Steam ID64 format');
    });
  });

  describe('Input Validation Boundary Cases', () => {
    it('should handle extremely long URLs', () => {
      const longId = '7656119812345678' + 'x'.repeat(1000);
      const longUrl = UrlFactory.rocketLeague.profiles.steam(longId);

      const result = validateTrackerUrl(longUrl);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Platform ID too long (maximum 100 characters)');
    });

    it('should handle URLs with null bytes', () => {
      const nullByteUrl = UrlFactory.rocketLeague.edgeCases.withNullByte();
      const result = validateTrackerUrl(nullByteUrl);

      expect(result.isValid).toBe(false);
    });

    it('should handle URLs with Unicode characters', () => {
      const unicodeUrl = UrlFactory.rocketLeague.edgeCases.withUnicode();
      const result = validateTrackerUrl(unicodeUrl);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid Epic Games display name format');
    });

    it('should handle empty platform ID', () => {
      const emptyIdUrl = UrlFactory.rocketLeague.edgeCases.withEmptyPlayerId();
      const result = validateTrackerUrl(emptyIdUrl);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('URL must follow the format');
    });

    it('should handle case sensitivity in platform names', () => {
      const mixedCaseUrl = UrlFactory.rocketLeague.edgeCases.withCaseMismatch();
      const result = validateTrackerUrl(mixedCaseUrl);

      // Should normalize to lowercase
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('steam');
    });
  });
});
