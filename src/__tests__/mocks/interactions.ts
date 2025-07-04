/**
 * Mock Discord interactions for comprehensive testing
 */

import { faker } from '@faker-js/faker';
import type { DiscordInteraction } from '../../types/discord';
import { UrlFactory } from '../helpers/url-factories';

// Define constants locally to avoid module resolution issues
const InteractionType = {
  Ping: 1,
  ApplicationCommand: 2,
  MessageComponent: 3,
  ApplicationCommandAutocomplete: 4,
  ModalSubmit: 5,
} as const;

const ApplicationCommandType = {
  ChatInput: 1,
  User: 2,
  Message: 3,
} as const;
import { createMockUser, createMockGuildMember } from '../helpers/discord-helpers';

// Helper function to convert API types to our stricter Discord types
function toDiscordUser(
  apiUser: ReturnType<typeof createMockUser>
): NonNullable<DiscordInteraction['user']> {
  const result: Record<string, string> = {
    id: apiUser.id,
  };

  if (apiUser.username) result['username'] = apiUser.username;
  if (apiUser.discriminator) result['discriminator'] = apiUser.discriminator;
  if (apiUser.global_name) result['global_name'] = apiUser.global_name;

  return result as NonNullable<DiscordInteraction['user']>;
}

function toDiscordMember(
  apiMember: ReturnType<typeof createMockGuildMember>
): NonNullable<DiscordInteraction['member']> {
  const result: Record<string, unknown> = {};

  if (apiMember.nick) result['nick'] = apiMember.nick;
  if (apiMember.user) result['user'] = toDiscordUser(apiMember.user);

  return result as NonNullable<DiscordInteraction['member']>;
}

/**
 * Collection of pre-built interaction mocks for common scenarios
 */
