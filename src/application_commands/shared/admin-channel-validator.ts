/**
 * Admin channel restriction validation for Discord application commands
 * Ensures admin commands are only used in designated test channel
 */

import type { DiscordInteraction } from '../../types/discord';
import type { Env } from '../../index';

/**
 * Result of admin channel validation
 */
export interface AdminChannelValidationResult {
  readonly isAllowed: boolean;
  readonly error?: string;
}

/**
 * Validate if admin command can be used in the interaction's channel
 * @param interaction - Discord interaction to validate
 * @param env - Environment configuration containing TEST_CHANNEL_ID
 * @returns Validation result indicating if command is allowed in this channel
 */
export function validateAdminChannelRestriction(
  interaction: Readonly<DiscordInteraction>,
  env: Readonly<Env>
): AdminChannelValidationResult {
  // Check if TEST_CHANNEL_ID is configured
  if (env.TEST_CHANNEL_ID === undefined) {
    return {
      isAllowed: false,
      error: 'Admin command channel not configured.',
    };
  }

  // Check if interaction has channel_id
  if (interaction.channel_id === undefined || interaction.channel_id === '') {
    return {
      isAllowed: false,
      error: 'Unable to determine channel. Please try again.',
    };
  }

  // Check if channel matches configured TEST_CHANNEL_ID
  if (interaction.channel_id !== env.TEST_CHANNEL_ID) {
    return {
      isAllowed: false,
      error: 'This admin command can only be used in the designated test channel.',
    };
  }

  return {
    isAllowed: true,
  };
}
