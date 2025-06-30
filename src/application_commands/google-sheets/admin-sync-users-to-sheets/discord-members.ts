/**
 * Discord guild member fetching and data transformation
 * Handles Discord API integration and data formatting for Google Sheets
 */

import type { Env } from '../../../index';
import { DiscordApiService } from '../../../services/discord-api';

/**
 * Discord user interface matching API response
 */
export interface DiscordUser {
  readonly id: string;
  readonly username: string;
  readonly discriminator: string;
  readonly global_name: string | null;
  readonly avatar: string | null;
  readonly bot: boolean;
}

/**
 * Discord guild member interface matching API response
 */
export interface DiscordMember {
  readonly user: DiscordUser;
  readonly nick: string | null;
  readonly roles: readonly string[];
  readonly joined_at: string;
  readonly premium_since: string | null;
  readonly deaf: boolean;
  readonly mute: boolean;
  readonly flags: number;
  readonly pending: boolean;
  readonly permissions: string;
  readonly communication_disabled_until: string | null;
}

/**
 * Transformed member data for Google Sheets
 */
export interface MemberData {
  readonly discord_id: string;
  readonly discord_username_display: string;
  readonly discord_username_actual: string;
  readonly server_join_date: string;
  readonly is_banned: boolean;
  readonly is_active: boolean;
  readonly last_updated: string;
}

/**
 * Result of guild member fetch operation
 */
export interface GuildMemberFetchResult {
  readonly success: boolean;
  readonly members?: readonly DiscordMember[];
  readonly error?: string;
}

/**
 * Mock response interface for testing
 */
export interface GuildMemberResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly json: () => Promise<readonly DiscordMember[]>;
}

/**
 * Validate Discord ID format
 * @param id - ID to validate
 * @returns True if valid Discord ID format
 */
function isValidDiscordId(id: string): boolean {
  return /^\d{17,19}$/.test(id);
}

/**
 * Fetch guild members from Discord API
 * @param guildId - Discord guild ID
 * @param env - Environment configuration with Discord token
 * @returns Result with members array or error
 */
export async function fetchGuildMembers(
  guildId: string,
  env: Env,
  fetchFn: typeof fetch = fetch.bind(globalThis)
): Promise<GuildMemberFetchResult> {
  try {
    const discordApi = new DiscordApiService(env, fetchFn);
    const members = await discordApi.getGuildMembers(guildId, 1000);

    // Validate response format
    if (!Array.isArray(members)) {
      return {
        success: false,
        error: 'Invalid response format: Expected array of members',
      } satisfies GuildMemberFetchResult;
    }

    return {
      success: true,
      members: members as readonly DiscordMember[],
    } satisfies GuildMemberFetchResult;
  } catch (error: unknown) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to fetch guild members: ${errorMessage}`,
    } satisfies GuildMemberFetchResult;
  }
}

/**
 * Transform Discord member data to Google Sheets format
 * @param members - Array of Discord members
 * @returns Array of transformed member data
 */
/**
 * Check if user object is valid
 */
function isValidUser(user: DiscordUser): boolean {
  return (
    typeof user.id === 'string' &&
    typeof user.username === 'string' &&
    user.id.length > 0 &&
    user.username.length > 0 &&
    !user.bot &&
    isValidDiscordId(user.id)
  );
}

/**
 * Check if member data is valid for processing
 * @param member - Discord member to validate
 * @returns True if member has required fields and is not a bot
 */
function isValidMember(member: DiscordMember): boolean {
  // Check for required user object and fields
  if (!isValidUser(member.user)) {
    return false;
  }

  // Check for required member fields
  if (!Array.isArray(member.roles) || typeof member.joined_at !== 'string') {
    return false;
  }

  return true;
}

export function transformMemberData(members: readonly DiscordMember[]): MemberData[] {
  return members
    .filter((member: DiscordMember): boolean => isValidMember(member))
    .map((member: DiscordMember): MemberData => {
      // Priority: nickname > global_name > username for display
      const usernameDisplay: string =
        member.nick ?? member.user.global_name ?? member.user.username;
      const usernameActual: string = member.user.username;
      const serverJoinDate: string = member.joined_at;
      const isBanned: boolean = false; // Default to false, would need ban check logic
      const isActive: boolean = true; // Default to true, could check last activity
      const lastUpdated: string = new Date().toISOString();

      return {
        discord_id: member.user.id,
        discord_username_display: usernameDisplay,
        discord_username_actual: usernameActual,
        server_join_date: serverJoinDate,
        is_banned: isBanned,
        is_active: isActive,
        last_updated: lastUpdated,
      } satisfies MemberData;
    });
}

/**
 * Filter out members that already exist in Google Sheets
 * @param memberData - Array of member data
 * @param existingIds - Set of existing Discord IDs from sheets
 * @returns Array of new members only
 */
export function filterNewMembers(
  memberData: readonly MemberData[],
  existingIds: Set<string>
): MemberData[] {
  return memberData.filter((member: MemberData): boolean => {
    return !existingIds.has(member.discord_id);
  });
}
