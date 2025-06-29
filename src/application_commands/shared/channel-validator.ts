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
 */
export function validateChannelRestriction(
  interaction: Readonly<DiscordInteraction>,
  env: Readonly<Env>
): ChannelValidationResult {
  // Check if channel restriction is configured
  if (env.REGISTER_COMMAND_REQUEST_CHANNEL_ID === undefined) {
    return {
      isAllowed: false,
      error: 'Channel restriction not configured.',
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
  if (interaction.channel_id !== env.REGISTER_COMMAND_REQUEST_CHANNEL_ID) {
    return {
      isAllowed: false,
      error: 'This command can only be used in the designated register channel.',
    };
  }

  return {
    isAllowed: true,
  };
}
