/**
 * Response routing for Discord application commands
 * Routes command responses to designated channels
 */

import type { Env } from '../../index';
import { DiscordApiService } from '../../services/discord-api';

export interface ResponseRoutingResult {
  readonly success: boolean;
  readonly error?: string;
}

/**
 * Route response message to configured channel
 */
export async function routeResponseToChannel(
  message: string,
  env: Readonly<Env>,
  fetchFn: typeof fetch = fetch.bind(globalThis)
): Promise<ResponseRoutingResult> {
  console.log('🚀 routeResponseToChannel called with message length:', message.length);
  console.log('🚀 Channel ID:', env.REGISTER_COMMAND_RESPONSE_CHANNEL_ID);
  console.log('🚀 Bot token present:', env.DISCORD_TOKEN === '' ? 'NO' : 'YES');

  // Check if response channel is configured
  if (env.REGISTER_COMMAND_RESPONSE_CHANNEL_ID === undefined) {
    console.log('❌ Response channel not configured');
    return {
      success: false,
      error: 'Response channel not configured.',
    };
  }

  try {
    console.log('🚀 Making Discord API call to send message...');

    const discordApi = new DiscordApiService(env, fetchFn);
    await discordApi.sendMessage(env.REGISTER_COMMAND_RESPONSE_CHANNEL_ID, message);

    console.log('✅ Message sent successfully to Discord');
    return {
      success: true,
    };
  } catch (error) {
    console.log('❌ Discord API error:', error);
    console.log('❌ Error details:', JSON.stringify(error, null, 2));
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Network error occurred while sending message.',
    };
  }
}
