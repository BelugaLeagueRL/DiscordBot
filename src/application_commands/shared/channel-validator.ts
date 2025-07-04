/**
 * Channel restriction validation for Discord application commands
 * Ensures commands are only used in designated channels
 */

import type { DiscordInteraction } from '../../types/discord';
import type { Env } from '../../index';

export interface ChannelValidationResult {
  readonly isAllowed: boolean;
  readonly error?: string;
}

/**
 * Validate if command can be used in the interaction's channel
 * Environment-aware: uses TEST_CHANNEL_ID in development, REGISTER_COMMAND_REQUEST_CHANNEL_ID in production
 */
export function validateChannelRestriction(
  interaction: Readonly<DiscordInteraction>,
  env: Readonly<Env>
): ChannelValidationResult {
  // Determine the expected channel ID based on environment
  const isDevelopment = env.ENVIRONMENT === 'development';
  const expectedChannelId = isDevelopment
    ? env.TEST_CHANNEL_ID
    : env.REGISTER_COMMAND_REQUEST_CHANNEL_ID;

  // Check if channel restriction is configured
  if (expectedChannelId === undefined) {
    const missingVariable = isDevelopment
      ? 'TEST_CHANNEL_ID'
      : 'REGISTER_COMMAND_REQUEST_CHANNEL_ID';
    return {
      isAllowed: false,
      error: `Channel restriction not configured. Missing ${missingVariable} environment variable.`,
    };
  }

  // Check if interaction has channel_id
  if (interaction.channel_id === undefined) {
    return {
      isAllowed: false,
      error: 'Unable to determine channel. Please try again.',
    };
  }

  // Check if channel matches configured restriction
  if (interaction.channel_id !== expectedChannelId) {
    const environmentText = isDevelopment ? 'test' : 'designated register';
    return {
      isAllowed: false,
      error: `This command can only be used in the ${environmentText} channel.`,
    };
  }

  return {
    isAllowed: true,
  };
}
