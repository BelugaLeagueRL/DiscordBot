import { describe, it, expect } from 'vitest';
import {
  InteractionType,
  InteractionResponseType,
  createEphemeralResponse,
  createPublicResponse,
  createErrorResponse,
} from '../utils/discord';

describe('Discord utilities', () => {
  describe('constants', () => {
    it('should have correct interaction types', () => {
      expect(InteractionType.PING).toBe(1);
      expect(InteractionType.APPLICATION_COMMAND).toBe(2);
      expect(InteractionType.MESSAGE_COMPONENT).toBe(3);
    });

    it('should have correct response types', () => {
      expect(InteractionResponseType.PONG).toBe(1);
      expect(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE).toBe(4);
      expect(InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE).toBe(5);
    });
  });

  describe('response creators', () => {
    it('should create ephemeral response', async () => {
      const response = createEphemeralResponse('Test message');
      const data = (await response.json()) as any;

      expect(data.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(data.data.content).toBe('Test message');
      expect(data.data.flags).toBe(64); // Ephemeral flag
    });

    it('should create public response', async () => {
      const response = createPublicResponse('Public message');
      const data = (await response.json()) as any;

      expect(data.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(data.data.content).toBe('Public message');
      expect(data.data.flags).toBeUndefined();
    });

    it('should create error response', async () => {
      const response = createErrorResponse('Custom error');
      const data = (await response.json()) as any;

      expect(data.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(data.data.content).toBe('❌ Custom error');
      expect(data.data.flags).toBe(64); // Ephemeral flag
    });

    it('should create default error response', async () => {
      const response = createErrorResponse();
      const data = (await response.json()) as any;

      expect(data.data.content).toBe('❌ An error occurred. Please try again.');
    });
  });
});
