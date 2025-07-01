/**
 * Discord utilities for request verification and interaction handling
 * Following Discord sample app patterns
 */

import { verifyKey } from 'discord-interactions';

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

    return verifyKey(body, signature, timestamp, publicKey);
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
 * Create a deferred response for long-running operations
 */
export function createDeferredResponse(ephemeral = false): Response {
  const EPHEMERAL_FLAG = 64;
  return createInteractionResponse(
    InteractionResponseType.DeferredChannelMessageWithSource,
    ephemeral ? { flags: EPHEMERAL_FLAG } : undefined
  );
}

/**
 * Update a deferred response via Discord webhook
 */
export async function updateDeferredResponse(
  applicationId: string,
  interactionToken: string,
  content: string
): Promise<void> {
  const webhookUrl = `https://discord.com/api/v10/webhooks/${applicationId}/${interactionToken}/messages/@original`;

  const response = await fetch(webhookUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    console.error(`Discord webhook failed: ${response.status}`);
  }
}

/**
 * Create an error response
 */
export function createErrorResponse(message = 'An error occurred. Please try again.'): Response {
  return createEphemeralResponse(`❌ ${message}`);
}
