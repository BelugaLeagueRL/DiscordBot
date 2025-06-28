import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  InteractionType,
  InteractionResponseType,
  verifyDiscordRequest,
  createInteractionResponse,
  createEphemeralResponse,
  createPublicResponse,
  createErrorResponse,
} from '../utils/discord';

// Mock discord-interactions module
vi.mock('discord-interactions', () => ({
  verifyKey: vi.fn(),
}));

describe('Discord utilities', () => {
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('verifyDiscordRequest', () => {
    it('should verify valid Discord request', async () => {
      const { verifyKey } = await import('discord-interactions');
      vi.mocked(verifyKey).mockResolvedValue(true);

      const request = new Request('https://example.com', {
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'valid_signature',
          'X-Signature-Timestamp': '1234567890',
        },
        body: JSON.stringify({ test: 'data' }),
      });

      const result = await verifyDiscordRequest(request, 'test_public_key');

      expect(result).toBe(true);
      expect(verifyKey).toHaveBeenCalled();
    });

    it('should return false for invalid signature', async () => {
      const { verifyKey } = await import('discord-interactions');
      vi.mocked(verifyKey).mockResolvedValue(false);

      const request = new Request('https://example.com', {
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'invalid_signature',
          'X-Signature-Timestamp': '1234567890',
        },
        body: JSON.stringify({ test: 'data' }),
      });

      const result = await verifyDiscordRequest(request, 'test_public_key');

      expect(result).toBe(false);
    });

    it('should return false when signature header is missing', async () => {
      const request = new Request('https://example.com', {
        method: 'POST',
        headers: {
          'X-Signature-Timestamp': '1234567890',
        },
        body: JSON.stringify({ test: 'data' }),
      });

      const result = await verifyDiscordRequest(request, 'test_public_key');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Missing signature headers');
    });

    it('should return false when timestamp header is missing', async () => {
      const request = new Request('https://example.com', {
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'valid_signature',
        },
        body: JSON.stringify({ test: 'data' }),
      });

      const result = await verifyDiscordRequest(request, 'test_public_key');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Missing signature headers');
    });

    it('should handle verification errors gracefully', async () => {
      const { verifyKey } = await import('discord-interactions');
      vi.mocked(verifyKey).mockRejectedValue(new Error('Verification failed'));

      const request = new Request('https://example.com', {
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'valid_signature',
          'X-Signature-Timestamp': '1234567890',
        },
        body: JSON.stringify({ test: 'data' }),
      });

      const result = await verifyDiscordRequest(request, 'test_public_key');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error verifying Discord request:',
        expect.any(Error)
      );
    });

    it('should handle empty headers', async () => {
      const request = new Request('https://example.com', {
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': '',
          'X-Signature-Timestamp': '',
        },
        body: JSON.stringify({ test: 'data' }),
      });

      const result = await verifyDiscordRequest(request, 'test_public_key');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Missing signature headers');
    });
  });

  describe('createInteractionResponse', () => {
    it('should create response with type and data', async () => {
      const response = createInteractionResponse(InteractionResponseType.PONG, { test: 'data' });
      const data = await response.json();

      expect(data).toEqual({
        type: InteractionResponseType.PONG,
        data: { test: 'data' },
      });
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should create response with only type', async () => {
      const response = createInteractionResponse(InteractionResponseType.PONG);
      const data = await response.json();

      expect(data).toEqual({
        type: InteractionResponseType.PONG,
        data: undefined,
      });
    });
  });

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
