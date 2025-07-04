/**
 * URL Factories for Test Infrastructure
 * Provides convenient factory methods for generating test URLs
 * Reduces hardcoded URL anti-patterns throughout test files
 */

import { faker } from '@faker-js/faker';
import { TEST_URLS, UrlBuilders, TestScenarios } from '../config/test-urls';

/**
 * Factory for Discord-related test URLs
 */
export const DiscordUrlFactory = {
  /**
   * Generate guild member endpoint URLs
   */
  guildMembers: {
    basic: (guildId: string = faker.string.uuid()) => TEST_URLS.DISCORD.GUILD_MEMBERS(guildId),

    withLimit: (guildId: string = faker.string.uuid(), limit: number = 1000) =>
      TEST_URLS.DISCORD.GUILD_MEMBERS(guildId, limit),

    paginated: (guildId: string = faker.string.uuid(), after: string = faker.string.uuid()) =>
      TEST_URLS.DISCORD.GUILD_MEMBERS_PAGINATED(guildId, after),

    largeGuild: (limit: number = 1000) =>
      TEST_URLS.DISCORD.GUILD_MEMBERS(TestScenarios.DISCORD_LARGE_GUILD, limit),
  },

  /**
   * Generate webhook URLs
   */
  webhooks: {
    basic: (applicationId: string = faker.string.uuid(), token: string = faker.string.uuid()) =>
      TEST_URLS.DISCORD.WEBHOOKS(applicationId, token),

    editMessage: (
      applicationId: string = faker.string.uuid(),
      token: string = faker.string.uuid()
    ) => TEST_URLS.DISCORD.WEBHOOK_EDIT(applicationId, token),
  },

  /**
   * Generate command registration URLs
   */
  commands: {
    development: (appId: string = 'dev_app_id') => UrlBuilders.discord.commands(appId, 'dev'),

    production: (appId: string = 'prod_app_id') => UrlBuilders.discord.commands(appId, 'prod'),

    test: (appId: string = 'test_app_id') => TEST_URLS.DISCORD.COMMANDS(appId),
  },

  /**
   * Generate channel URLs
   */
  channels: {
    messages: (channelId: string = faker.string.numeric(18)) =>
      TEST_URLS.DISCORD.CHANNEL_MESSAGES(channelId),

    specific: (channelId: string = '1388177835331424386') =>
      TEST_URLS.DISCORD.CHANNEL_MESSAGES(channelId),
  },

  /**
   * Common headers for Discord requests
   */
  headers: {
    userAgent: () => TEST_URLS.DISCORD.USER_AGENT,

    interactions: () => ({
      'User-Agent': TEST_URLS.DISCORD.USER_AGENT,
      'Content-Type': 'application/json',
    }),
  },
} as const;

/**
 * Factory for Google API test URLs
 */
export const GoogleUrlFactory = {
  /**
   * OAuth endpoints
   */
  oauth: {
    auth: (params: Record<string, string> = {}) => UrlBuilders.google.oauth(params),

    token: () => TEST_URLS.GOOGLE.OAUTH_TOKEN,

    tokenV2: () => TEST_URLS.GOOGLE.OAUTH_TOKEN_V2,

    withScope: (scope: string = TEST_URLS.GOOGLE.SHEETS_SCOPE) =>
      UrlBuilders.google.oauth({ scope }),
  },

  /**
   * Sheets API endpoints
   */
  sheets: {
    api: () => TEST_URLS.GOOGLE.SHEETS_API,
    scope: () => TEST_URLS.GOOGLE.SHEETS_SCOPE,
  },

  /**
   * Certificate endpoints
   */
  certificates: {
    oauth: () => TEST_URLS.GOOGLE.OAUTH_CERTS,
    robot: (email: string = 'test@test-project.iam.gserviceaccount.com') =>
      TEST_URLS.GOOGLE.ROBOT_CERTS(email),
  },
} as const;

/**
 * Factory for Rocket League Tracker test URLs
 */
