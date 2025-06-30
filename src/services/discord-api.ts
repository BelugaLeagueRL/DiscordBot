/**
 * Discord API Service
 * Centralized service for all Discord API interactions with proper authentication
 */

import type { Env } from '../index';

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
    this.token = env.DISCORD_TOKEN;
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

      throw new Error(`Discord API error (${response.status.toString()}): ${message}`);
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
  async getGuildMembers(guildId: string, limit: number = 1000): Promise<unknown[]> {
    return await this.get(`/guilds/${guildId}/members?limit=${limit.toString()}`);
  }

  /**
   * Send message to channel
   */
  async sendMessage(channelId: string, content: string): Promise<unknown> {
    return await this.post(`/channels/${channelId}/messages`, { content });
  }
}
