/**
 * Admin permissions validation for Discord application commands
 * Validates users have Admin role or are the privileged user
 */

import type { DiscordInteraction } from '../../types/discord';
import type { Env } from '../../index';

/**
 * Result of admin permissions validation
 */
export interface AdminPermissionResult {
  readonly isAuthorized: boolean;
  readonly error?: string;
  readonly userType?: 'admin_role' | 'privileged_user';
}

/**
 * Extract user ID from Discord interaction
 * @param interaction - Discord interaction to extract user ID from
 * @returns User ID if found, undefined otherwise
 */
function extractUserId(interaction: Readonly<DiscordInteraction>): string | undefined {
  const userId: string | undefined = interaction.member?.user?.id ?? interaction.user?.id;
  return userId;
}

/**
 * Check if user has Administrator role
 * @param interaction - Discord interaction containing member roles
 * @returns True if user has Administrator role (role ID '8')
 */
function hasAdminRole(interaction: Readonly<DiscordInteraction>): boolean {
  const member = interaction.member;
  if (member === undefined) {
    return false;
  }

  const roles = member.roles;
  if (roles === undefined || roles.length === 0) {
    return false;
  }

  // Check for Administrator permission (role ID '8')
  return roles.includes('8');
}

/**
 * Check if user ID matches the privileged user
 * @param userId - User ID to check
 * @param env - Environment configuration containing PRIVILEGED_USER_ID
 * @returns True if user ID matches PRIVILEGED_USER_ID
 */
function isPrivilegedUser(userId: string | undefined, env: Readonly<Env>): boolean {
  if (userId === undefined || env.PRIVILEGED_USER_ID === undefined) {
    return false;
  }
  return userId === env.PRIVILEGED_USER_ID;
}

/**
 * Validate if user has admin permissions (Admin role or privileged user ID)
 * @param interaction - Discord interaction to validate
 * @param env - Environment configuration containing PRIVILEGED_USER_ID
 * @returns Validation result indicating if user has admin permissions
 */
export function validateAdminPermissions(
  interaction: Readonly<DiscordInteraction>,
  env: Readonly<Env>
): AdminPermissionResult {
  // Extract user ID first
  const userId: string | undefined = extractUserId(interaction);

  if (userId === undefined) {
    return {
      isAuthorized: false,
      error: 'Unable to identify user. Please try again.',
    } satisfies AdminPermissionResult;
  }

  // Check for admin role first (takes priority)
  if (hasAdminRole(interaction)) {
    return {
      isAuthorized: true,
      userType: 'admin_role',
    } satisfies AdminPermissionResult;
  }

  // Check for privileged user ID
  if (isPrivilegedUser(userId, env)) {
    return {
      isAuthorized: true,
      userType: 'privileged_user',
    } satisfies AdminPermissionResult;
  }

  // Neither admin role nor privileged user
  return {
    isAuthorized: false,
    error: 'Access denied. Admin role or special permissions required.',
  } satisfies AdminPermissionResult;
}