export const mockInteractions = {
  /**
   * Basic PING interaction
   */
  ping: (): DiscordInteraction => ({
    id: faker.string.numeric(18),
    application_id: faker.string.numeric(18),
    type: InteractionType.Ping,
    token: faker.string.alphanumeric(84),
    version: 1,
  }),

  /**
   * Valid register command with 2 tracker URLs
   */
  registerValid: (): DiscordInteraction => ({
    id: faker.string.numeric(18),
    application_id: faker.string.numeric(18),
    type: InteractionType.ApplicationCommand,
    data: {
      id: faker.string.numeric(18),
      name: 'register',
      type: ApplicationCommandType.ChatInput,
      options: [
        {
          name: 'tracker1',
          type: 3, // STRING
          value: UrlFactory.rocketLeague.knownProfiles.steam(),
        },
        {
          name: 'tracker2',
          type: 3, // STRING
          value: UrlFactory.rocketLeague.knownProfiles.epic(),
        },
      ],
    },
    guild_id: faker.string.numeric(18),
    channel_id: faker.string.numeric(18),
    member: toDiscordMember(createMockGuildMember()),
    token: faker.string.alphanumeric(84),
    version: 1,
    locale: 'en-US',
    guild_locale: 'en-US',
    app_permissions: '0',
  }),

  /**
   * Register command with invalid tracker URLs
   */
  registerInvalid: (): DiscordInteraction => ({
    id: faker.string.numeric(18),
    application_id: faker.string.numeric(18),
    type: InteractionType.ApplicationCommand,
    data: {
      id: faker.string.numeric(18),
      name: 'register',
      type: ApplicationCommandType.ChatInput,
      options: [
        {
          name: 'tracker1',
          type: 3, // STRING
          value: UrlFactory.testDomains.invalid.general(),
        },
        {
          name: 'tracker2',
          type: 3, // STRING
          value: 'not-even-a-url',
        },
      ],
    },
    guild_id: faker.string.numeric(18),
    channel_id: faker.string.numeric(18),
    member: toDiscordMember(createMockGuildMember()),
    token: faker.string.alphanumeric(84),
    version: 1,
    locale: 'en-US',
    guild_locale: 'en-US',
    app_permissions: '0',
  }),

  /**
   * Register command with maximum tracker URLs (4)
   */
  registerMaxUrls: (): DiscordInteraction => ({
    id: faker.string.numeric(18),
    application_id: faker.string.numeric(18),
    type: InteractionType.ApplicationCommand,
    data: {
      id: faker.string.numeric(18),
      name: 'register',
      type: ApplicationCommandType.ChatInput,
      options: [
        {
          name: 'tracker1',
          type: 3,
          value: UrlFactory.rocketLeague.knownProfiles.steam(),
        },
        {
          name: 'tracker2',
          type: 3,
          value: UrlFactory.rocketLeague.knownProfiles.epic(),
        },
        {
          name: 'tracker3',
          type: 3,
          value: UrlFactory.rocketLeague.knownProfiles.psn(),
        },
        {
          name: 'tracker4',
          type: 3,
          value: UrlFactory.rocketLeague.knownProfiles.xbox(),
        },
      ],
    },
    guild_id: faker.string.numeric(18),
    channel_id: faker.string.numeric(18),
    member: toDiscordMember(createMockGuildMember()),
    token: faker.string.alphanumeric(84),
    version: 1,
    locale: 'en-US',
    guild_locale: 'en-US',
    app_permissions: '0',
  }),

  /**
   * Register command with empty options
   */
  registerEmpty: (): DiscordInteraction => ({
    id: faker.string.numeric(18),
    application_id: faker.string.numeric(18),
    type: InteractionType.ApplicationCommand,
    data: {
      id: faker.string.numeric(18),
      name: 'register',
      type: ApplicationCommandType.ChatInput,
      options: [],
    },
    guild_id: faker.string.numeric(18),
    channel_id: faker.string.numeric(18),
    member: toDiscordMember(createMockGuildMember()),
    token: faker.string.alphanumeric(84),
    version: 1,
    locale: 'en-US',
    guild_locale: 'en-US',
    app_permissions: '0',
  }),

  /**
   * Unknown command interaction
   */
  unknownCommand: (): DiscordInteraction => ({
    id: faker.string.numeric(18),
    application_id: faker.string.numeric(18),
    type: InteractionType.ApplicationCommand,
    data: {
      id: faker.string.numeric(18),
      name: 'unknown_command',
      type: ApplicationCommandType.ChatInput,
      options: [],
    },
    guild_id: faker.string.numeric(18),
    channel_id: faker.string.numeric(18),
    member: toDiscordMember(createMockGuildMember()),
    token: faker.string.alphanumeric(84),
    version: 1,
    locale: 'en-US',
    guild_locale: 'en-US',
    app_permissions: '0',
  }),

  /**
   * Interaction from DM (no guild_id)
   */
  directMessage: (): DiscordInteraction => ({
    id: faker.string.numeric(18),
    application_id: faker.string.numeric(18),
    type: InteractionType.ApplicationCommand,
    data: {
      id: faker.string.numeric(18),
      name: 'register',
      type: ApplicationCommandType.ChatInput,
      options: [],
    },
    channel_id: faker.string.numeric(18),
    user: toDiscordUser(createMockUser()), // DM interactions have user instead of member
    token: faker.string.alphanumeric(84),
    version: 1,
    locale: 'en-US',
    app_permissions: '0',
  }),

  /**
   * Interaction with malicious payload
   */
  maliciousPayload: (): DiscordInteraction => ({
    id: faker.string.numeric(18),
    application_id: faker.string.numeric(18),
    type: InteractionType.ApplicationCommand,
    data: {
      id: faker.string.numeric(18),
      name: 'register',
      type: ApplicationCommandType.ChatInput,
      options: [
        {
          name: 'tracker1',
          type: 3,
          value: '<script>alert("XSS")</script>',
        },
        {
          name: 'tracker2',
          type: 3,
          value: "'; DROP TABLE users; --",
        },
      ],
    },
    guild_id: faker.string.numeric(18),
    channel_id: faker.string.numeric(18),
    member: toDiscordMember(createMockGuildMember()),
    token: faker.string.alphanumeric(84),
    version: 1,
    locale: 'en-US',
    guild_locale: 'en-US',
    app_permissions: '0',
  }),

  /**
   * Interaction with very large payload
   */
  largePayload: (): DiscordInteraction => ({
    id: faker.string.numeric(18),
    application_id: faker.string.numeric(18),
    type: InteractionType.ApplicationCommand,
    data: {
      id: faker.string.numeric(18),
      name: 'register',
      type: ApplicationCommandType.ChatInput,
      options: [
        {
          name: 'tracker1',
          type: 3,
          value: UrlFactory.rocketLeague.edgeCases.veryLongUrl(), // Very long URL
        },
      ],
    },
    guild_id: faker.string.numeric(18),
    channel_id: faker.string.numeric(18),
    member: toDiscordMember(createMockGuildMember()),
    token: faker.string.alphanumeric(84),
    version: 1,
    locale: 'en-US',
    guild_locale: 'en-US',
    app_permissions: '0',
  }),

  /**
   * Interaction with special characters
   */
  specialCharacters: (): DiscordInteraction => ({
    id: faker.string.numeric(18),
    application_id: faker.string.numeric(18),
    type: InteractionType.ApplicationCommand,
    data: {
      id: faker.string.numeric(18),
      name: 'register',
      type: ApplicationCommandType.ChatInput,
      options: [
        {
          name: 'tracker1',
          type: 3,
          value: UrlFactory.rocketLeague.edgeCases.withSpaces(),
        },
        {
          name: 'tracker2',
          type: 3,
          value: UrlFactory.rocketLeague.edgeCases.withUnicode(),
        },
      ],
    },
    guild_id: faker.string.numeric(18),
    channel_id: faker.string.numeric(18),
    member: toDiscordMember(
      createMockGuildMember({
        user: createMockUser({
          username: 'ユーザー名',
          global_name: 'User with émojis 🎮',
        }),
      })
    ),
    token: faker.string.alphanumeric(84),
    version: 1,
    locale: 'ja',
    guild_locale: 'ja',
    app_permissions: '0',
  }),
};