export const RocketLeagueUrlFactory = {
  /**
   * Valid profile URLs
   */
  profiles: {
    steam: (steamId: string = TestScenarios.STEAM_ID_EXAMPLES[0]) =>
      UrlBuilders.rocketLeague.profile('STEAM', steamId),

    epic: (epicUser: string = TestScenarios.EPIC_USER_EXAMPLES[0]) =>
      UrlBuilders.rocketLeague.profile('EPIC', epicUser),

    psn: (psnUser: string = TestScenarios.PSN_USER_EXAMPLES[0]) =>
      UrlBuilders.rocketLeague.profile('PSN', psnUser),

    xbox: (xboxUser: string = TestScenarios.XBOX_USER_EXAMPLES[0]) =>
      UrlBuilders.rocketLeague.profile('XBOX', xboxUser),

    switch: (switchUser: string = faker.internet.userName()) =>
      UrlBuilders.rocketLeague.profile('SWITCH', switchUser),
  },

  /**
   * Known test profile URLs (for consistent testing)
   */
  knownProfiles: {
    steam: () => UrlBuilders.rocketLeague.profile('STEAM', TestScenarios.STEAM_ID_EXAMPLES[0]),
    steamAlt: () => UrlBuilders.rocketLeague.profile('STEAM', TestScenarios.STEAM_ID_EXAMPLES[1]),
    epic: () => UrlBuilders.rocketLeague.profile('EPIC', TestScenarios.EPIC_USER_EXAMPLES[0]),
    epicLong: () => UrlBuilders.rocketLeague.profile('EPIC', TestScenarios.EPIC_USER_EXAMPLES[1]),
    psn: () => UrlBuilders.rocketLeague.profile('PSN', TestScenarios.PSN_USER_EXAMPLES[0]),
    xbox: () => UrlBuilders.rocketLeague.profile('XBOX', TestScenarios.XBOX_USER_EXAMPLES[0]),
  },

  /**
   * Invalid/test URLs for error scenarios
   */
  invalid: {
    nonexistentDomain: () => UrlBuilders.rocketLeague.invalidProfile('nonexistent'),
    fakeDomain: () => UrlBuilders.rocketLeague.invalidProfile('fake'),
    wrongPath: () => UrlBuilders.rocketLeague.invalidProfile('wrong-path'),
    invalidDomain: () =>
      `${TEST_URLS.TEST_DOMAINS.INVALID_GENERAL}/profile/steam/testuser/overview`,
    differentSite: () =>
      `${TEST_URLS.TEST_DOMAINS.DIFFERENT_SITE}/rocket-league/profile/steam/123/overview`,
    anotherInvalid: () =>
      `${TEST_URLS.TEST_DOMAINS.ANOTHER_INVALID}/profile/epic/testuser/overview`,
  },

  /**
   * Special case URLs for edge testing
   */
  edgeCases: {
    veryLongUrl: () => `${TEST_URLS.ROCKET_LEAGUE.TRACKER_BASE}/${'x'.repeat(10000)}`,
    withSpaces: () => TEST_URLS.ROCKET_LEAGUE.PROFILE('steam', 'Player%20With%20Spaces'),
    withUnicode: () => TEST_URLS.ROCKET_LEAGUE.PROFILE('epic', 'プレイヤー名'),
    withSpecialChars: () => TEST_URLS.ROCKET_LEAGUE.PROFILE('epic', 'Test%2DPlayer'),
    withQueryParams: () =>
      `${UrlBuilders.rocketLeague.profile('STEAM', TestScenarios.STEAM_ID_EXAMPLES[0])}?tab=overview&season=current`,
    withFragment: () =>
      `${UrlBuilders.rocketLeague.profile('STEAM', TestScenarios.STEAM_ID_EXAMPLES[0])}#overview`,
    withPathTraversal: () =>
      TEST_URLS.ROCKET_LEAGUE.PROFILE('steam', '76561198123456789%2F..%2F..%2Fadmin'),
    withNullByte: () => TEST_URLS.ROCKET_LEAGUE.PROFILE('steam', '76561198123456789\x00'),
    withEmptyPlayerId: () => TEST_URLS.ROCKET_LEAGUE.PROFILE('steam', ''),
    withCaseMismatch: () =>
      TEST_URLS.ROCKET_LEAGUE.PROFILE('Steam', TestScenarios.STEAM_ID_EXAMPLES[0]),
  },
} as const;

/**
 * Factory for test domain URLs (invalid cases)
 */
export const TestDomainFactory = {
  invalid: {
    general: () => TEST_URLS.TEST_DOMAINS.INVALID_GENERAL,
    tracker: () => TEST_URLS.TEST_DOMAINS.INVALID_TRACKER,
    fakeTracker: () => TEST_URLS.TEST_DOMAINS.FAKE_TRACKER,
    differentSite: () => TEST_URLS.TEST_DOMAINS.DIFFERENT_SITE,
    anotherInvalid: () => TEST_URLS.TEST_DOMAINS.ANOTHER_INVALID,
  },
} as const;

/**
 * Factory for Cloudflare Workers URLs
 */
export const CloudflareUrlFactory = {
  docs: {
    illegalInvocation: () => TEST_URLS.CLOUDFLARE.ILLEGAL_INVOCATION_DOCS,
  },
} as const;

/**
 * Comprehensive URL factory combining all domains
 */
export const UrlFactory = {
  discord: DiscordUrlFactory,
  google: GoogleUrlFactory,
  rocketLeague: RocketLeagueUrlFactory,
  testDomains: TestDomainFactory,
  cloudflare: CloudflareUrlFactory,
} as const;

/**
 * Helper for migrating existing hardcoded URLs
 */
export const MigrationHelpers = {
  /**
   * Replace common hardcoded patterns
   */
  replaceDiscordGuildMembers: (guildId: string, limit?: number) => {
    console.warn(
      'MIGRATION: Replace hardcoded Discord guild members URL with UrlFactory.discord.guildMembers.basic()'
    );
    return TEST_URLS.DISCORD.GUILD_MEMBERS(guildId, limit);
  },

  replaceRocketLeagueProfile: (platform: string, playerId: string) => {
    console.warn(
      'MIGRATION: Replace hardcoded Rocket League profile URL with UrlFactory.rocketLeague.profiles.*()'
    );
    return TEST_URLS.ROCKET_LEAGUE.PROFILE(platform, playerId);
  },

  replaceGoogleOAuth: () => {
    console.warn('MIGRATION: Replace hardcoded Google OAuth URL with UrlFactory.google.oauth.*()');
    return TEST_URLS.GOOGLE.OAUTH_TOKEN;
  },
} as const;
