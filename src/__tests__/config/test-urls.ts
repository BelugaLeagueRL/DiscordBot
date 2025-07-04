/**
 * Centralized Test URL Configuration
 * Replaces hardcoded production URLs throughout test files
 * Based on 2025 best practices for test infrastructure
 */

export const TEST_URLS = {
  /**
   * Discord API endpoints
   */
  DISCORD: {
    API_BASE: 'https://discord.com/api/v10',
    INTERACTIONS: 'https://discord.com/api/v10/interactions',
    GUILDS: (guildId: string) => `https://discord.com/api/v10/guilds/${guildId}`,
    GUILD_MEMBERS: (guildId: string, limit = 1000) =>
      `https://discord.com/api/v10/guilds/${guildId}/members?limit=${limit}`,
    GUILD_MEMBERS_PAGINATED: (guildId: string, after: string, limit = 1000) =>
      `https://discord.com/api/v10/guilds/${guildId}/members?limit=${limit}&after=${after}`,
    WEBHOOKS: (applicationId: string, interactionToken: string) =>
      `https://discord.com/api/v10/webhooks/${applicationId}/${interactionToken}`,
    WEBHOOK_EDIT: (applicationId: string, interactionToken: string) =>
      `https://discord.com/api/v10/webhooks/${applicationId}/${interactionToken}/messages/@original`,
    COMMANDS: (applicationId: string) =>
      `https://discord.com/api/v10/applications/${applicationId}/commands`,
    CHANNELS: (channelId: string) => `https://discord.com/api/v10/channels/${channelId}`,
    CHANNEL_MESSAGES: (channelId: string) =>
      `https://discord.com/api/v10/channels/${channelId}/messages`,
    USER_AGENT: 'Discord-Interactions/1.0 (+https://discord.com)',
  },

  /**
   * Google API endpoints
   */
  GOOGLE: {
    OAUTH_BASE: 'https://accounts.google.com/o/oauth2',
    OAUTH_AUTH: 'https://accounts.google.com/o/oauth2/auth',
    OAUTH_TOKEN: 'https://accounts.google.com/o/oauth2/token',
    OAUTH_TOKEN_V2: 'https://oauth2.googleapis.com/token',
    SHEETS_SCOPE: 'https://www.googleapis.com/auth/spreadsheets',
    SHEETS_API: 'https://sheets.googleapis.com/v4/spreadsheets',
    OAUTH_CERTS: 'https://www.googleapis.com/oauth2/v1/certs',
    ROBOT_CERTS: (email: string) =>
      `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(email)}`,
  },

  /**
   * Rocket League Tracker Network endpoints
   */
  ROCKET_LEAGUE: {
    TRACKER_BASE: 'https://rocketleague.tracker.network',
    TRACKER_API_BASE: 'https://rocketleague.tracker.network/rocket-league',
    PROFILE: (platform: string, playerId: string) =>
      `https://rocketleague.tracker.network/rocket-league/profile/${platform}/${playerId}/overview`,
    PLATFORMS: {
      STEAM: 'steam',
      EPIC: 'epic',
      PSN: 'psn',
      XBOX: 'xbl',
      SWITCH: 'switch',
    },
  },

  /**
   * Test/Mock domains for invalid cases
   */
  TEST_DOMAINS: {
    INVALID_TRACKER: 'https://nonexistent.tracker.network',
    FAKE_TRACKER: 'https://fake.rocketleague.tracker.network',
    INVALID_GENERAL: 'https://invalid-domain.com',
    DIFFERENT_SITE: 'https://different-site.com',
    ANOTHER_INVALID: 'https://another-invalid.com',
  },

  /**
   * Cloudflare Workers error documentation
   */
  CLOUDFLARE: {
    ILLEGAL_INVOCATION_DOCS:
      'https://developers.cloudflare.com/workers/observability/errors/#illegal-invocation-errors',
  },
} as const;

/**
 * Type-safe URL builder functions
 */
export const UrlBuilders = {
  discord: {
    guildMembers: (guildId: string, options: { limit?: number; after?: string } = {}) => {
      if (options.after) {
        return TEST_URLS.DISCORD.GUILD_MEMBERS_PAGINATED(guildId, options.after, options.limit);
      }
      return TEST_URLS.DISCORD.GUILD_MEMBERS(guildId, options.limit);
    },

    commands: (applicationId: string, environment: 'dev' | 'prod' = 'dev') => {
      const appId = environment === 'prod' ? `prod_${applicationId}` : `dev_${applicationId}`;
      return TEST_URLS.DISCORD.COMMANDS(appId);
    },
  },

  rocketLeague: {
    profile: (platform: keyof typeof TEST_URLS.ROCKET_LEAGUE.PLATFORMS, playerId: string) => {
      const platformKey = TEST_URLS.ROCKET_LEAGUE.PLATFORMS[platform];
      return TEST_URLS.ROCKET_LEAGUE.PROFILE(platformKey, playerId);
    },

    invalidProfile: (type: 'nonexistent' | 'fake' | 'wrong-path') => {
      switch (type) {
        case 'nonexistent':
          return `${TEST_URLS.TEST_DOMAINS.INVALID_TRACKER}/rocket-league/profile/steam/123/overview`;
        case 'fake':
          return `${TEST_URLS.TEST_DOMAINS.FAKE_TRACKER}/rocket-league/profile/steam/123/overview`;
        case 'wrong-path':
          return `${TEST_URLS.ROCKET_LEAGUE.TRACKER_BASE}/wrong/path/steam/testuser/overview`;
        default:
          return TEST_URLS.TEST_DOMAINS.INVALID_GENERAL;
      }
    },
  },

  google: {
    oauth: (params: Record<string, string> = {}) => {
      const url = new URL(TEST_URLS.GOOGLE.OAUTH_AUTH);
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
      return url.toString();
    },
  },
} as const;

/**
 * Common test scenarios
 */
export const TestScenarios = {
  DISCORD_LARGE_GUILD: 'large-guild-123456789012345678',
  STEAM_ID_EXAMPLES: ['76561198123456789', '76561198144145654'],
  EPIC_USER_EXAMPLES: ['TestPlayer123', 'VeryLongEpicUsernameForComplexValidation'],
  PSN_USER_EXAMPLES: ['PSNPlayer456', 'ComplexPSNUsername123'],
  XBOX_USER_EXAMPLES: ['XboxGamer789', 'ComplexXboxGamertag'],
} as const;
