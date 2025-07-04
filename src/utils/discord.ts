/**
 * Discord utilities for request verification and interaction handling
 * Following Discord sample app patterns
 */

import nacl from 'tweetnacl';
import { Buffer } from 'buffer';

// Discord interaction types
export enum InteractionType {
  Ping = 1,
  ApplicationCommand = 2,
  MessageComponent = 3,
  ApplicationCommandAutocomplete = 4,
  ModalSubmit = 5,
}

// Discord interaction response types (Discord API constants)
export const InteractionResponseType = {
  Pong: 1,
  ChannelMessageWithSource: 4,
  DeferredChannelMessageWithSource: 5,
  DeferredUpdateMessage: 6,
  UpdateMessage: 7,
  ApplicationCommandAutocompleteResult: 8,
  Modal: 9,
} as const;

export type InteractionResponseType =
  (typeof InteractionResponseType)[keyof typeof InteractionResponseType];

/**
 * Verify Discord request signature
 */
export async function verifyDiscordRequest(
  request: Readonly<Request>,
  publicKey: string
): Promise<boolean> {
  try {
    const signature = request.headers.get('X-Signature-Ed25519');
    const timestamp = request.headers.get('X-Signature-Timestamp');
    const body = await request.clone().arrayBuffer();

    if (signature === null || timestamp === null || signature === '' || timestamp === '') {
      console.error('Missing signature headers');
      return false;
    }

    return nacl.sign.detached.verify(
      Buffer.from(timestamp + new TextDecoder().decode(body)),
      Buffer.from(signature, 'hex'),
      Buffer.from(publicKey, 'hex')
    );
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
  const EPHEMERAL_FLAG = 64;
  return createInteractionResponse(InteractionResponseType.ChannelMessageWithSource, {
    content,
    flags: EPHEMERAL_FLAG,
  });
}

/**
 * Create a public message response
 */
export function createPublicResponse(content: string): Response {
  return createInteractionResponse(InteractionResponseType.ChannelMessageWithSource, {
    content,
  });
}

/**
 * Create an error response
 */
export function createErrorResponse(message = 'An error occurred. Please try again.'): Response {
  return createEphemeralResponse(`❌ ${message}`);
}
