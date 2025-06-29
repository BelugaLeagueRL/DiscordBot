/**
 * Response routing for Discord application commands
 * Routes command responses to designated channels
 */

import type { Env } from '../../index';

export interface ResponseRoutingResult {
  readonly success: boolean;
  readonly error?: string;
}

/**
 * Route response message to configured channel
 */
export async function routeResponseToChannel(
  message: string,
  env: Readonly<Env>
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

    // Make Discord API call to send message
    const response = await fetch(
      `https://discord.com/api/v10/channels/${env.REGISTER_COMMAND_RESPONSE_CHANNEL_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bot ${env.DISCORD_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: message,
        }),
      }
    );

    console.log('🚀 Fetch completed, checking response...');
    console.log('🚀 Discord API response status:', response.status);
    console.log('🚀 Discord API response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Discord API error:', errorText);
      return {
        success: false,
        error: `Failed to send message: ${String(response.status)} ${response.statusText} - ${errorText}`,
      };
    }

    console.log('✅ Message sent successfully to Discord');
    return {
      success: true,
    };
  } catch (error) {
    console.log('❌ Network error:', error);
    console.log('❌ Error details:', JSON.stringify(error, null, 2));
    return {
      success: false,
      error: 'Network error occurred while sending message.',
    };
  }
}
