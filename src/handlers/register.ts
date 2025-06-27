/**
 * Handler for the /register command
 * Collects and validates Rocket League tracker URLs
 */

import { createEphemeralResponse, createErrorResponse } from '../utils/discord';
import type { Env } from '../index';
import type { DiscordInteraction } from '../types/discord';

interface TrackerValidationResult {
  isValid: boolean;
  platform?: string;
  platformId?: string;
  error?: string;
}

/**
 * Validate a Rocket League tracker URL
 * Must be of the form: https://rocketleague.tracker.network/rocket-league/profile/<platform>/<platform_id>/overview
 */
function validateTrackerUrl(url: string): TrackerValidationResult {
  try {
    const urlObj = new URL(url);

    // Check domain
    if (urlObj.hostname !== 'rocketleague.tracker.network') {
      return {
        isValid: false,
        error: 'URL must be from rocketleague.tracker.network',
      };
    }

    // Check path pattern
    const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);

    // Expected: ['rocket-league', 'profile', platform, platform_id, 'overview']
    if (
      pathParts.length !== 5 ||
      pathParts[0] !== 'rocket-league' ||
      pathParts[1] !== 'profile' ||
      pathParts[4] !== 'overview'
    ) {
      return {
        isValid: false,
        error:
          'URL must follow the format: https://rocketleague.tracker.network/rocket-league/profile/<platform>/<platform_id>/overview',
      };
    }

    const platform = pathParts[2];
    const platformId = pathParts[3];

    // Validate platform exists
    if (!platform || !platformId) {
      return {
        isValid: false,
        error: 'Missing platform or platform ID in URL',
      };
    }

    // Validate supported platforms
    const supportedPlatforms = ['steam', 'epic', 'psn', 'xbl', 'switch'];
    if (!supportedPlatforms.includes(platform.toLowerCase())) {
      return {
        isValid: false,
        error: `Unsupported platform: ${platform}. Supported platforms: ${supportedPlatforms.join(', ')}`,
      };
    }

    // Basic platform ID validation
    if (platformId.length < 3) {
      return {
        isValid: false,
        error: 'Invalid platform ID',
      };
    }

    return {
      isValid: true,
      platform: platform.toLowerCase(),
      platformId,
    };
  } catch {
    return {
      isValid: false,
      error: 'Invalid URL format',
    };
  }
}

/**
 * Handle the /register command
 */
export async function handleRegisterCommand(
  interaction: DiscordInteraction,
  _env: Env
): Promise<Response> {
  try {
    const userId = interaction.member?.user?.id || interaction.user?.id;

    if (!userId) {
      return createErrorResponse('Could not identify user. Please try again.');
    }

    const options = interaction.data?.options || [];
    const trackerUrls: string[] = [];

    // Extract tracker URLs from command options
    for (const option of options) {
      if (option.name.startsWith('tracker') && option.value) {
        trackerUrls.push(option.value.trim());
      }
    }

    if (trackerUrls.length === 0) {
      return createErrorResponse('Please provide at least one tracker URL.');
    }

    // Validate all tracker URLs
    const validationResults: Array<{ url: string; result: TrackerValidationResult }> = [];
    const validTrackers: Array<{ url: string; platform: string; platformId: string }> = [];
    const errors: string[] = [];

    for (const url of trackerUrls) {
      const result = validateTrackerUrl(url);
      validationResults.push({ url, result });

      if (result.isValid && result.platform && result.platformId) {
        validTrackers.push({
          url,
          platform: result.platform,
          platformId: result.platformId,
        });
      } else {
        errors.push(`❌ ${url}: ${result.error}`);
      }
    }

    // If no valid trackers, return errors
    if (validTrackers.length === 0) {
      return createEphemeralResponse(`Invalid tracker URLs:\n${errors.join('\n')}`);
    }

    // TODO: Store user registration in database
    // For now, just return success message
    const successMessage = [
      `✅ Successfully registered ${validTrackers.length} tracker URL(s) for <@${userId}>:`,
      '',
      ...validTrackers.map(
        tracker => `• ${tracker.platform?.toUpperCase()}: ${tracker.platformId}`
      ),
    ];

    if (errors.length > 0) {
      successMessage.push('', '⚠️ Some URLs were invalid:', ...errors);
    }

    return createEphemeralResponse(successMessage.join('\n'));
  } catch (error) {
    console.error('Error handling register command:', error);
    return createErrorResponse('An error occurred while processing your registration.');
  }
}
