/**
 * Mock Discord interactions for comprehensive testing
 */

import { faker } from '@faker-js/faker';
import type { DiscordInteraction } from '../../types/discord';

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
          value:
            'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198123456789/overview',
        },
        {
          name: 'tracker2',
          type: 3, // STRING
          value:
            'https://rocketleague.tracker.network/rocket-league/profile/epic/TestPlayer123/overview',
        },
      ],
    },
    guild_id: faker.string.numeric(18),
    channel_id: faker.string.numeric(18),
    member: createMockGuildMember(),
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
          value: 'https://example.com/not-a-tracker-url',
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
    member: createMockGuildMember(),
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
          value:
            'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198123456789/overview',
        },
        {
          name: 'tracker2',
          type: 3,
          value:
            'https://rocketleague.tracker.network/rocket-league/profile/epic/TestPlayer123/overview',
        },
        {
          name: 'tracker3',
          type: 3,
          value:
            'https://rocketleague.tracker.network/rocket-league/profile/psn/PSNPlayer456/overview',
        },
        {
          name: 'tracker4',
          type: 3,
          value:
            'https://rocketleague.tracker.network/rocket-league/profile/xbox/XboxGamer789/overview',
        },
      ],
    },
    guild_id: faker.string.numeric(18),
    channel_id: faker.string.numeric(18),
    member: createMockGuildMember(),
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
    member: createMockGuildMember(),
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
    member: createMockGuildMember(),
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
    user: createMockUser(), // DM interactions have user instead of member
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
    member: createMockGuildMember(),
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
          value: `https://rocketleague.tracker.network/${'x'.repeat(10000)}`, // Very long URL
        },
      ],
    },
    guild_id: faker.string.numeric(18),
    channel_id: faker.string.numeric(18),
    member: createMockGuildMember(),
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
          value:
            'https://rocketleague.tracker.network/rocket-league/profile/steam/Player%20With%20Spaces/overview',
        },
        {
          name: 'tracker2',
          type: 3,
          value:
            'https://rocketleague.tracker.network/rocket-league/profile/epic/プレイヤー名/overview',
        },
      ],
    },
    guild_id: faker.string.numeric(18),
    channel_id: faker.string.numeric(18),
    member: createMockGuildMember({
      user: createMockUser({
        username: 'ユーザー名',
        global_name: 'User with émojis 🎮',
      }),
    }),
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
          value:
            'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198123456789/overview',
        },
      ],
    },
    guild_id: faker.string.numeric(18),
    channel_id: faker.string.numeric(18),
    member: createMockGuildMember(),
    user: createMockUser(),
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
