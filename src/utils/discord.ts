/**
 * Discord utilities for request verification and interaction handling
 * Following Discord sample app patterns
 */

import { verifyKey } from 'discord-interactions';

// Discord interaction types
export enum InteractionType {
  PING = 1,
  APPLICATION_COMMAND = 2,
  MESSAGE_COMPONENT = 3,
  APPLICATION_COMMAND_AUTOCOMPLETE = 4,
  MODAL_SUBMIT = 5,
}

// Discord interaction response types
export enum InteractionResponseType {
  PONG = 1,
  CHANNEL_MESSAGE_WITH_SOURCE = 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE = 5,
  DEFERRED_UPDATE_MESSAGE = 6,
  UPDATE_MESSAGE = 7,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT = 8,
  MODAL = 9,
}

/**
 * Verify Discord request signature
 */
export async function verifyDiscordRequest(request: Request, publicKey: string): Promise<boolean> {
  try {
    const signature = request.headers.get('X-Signature-Ed25519');
    const timestamp = request.headers.get('X-Signature-Timestamp');
    const body = await request.clone().arrayBuffer();

    if (!signature || !timestamp) {
      console.error('Missing signature headers');
      return false;
    }

    return await verifyKey(body, signature, timestamp, publicKey);
  } catch (error) {
    console.error('Error verifying Discord request:', error);
    return false;
  }
}

/**
 * Create a Discord interaction response
 */
export function createInteractionResponse(type: InteractionResponseType, data?: unknown): Response {
  return new Response(
    JSON.stringify({
      type,
      data,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Create an ephemeral (private) message response
 */
export function createEphemeralResponse(content: string): Response {
  return createInteractionResponse(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, {
    content,
    flags: 64, // Ephemeral flag
  });
}

/**
 * Create a public message response
 */
export function createPublicResponse(content: string): Response {
  return createInteractionResponse(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, {
    content,
  });
}

/**
 * Create an error response
 */
export function createErrorResponse(
  message: string = 'An error occurred. Please try again.'
): Response {
  return createEphemeralResponse(`❌ ${message}`);
}
