import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import {
  InteractionType,
  InteractionResponseType,
  verifyDiscordRequest,
  createInteractionResponse,
  createEphemeralResponse,
  createPublicResponse,
  createErrorResponse,
} from '../utils/discord';

// Type guard for Discord response data
function isDiscordResponseData(data: unknown): data is { type: number; data?: { content?: string; flags?: number } } {
  return typeof data === 'object' && data !== null && typeof (data as { type: unknown }).type === 'number';
}

// Mock discord-interactions module
vi.mock('discord-interactions', () => ({
  verifyKey: vi.fn(),
}));

describe('Discord utilities', () => {
  let mockVerifyKey: MockedFunction<(rawBody: string | ArrayBuffer | Uint8Array | Buffer, signature: string | ArrayBuffer | Uint8Array | Buffer, timestamp: string | ArrayBuffer | Uint8Array | Buffer, clientPublicKey: string | ArrayBuffer | Uint8Array | Buffer) => boolean>;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Setup properly typed mocks
    mockVerifyKey = vi.mocked((await import('discord-interactions')).verifyKey);
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // Mock implementation
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('verifyDiscordRequest', () => {
    it('should verify valid Discord request', async () => {
      mockVerifyKey.mockReturnValue(true);

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
      expect(mockVerifyKey).toHaveBeenCalled();
    });

    it('should return false for invalid signature', async () => {
      mockVerifyKey.mockReturnValue(false);

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
      mockVerifyKey.mockImplementation(() => {
        throw new Error('Verification failed');
      });

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
      const response = createInteractionResponse(InteractionResponseType.Pong, { test: 'data' });
      const rawData = await response.json();
      if (!isDiscordResponseData(rawData)) throw new Error('Invalid response format');
      const data = rawData;

      expect(data).toEqual({
        type: InteractionResponseType.Pong,
        data: { test: 'data' },
      });
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should create response with only type', async () => {
      const response = createInteractionResponse(InteractionResponseType.Pong);
      const rawData = await response.json();
      if (!isDiscordResponseData(rawData)) throw new Error('Invalid response format');
      const data = rawData;

      expect(data).toEqual({
        type: InteractionResponseType.Pong,
        data: undefined,
      });
    });
  });

  describe('constants', () => {
    it('should have correct interaction types', () => {
      expect(InteractionType.Ping).toBe(1);
      expect(InteractionType.ApplicationCommand).toBe(2);
      expect(InteractionType.MessageComponent).toBe(3);
    });

    it('should have correct response types', () => {
      expect(InteractionResponseType.Pong).toBe(1);
      expect(InteractionResponseType.ChannelMessageWithSource).toBe(4);
      expect(InteractionResponseType.DeferredChannelMessageWithSource).toBe(5);
    });
  });

  describe('response creators', () => {
    it('should create ephemeral response', async () => {
      const response = createEphemeralResponse('Test message');
      const rawData = await response.json();
      if (!isDiscordResponseData(rawData)) throw new Error('Invalid response format');
      const data = rawData;

      expect(data.type).toBe(InteractionResponseType.ChannelMessageWithSource);
      expect(data.data?.content).toBe('Test message');
      expect(data.data?.flags).toBe(64); // Ephemeral flag
    });

    it('should create public response', async () => {
      const response = createPublicResponse('Public message');
      const rawData = await response.json();
      if (!isDiscordResponseData(rawData)) throw new Error('Invalid response format');
      const data = rawData;

      expect(data.type).toBe(InteractionResponseType.ChannelMessageWithSource);
      expect(data.data?.content).toBe('Public message');
      expect(data.data?.flags).toBeUndefined();
    });

    it('should create error response', async () => {
      const response = createErrorResponse('Custom error');
      const rawData = await response.json();
      if (!isDiscordResponseData(rawData)) throw new Error('Invalid response format');
      const data = rawData;

      expect(data.type).toBe(InteractionResponseType.ChannelMessageWithSource);
      expect(data.data?.content).toBe('❌ Custom error');
      expect(data.data?.flags).toBe(64); // Ephemeral flag
    });

    it('should create default error response', async () => {
      const response = createErrorResponse();
      const rawData = await response.json();
      if (!isDiscordResponseData(rawData)) throw new Error('Invalid response format');
      const data = rawData;

      expect(data.data?.content).toBe('❌ An error occurred. Please try again.');
    });
  });
});
