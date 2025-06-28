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
 * Validate domain is from rocketleague.tracker.network
 */
function validateDomain(hostname: string): boolean {
  return hostname === 'rocketleague.tracker.network';
}

/**
 * Validate URL path structure matches expected pattern
 */
function validatePathStructure(pathParts: readonly string[]): boolean {
  return (
    pathParts.length === 5 &&
    pathParts[0] === 'rocket-league' &&
    pathParts[1] === 'profile' &&
    pathParts[4] === 'overview'
  );
}

/**
 * Check if platform is supported
 */
function validatePlatformSupported(platform: string): boolean {
  const supportedPlatforms = ['steam', 'epic', 'psn', 'xbl', 'switch'];
  return supportedPlatforms.includes(platform.toLowerCase());
}

/**
 * Validate platform-specific ID format
 */
function validatePlatformId(
  platform: string,
  platformId: string
): { isValid: boolean; error?: string } {
  const platformLower = platform.toLowerCase();

  switch (platformLower) {
    case 'steam':
      // Steam ID64 format: 17-digit number starting with 7656119
      if (!/^7656119\d{10}$/.test(platformId)) {
        return {
          isValid: false,
          error: 'Invalid Steam ID64 format. Must be 17 digits starting with 7656119',
        };
      }
      break;

    case 'psn':
      // PSN ID format: 3-16 characters, must start with letter, only letters/numbers/hyphens/underscores
      if (!/^[a-zA-Z][a-zA-Z0-9_-]{2,15}$/.test(platformId)) {
        return {
          isValid: false,
          error:
            'Invalid PSN ID format. Must be 3-16 characters, start with letter, contain only letters/numbers/hyphens/underscores',
        };
      }
      break;

    case 'xbl':
      // Xbox gamertag format: 3-12 characters, must start with letter, letters/numbers/spaces only
      if (!/^[a-zA-Z][a-zA-Z0-9 ]{2,11}$/.test(platformId)) {
        return {
          isValid: false,
          error:
            'Invalid Xbox gamertag format. Must be 3-12 characters, start with letter, contain only letters/numbers/spaces',
        };
      }
      break;

    case 'epic':
      // Epic Games display name: 3+ characters, alphanumeric and common special chars
      if (platformId.length < 3 || !/^[a-zA-Z0-9._-]+$/.test(platformId)) {
        return {
          isValid: false,
          error:
            'Invalid Epic Games display name format. Must be 3+ characters, contain only letters/numbers/periods/hyphens/underscores',
        };
      }
      break;

    case 'switch':
      // Nintendo Switch uses Epic Games account linking, so same validation as Epic
      if (platformId.length < 3 || !/^[a-zA-Z0-9._-]+$/.test(platformId)) {
        return {
          isValid: false,
          error:
            'Invalid Nintendo Switch ID format. Must be 3+ characters, contain only letters/numbers/periods/hyphens/underscores',
        };
      }
      break;

    default:
      return {
        isValid: false,
        error: `Unknown platform: ${platform}`,
      };
  }

  return { isValid: true };
}

/**
 * Validate a Rocket League tracker URL
 * Must be of the form: https://rocketleague.tracker.network/rocket-league/profile/<platform>/<platform_id>/overview
 */
