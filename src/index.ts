/**
 * Main entry point for the Beluga Discord Bot
 * Based on Discord's official Cloudflare Workers sample app
 */

import { verifyDiscordRequest, InteractionType, InteractionResponseType } from './utils/discord';
import { handleRegisterCommand } from './handlers/register';

export interface Env {
  DISCORD_TOKEN: string;
  DISCORD_PUBLIC_KEY: string;
  DISCORD_APPLICATION_ID: string;
  DATABASE_URL?: string;
  GOOGLE_SHEETS_API_KEY?: string;
  ENVIRONMENT: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Signature-Ed25519, X-Signature-Timestamp',
        },
      });
    }

    // Handle GET request for health check
    if (request.method === 'GET') {
      return new Response('Beluga Discord Bot is running!', {
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Only handle POST requests for Discord interactions
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Verify Discord request
    const isValidRequest = await verifyDiscordRequest(request, env.DISCORD_PUBLIC_KEY);
    if (!isValidRequest) {
      console.error('Invalid request signature');
      return new Response('Unauthorized', { status: 401 });
    }

    const interaction = await request.json();
    console.log('Received interaction:', interaction.type, interaction.data?.name);

    // Handle ping from Discord
    if (interaction.type === InteractionType.PING) {
      return new Response(JSON.stringify({ type: InteractionResponseType.PONG }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Handle application commands
    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
      const { name } = interaction.data;

      switch (name) {
        case 'register':
          return await handleRegisterCommand(interaction, env);
        
        default:
          console.error('Unknown command:', name);
          return new Response(
            JSON.stringify({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: 'Unknown command. Please try again.',
                flags: 64, // Ephemeral
              },
            }),
            { headers: { 'Content-Type': 'application/json' } }
          );
      }
    }

    // Handle unknown interaction types
    console.error('Unknown interaction type:', interaction.type);
    return new Response('Bad request', { status: 400 });
  },
};