/**
 * Generate a random interaction for stress testing
 */
export function generateRandomInteraction(): DiscordInteraction {
  const interactionTypes = [
    () => mockInteractions.ping(),
    () => mockInteractions.registerValid(),
    () => mockInteractions.registerInvalid(),
    () => mockInteractions.unknownCommand(),
  ];

  const randomGenerator = faker.helpers.arrayElement(interactionTypes);
  return randomGenerator();
}

/**
 * Generate multiple interactions for load testing
 */
export function generateInteractionBatch(count: number = 10): DiscordInteraction[] {
  return Array.from({ length: count }, () => generateRandomInteraction());
}

/**
 * Create interaction with custom data
 */
export function createCustomInteraction(
  overrides: Partial<DiscordInteraction>
): DiscordInteraction {
  const baseInteraction = mockInteractions.registerValid();
  return {
    ...baseInteraction,
    ...overrides,
  };
}

/**
 * Collection of edge case interactions
 */
export const edgeCaseInteractions = {
  // Interaction with minimum required fields
  minimal: (): DiscordInteraction => ({
    id: faker.string.numeric(18),
    application_id: faker.string.numeric(18),
    type: InteractionType.Ping,
    token: faker.string.alphanumeric(84),
    version: 1,
  }),

  // Interaction with all possible fields
  maximal: (): DiscordInteraction => ({
    id: faker.string.numeric(18),
    application_id: faker.string.numeric(18),
    type: InteractionType.ApplicationCommand,
    data: {
      id: faker.string.numeric(18),
      name: 'register',
      type: ApplicationCommandType.ChatInput,
      options: [
        {
          name: 'tracker1',
          type: 3,
          value: UrlFactory.rocketLeague.knownProfiles.steam(),
        },
      ],
    },
    guild_id: faker.string.numeric(18),
    channel_id: faker.string.numeric(18),
    member: toDiscordMember(createMockGuildMember()),
    user: toDiscordUser(createMockUser()),
    token: faker.string.alphanumeric(84),
    version: 1,
    locale: 'en-US',
    guild_locale: 'en-US',
    app_permissions: '2147483647', // All permissions
  }),

  // Interaction with future version
  futureVersion: (): DiscordInteraction => ({
    id: faker.string.numeric(18),
    application_id: faker.string.numeric(18),
    type: InteractionType.Ping,
    token: faker.string.alphanumeric(84),
    version: 999, // Future version
  }),
};
