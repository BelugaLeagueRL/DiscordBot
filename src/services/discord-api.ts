/**
 * Discord API Service
 * Centralized service for all Discord API interactions with proper authentication
 */

import type { Env } from '../index';
import type { DiscordMember } from '../application_commands/google-sheets/admin-sync-users-to-sheets/discord-members';

/**
 * Discord API base configuration
 */
const DISCORD_API_BASE = 'https://discord.com/api/v10';

/**
 * Discord API service with centralized authentication
 */
export class DiscordApiService {
  private readonly token: string;
  private readonly fetchFn: typeof fetch;

  constructor(env: Env, fetchFn: typeof fetch = fetch.bind(globalThis)) {
    // Remove 'Bot ' prefix if already present to avoid duplication
    this.token = env.DISCORD_TOKEN.startsWith('Bot ')
      ? env.DISCORD_TOKEN.slice(4)
      : env.DISCORD_TOKEN;
    this.fetchFn = fetchFn;
  }

  /**
   * Get authenticated headers for Discord API requests
   */
  private getAuthHeaders(): HeadersInit {
    return {
      Authorization: `Bot ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Make authenticated GET request to Discord API
   */
  async get<T>(endpoint: string): Promise<T> {
    const response = await this.fetchFn(`${DISCORD_API_BASE}${endpoint}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      const message =
        typeof errorData === 'object' && errorData !== null && 'message' in errorData
          ? String(errorData.message)
          : 'Unknown error';

      // Create enhanced error for rate limiting
      const error = new Error(`Discord API error (${response.status.toString()}): ${message}`);
      // Attach rate limit data for retry logic
      if (response.status === 429 && typeof errorData === 'object' && errorData !== null) {
        (error as Error & { rateLimitData?: unknown }).rateLimitData = errorData;
      }
      throw error;
    }

    return (await response.json()) as T;
  }

  /**
   * Make authenticated POST request to Discord API
   */
  async post<T>(endpoint: string, body: unknown): Promise<T> {
    const response = await this.fetchFn(`${DISCORD_API_BASE}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      const message =
        typeof errorData === 'object' && errorData !== null && 'message' in errorData
          ? String(errorData.message)
          : 'Unknown error';

      throw new Error(`Discord API error (${response.status.toString()}): ${message}`);
    }

    return (await response.json()) as T;
  }

  /**
   * Get guild members
   */
  async getGuildMembers(guildId: string, limit: number = 1000): Promise<DiscordMember[]> {
    return await this.getWithRetry<DiscordMember[]>(
      `/guilds/${guildId}/members?limit=${limit.toString()}`
    );
  }

  /**
   * Get all guild members with automatic pagination for large guilds (>1000 members)
   * Implements Discord API v10 pagination using 'after' parameter with rate limiting support
   */
  async getAllGuildMembers(guildId: string): Promise<DiscordMember[]> {
    const allMembers: DiscordMember[] = [];
    let after: string | undefined;
    let hasMoreMembers = true;

    while (hasMoreMembers) {
      try {
        // Build endpoint with pagination
        let endpoint = `/guilds/${guildId}/members?limit=1000`;
        if (after !== undefined) {
          endpoint += `&after=${after}`;
        }

        // Fetch current page with rate limiting support
        const currentPage = await this.getWithRetry<DiscordMember[]>(endpoint);

        // Validate response format
        if (!Array.isArray(currentPage)) {
          throw new Error('Invalid response format: Expected array of members');
        }

        // Add members to result
        allMembers.push(...currentPage);

        // Check if we need to fetch more pages
        if (currentPage.length < 1000) {
          // Last page was not full, no more members
          hasMoreMembers = false;
        } else {
          // Extract last member ID for next page
          const lastMember = currentPage[currentPage.length - 1];
          after = lastMember?.user?.id;

          if (!after) {
            // Can't continue pagination without member ID
            hasMoreMembers = false;
          }
        }
      } catch (error: unknown) {
        // Re-throw with additional context for pagination errors
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(errorMessage);
      }
    }

    return allMembers;
  }

  /**
   * Make authenticated GET request with rate limiting retry logic
   */
  private async getWithRetry<T>(endpoint: string, maxRetries: number = 1): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.get<T>(endpoint);
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes('429')) {
          // Check rate limit data for global flag
          const rateLimitData = (error as Error & { rateLimitData?: { global?: boolean } })
            .rateLimitData;
          if (rateLimitData && rateLimitData.global === true) {
            // Global rate limit - don't retry
            throw error;
          }

          if (attempt < maxRetries) {
            // Local rate limit - wait and retry
            await new Promise(resolve => setTimeout(resolve, 1500));
            continue;
          }
        }
        throw error;
      }
    }

    // This should never be reached, but TypeScript requires it
    throw new Error('Unexpected end of retry loop');
  }

  /**
   * Send message to channel
   */
  async sendMessage(channelId: string, content: string): Promise<unknown> {
    return await this.post(`/channels/${channelId}/messages`, { content });
  }
}
