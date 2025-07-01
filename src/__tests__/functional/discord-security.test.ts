/**
 * Functional tests for Discord signature verification
 * Tests real-world signature validation scenarios based on Discord's Ed25519 requirements
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { MockedFunction } from 'vitest';
import { verifyDiscordRequest } from '../../utils/discord';

// Mock the discord-interactions module
vi.mock('discord-interactions', () => ({
  verifyKey: vi.fn(),
}));
import { verifyKey } from 'discord-interactions';

describe('Discord Signature Verification Functional Tests', () => {
  let mockVerifyKey: MockedFunction<
    (
      rawBody: string | ArrayBuffer | Uint8Array | Buffer,
      signature: string | ArrayBuffer | Uint8Array | Buffer,
      timestamp: string | ArrayBuffer | Uint8Array | Buffer,
      clientPublicKey: string | ArrayBuffer | Uint8Array | Buffer
    ) => boolean
  >;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockVerifyKey = vi.mocked(verifyKey);
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // Mock implementation
    });
  });

  describe('Real Discord Request Format Validation', () => {
    it('should verify request with valid Discord headers and signature', async () => {
      // Based on research: real Discord request format
      mockVerifyKey.mockReturnValue(true);

      const request = new Request('https://example.com/discord-webhook', {
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
          'X-Signature-Timestamp': '1640995200',
          'Content-Type': 'application/json',
          'User-Agent': 'Discord-Interactions/1.0 (+https://discord.com)',
        },
        body: JSON.stringify({
          id: '123456789012345678',
          type: 1, // PING
          token: 'test_token',
          version: 1,
        }),
      });

      const result = await verifyDiscordRequest(request, 'test_public_key_hex');

      expect(result).toBe(true);
      expect(mockVerifyKey).toHaveBeenCalledWith(
        expect.any(ArrayBuffer), // body as ArrayBuffer
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
        '1640995200',
        'test_public_key_hex'
      );
    });

    it('should reject request with invalid signature', async () => {
      // Real scenario: signature verification fails
      mockVerifyKey.mockReturnValue(false);

      const request = new Request('https://example.com/discord-webhook', {
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'invalid_signature_hex',
          'X-Signature-Timestamp': '1640995200',
        },
        body: JSON.stringify({ type: 1 }),
      });

      const result = await verifyDiscordRequest(request, 'test_public_key_hex');

      // Behavioral validation: verify signature verification security behavior
      expect(result).toBe(false);
      expect(mockVerifyKey).toHaveBeenCalled();
      expect(mockVerifyKey).toHaveBeenCalledWith(
        JSON.stringify({ type: 1 }),
        'invalid_signature_hex',
        '1640995200',
        'test_public_key_hex'
      );

      // Behavioral validation: verify security rejection with proper parameters
      expect(consoleSpy).toHaveBeenCalledWith('Discord signature verification failed');
    });
  });

  describe('Header Validation Edge Cases', () => {
    it('should reject request missing signature header', async () => {
      const request = new Request('https://example.com/discord-webhook', {
        method: 'POST',
        headers: {
          'X-Signature-Timestamp': '1640995200',
        },
        body: JSON.stringify({ type: 1 }),
      });

      const result = await verifyDiscordRequest(request, 'test_public_key_hex');

      // Behavioral validation: verify missing header security behavior
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Missing signature headers');
      expect(mockVerifyKey).not.toHaveBeenCalled();

      // Behavioral validation: verify security fails fast without crypto operations
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).not.toHaveBeenCalledWith('Discord signature verification failed');
    });

    it('should reject request missing timestamp header', async () => {
      const request = new Request('https://example.com/discord-webhook', {
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'valid_signature_hex',
        },
        body: JSON.stringify({ type: 1 }),
      });

      const result = await verifyDiscordRequest(request, 'test_public_key_hex');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Missing signature headers');
      expect(mockVerifyKey).not.toHaveBeenCalled();
    });

    it('should reject request with empty signature headers', async () => {
      const request = new Request('https://example.com/discord-webhook', {
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': '',
          'X-Signature-Timestamp': '',
        },
        body: JSON.stringify({ type: 1 }),
      });

      const result = await verifyDiscordRequest(request, 'test_public_key_hex');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Missing signature headers');
      expect(mockVerifyKey).not.toHaveBeenCalled();
    });
  });

  describe('Cryptographic Edge Cases', () => {
    it('should handle verification library errors gracefully', async () => {
      // Real scenario: crypto library throws error
      mockVerifyKey.mockImplementation(() => {
        throw new Error('Invalid key format');
      });

      const request = new Request('https://example.com/discord-webhook', {
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'malformed_signature',
          'X-Signature-Timestamp': '1640995200',
        },
        body: JSON.stringify({ type: 1 }),
      });

      const result = await verifyDiscordRequest(request, 'invalid_public_key');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error verifying Discord request:',
        expect.any(Error)
      );
    });

    it('should handle malformed hex signatures', async () => {
      // Discord signatures should be valid hex strings
      mockVerifyKey.mockImplementation(() => {
        throw new Error('Invalid hex encoding');
      });

      const request = new Request('https://example.com/discord-webhook', {
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'not_valid_hex_string!@#',
          'X-Signature-Timestamp': '1640995200',
        },
        body: JSON.stringify({ type: 1 }),
      });

      const result = await verifyDiscordRequest(request, 'test_public_key_hex');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error verifying Discord request:',
        expect.any(Error)
      );
    });
  });

  describe('Body Handling Edge Cases', () => {
    it('should handle empty request body', async () => {
      mockVerifyKey.mockReturnValue(true);

      const request = new Request('https://example.com/discord-webhook', {
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'valid_signature_hex',
          'X-Signature-Timestamp': '1640995200',
        },
        body: '',
      });

      const result = await verifyDiscordRequest(request, 'test_public_key_hex');

      expect(result).toBe(true);
      expect(mockVerifyKey).toHaveBeenCalledWith(
        expect.any(ArrayBuffer),
        'valid_signature_hex',
        '1640995200',
        'test_public_key_hex'
      );
    });

    it('should handle large request bodies', async () => {
      // Test with realistic Discord interaction payload size
      mockVerifyKey.mockReturnValue(true);

      // Create large payload - content doesn't matter, only size
      const largePayload = {
        type: 2,
        data: { name: 'register', large_field: 'x'.repeat(500) },
        token: 'x'.repeat(100),
      };

      const request = new Request('https://example.com/discord-webhook', {
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'valid_signature_hex',
          'X-Signature-Timestamp': '1640995200',
        },
        body: JSON.stringify(largePayload),
      });

      const result = await verifyDiscordRequest(request, 'test_public_key_hex');

      expect(result).toBe(true);
      expect(mockVerifyKey).toHaveBeenCalled();
    });
  });

  describe('Timestamp Security Considerations', () => {
    it('should accept current timestamp values', async () => {
      // Real scenario: current Unix timestamp
      mockVerifyKey.mockReturnValue(true);
      const currentTimestamp = Math.floor(Date.now() / 1000).toString();

      const request = new Request('https://example.com/discord-webhook', {
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'valid_signature_hex',
          'X-Signature-Timestamp': currentTimestamp,
        },
        body: JSON.stringify({ type: 1 }),
      });

      const result = await verifyDiscordRequest(request, 'test_public_key_hex');

      expect(result).toBe(true);
      expect(mockVerifyKey).toHaveBeenCalledWith(
        expect.any(ArrayBuffer),
        'valid_signature_hex',
        currentTimestamp,
        'test_public_key_hex'
      );
    });

    it('should handle very old timestamp values', async () => {
      // Test with old timestamp - signature verification should still work
      // (timestamp age validation would happen at higher level)
      mockVerifyKey.mockReturnValue(true);

      const request = new Request('https://example.com/discord-webhook', {
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'valid_signature_hex',
          'X-Signature-Timestamp': '1000000000', // Very old timestamp
        },
        body: JSON.stringify({ type: 1 }),
      });

      const result = await verifyDiscordRequest(request, 'test_public_key_hex');

      expect(result).toBe(true);
    });
  });

  describe('Real-World Integration Scenarios', () => {
    it('should handle Discord PING interaction verification', async () => {
      // Real Discord PING interaction format
      mockVerifyKey.mockReturnValue(true);

      const pingPayload = {
        id: '123456789012345678',
        type: 1, // PING
        token: 'discord_interaction_token',
        version: 1,
      };

      const request = new Request('https://example.com/discord-webhook', {
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'valid_discord_signature',
          'X-Signature-Timestamp': '1640995200',
          'Content-Type': 'application/json',
          'User-Agent': 'Discord-Interactions/1.0 (+https://discord.com)',
        },
        body: JSON.stringify(pingPayload),
      });

      const result = await verifyDiscordRequest(request, 'discord_app_public_key');

      expect(result).toBe(true);
      expect(mockVerifyKey).toHaveBeenCalledWith(
        expect.any(ArrayBuffer),
        'valid_discord_signature',
        '1640995200',
        'discord_app_public_key'
      );
    });

    it('should handle Discord APPLICATION_COMMAND interaction verification', async () => {
      // Real Discord application command interaction
      mockVerifyKey.mockReturnValue(true);

      const commandPayload = {
        id: '123456789012345678',
        type: 2, // APPLICATION_COMMAND
        data: {
          id: '987654321098765432',
          name: 'register',
          options: [
            {
              name: 'tracker1',
              type: 3, // STRING
              value:
                'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198144145654/overview',
            },
          ],
        },
        guild_id: '123456789012345678',
        channel_id: '987654321098765432',
        member: {
          user: {
            id: '555666777888999000',
            username: 'testuser',
            discriminator: '1234',
          },
        },
        token: 'interaction_token_string',
        version: 1,
      };

      const request = new Request('https://example.com/discord-webhook', {
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'valid_command_signature',
          'X-Signature-Timestamp': '1640995300',
          'Content-Type': 'application/json',
          'User-Agent': 'Discord-Interactions/1.0 (+https://discord.com)',
        },
        body: JSON.stringify(commandPayload),
      });

      const result = await verifyDiscordRequest(request, 'discord_app_public_key');

      expect(result).toBe(true);
      expect(mockVerifyKey).toHaveBeenCalledWith(
        expect.any(ArrayBuffer),
        'valid_command_signature',
        '1640995300',
        'discord_app_public_key'
      );
    });
  });
});