export function validateTrackerUrl(url: string): TrackerValidationResult {
  try {
    const urlObj = new URL(url);

    // Check domain
    if (!validateDomain(urlObj.hostname)) {
      return {
        isValid: false,
        error: 'URL must be from rocketleague.tracker.network',
      };
    }

    // Check path pattern
    const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);

    if (!validatePathStructure(pathParts)) {
      return {
        isValid: false,
        error:
          'URL must follow the format: https://rocketleague.tracker.network/rocket-league/profile/<platform>/<platform_id>/overview',
      };
    }

    const platform = pathParts[2];
    const platformId = pathParts[3];

    // Validate platform exists
    if (
      platform === undefined ||
      platform === '' ||
      platformId === undefined ||
      platformId === ''
    ) {
      return {
        isValid: false,
        error: 'Missing platform or platform ID in URL',
      };
    }

    // Validate supported platforms
    if (!validatePlatformSupported(platform)) {
      return {
        isValid: false,
        error: `Unsupported platform: ${platform}. Supported platforms: steam, epic, psn, xbl, switch`,
      };
    }

    // Decode URL-encoded platform ID
    const decodedPlatformId = decodeURIComponent(platformId);

    // DoS protection: limit platform ID length
    if (decodedPlatformId.length > 100) {
      return {
        isValid: false,
        error: 'Platform ID too long (maximum 100 characters)',
      };
    }

    // Platform-specific validation
    const platformValidation = validatePlatformId(platform, decodedPlatformId);
    if (!platformValidation.isValid) {
      const result: TrackerValidationResult = {
        isValid: false,
      };
      if (platformValidation.error) {
        result.error = platformValidation.error;
      }
      return result;
    }

    return {
      isValid: true,
      platform: platform.toLowerCase(),
      platformId: decodedPlatformId,
    };
  } catch {
    return {
      isValid: false,
      error: 'Invalid URL format',
    };
  }
}

/**
 * Extract user ID from interaction
 */
function extractUserId(interaction: Readonly<DiscordInteraction>): string | undefined {
  return interaction.member?.user?.id ?? interaction.user?.id;
}

/**
 * Extract tracker URLs from command options
 */
function extractTrackerUrls(
  options: readonly { readonly name: string; readonly value: string }[]
): string[] {
  const trackerUrls: string[] = [];
  for (const option of options) {
    if (option.name.startsWith('tracker') && option.value !== '') {
      trackerUrls.push(option.value.trim());
    }
  }
  return trackerUrls;
}

/**
 * Validate all tracker URLs and separate valid from invalid
 */
function validateAllTrackers(trackerUrls: readonly string[]): {
  validTrackers: Array<{ url: string; platform: string; platformId: string }>;
  errors: string[];
} {
  const validTrackers: Array<{ url: string; platform: string; platformId: string }> = [];
  const errors: string[] = [];

  for (const url of trackerUrls) {
    const result = validateTrackerUrl(url);

    if (result.isValid && result.platform !== undefined && result.platformId !== undefined) {
      validTrackers.push({
        url,
        platform: result.platform,
        platformId: result.platformId,
      });
    } else {
      errors.push(`❌ ${url}: ${String(result.error)}`);
    }
  }

  return { validTrackers, errors };
}

/**
 * Create success message for registration
 */
function createSuccessMessage(
  validTrackers: readonly {
    readonly url: string;
    readonly platform: string;
    readonly platformId: string;
  }[],
  userId: string,
  errors: readonly string[]
): string {
  const successMessage = [
    `✅ Successfully registered ${String(validTrackers.length)} tracker URL(s) for <@${userId}>:`,
    '',
    ...validTrackers.map(tracker => `• ${tracker.platform.toUpperCase()}: ${tracker.platformId}`),
  ];

  if (errors.length > 0) {
    successMessage.push('', '⚠️ Some URLs were invalid:', ...errors);
  }

  return successMessage.join('\n');
}

/**
 * Handle the /register command
 */
export function handleRegisterCommand(
  interaction: Readonly<DiscordInteraction>,
  _env: Readonly<Env>
): Response {
  try {
    const userId = extractUserId(interaction);

    if (userId === undefined) {
      return createErrorResponse('Could not identify user. Please try again.');
    }

    const options = interaction.data?.options ?? [];
    const trackerUrls = extractTrackerUrls(options);

    if (trackerUrls.length === 0) {
      return createErrorResponse('Please provide at least one tracker URL.');
    }

    const { validTrackers, errors } = validateAllTrackers(trackerUrls);

    // If no valid trackers, return errors
    if (validTrackers.length === 0) {
      return createEphemeralResponse(`Invalid tracker URLs:\n${errors.join('\n')}`);
    }

    // TODO: Store user registration in database
    // For now, just return success message
    const successMessage = createSuccessMessage(validTrackers, userId, errors);
    return createEphemeralResponse(successMessage);
  } catch (error: unknown) {
    console.error('Error handling register command:', error);
    return createErrorResponse('An error occurred while processing your registration.');
  }
}
