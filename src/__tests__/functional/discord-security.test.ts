/**
 * Functional tests for Discord signature verification
 * Tests real-world signature validation scenarios based on Discord's Ed25519 requirements
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { verifyDiscordRequest } from '../../utils/discord';

// Mock the tweetnacl module
vi.mock('tweetnacl', () => ({
  default: {
    sign: {
      detached: {
        verify: vi.fn(),
      },
    },
  },
}));

describe('Discord Signature Verification Functional Tests', () => {
  let mockNaclVerify: MockedFunction<
    (message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array) => boolean
  >;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { default: nacl } = await import('tweetnacl');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    mockNaclVerify = nacl.sign.detached.verify as MockedFunction<
      (message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array) => boolean
    >;
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // Mock implementation
    });
  });

  describe('Real Discord Request Format Validation', () => {
    it('should verify request with valid Discord headers and signature', async () => {
      // Based on research: real Discord request format
      mockNaclVerify.mockReturnValue(true);

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
      expect(mockNaclVerify).toHaveBeenCalledWith(
        expect.any(Uint8Array), // combined timestamp + body as Uint8Array
        expect.any(Uint8Array), // signature as Uint8Array
        expect.any(Uint8Array) // public key as Uint8Array
      );
    });

    it('should reject request with invalid signature', async () => {
      // Real scenario: signature verification fails
      mockNaclVerify.mockReturnValue(false);

      const request = new Request('https://example.com/discord-webhook', {
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'invalid_signature_hex',
          'X-Signature-Timestamp': '1640995200',
        },
        body: JSON.stringify({ type: 1 }),
      });

      const result = await verifyDiscordRequest(request, 'test_public_key_hex');

      expect(result).toBe(false);
      expect(mockNaclVerify).toHaveBeenCalled();
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

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Missing signature headers');
      expect(mockNaclVerify).not.toHaveBeenCalled();
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
      expect(mockNaclVerify).not.toHaveBeenCalled();
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
      expect(mockNaclVerify).not.toHaveBeenCalled();
    });
  });

  describe('Cryptographic Edge Cases', () => {
    it('should handle verification library errors gracefully', async () => {
      // Real scenario: crypto library throws error
      mockNaclVerify.mockImplementation(() => {
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
      mockNaclVerify.mockImplementation(() => {
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
      mockNaclVerify.mockReturnValue(true);

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
      expect(mockNaclVerify).toHaveBeenCalledWith(
        expect.any(Uint8Array), // combined timestamp + body
        expect.any(Uint8Array), // signature
        expect.any(Uint8Array) // public key
      );
    });

    it('should handle large request bodies', async () => {
      // Test with realistic Discord interaction payload size
      mockNaclVerify.mockReturnValue(true);

      const largePayload = {
        id: '123456789012345678',
        type: 2, // APPLICATION_COMMAND
        data: {
          id: '987654321098765432',
          name: 'register',
          options: [
            {
              name: 'tracker1',
              value:
                'https://rocketleague.tracker.network/rocket-league/profile/steam/76561198144145654/overview',
            },
            {
              name: 'tracker2',
              value:
                'https://rocketleague.tracker.network/rocket-league/profile/epic/test-player-name/overview',
            },
            {
              name: 'tracker3',
              value:
                'https://rocketleague.tracker.network/rocket-league/profile/psn/testplayer123/overview',
            },
            {
              name: 'tracker4',
              value:
                'https://rocketleague.tracker.network/rocket-league/profile/xbl/TestPlayer/overview',
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
        token: 'very_long_token_string_here_that_discord_sends_with_interactions',
        version: 1,
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
      expect(mockNaclVerify).toHaveBeenCalled();
    });
  });

  describe('Timestamp Security Considerations', () => {
    it('should accept current timestamp values', async () => {
      // Real scenario: current Unix timestamp
      mockNaclVerify.mockReturnValue(true);
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
      expect(mockNaclVerify).toHaveBeenCalledWith(
        expect.any(Uint8Array), // combined timestamp + body
        expect.any(Uint8Array), // signature
        expect.any(Uint8Array) // public key
      );
    });

    it('should handle very old timestamp values', async () => {
      // Test with old timestamp - signature verification should still work
      // (timestamp age validation would happen at higher level)
      mockNaclVerify.mockReturnValue(true);

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
      mockNaclVerify.mockReturnValue(true);

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
      expect(mockNaclVerify).toHaveBeenCalledWith(
        expect.any(Uint8Array), // combined timestamp + body
        expect.any(Uint8Array), // signature
        expect.any(Uint8Array) // public key
      );
    });

    it('should handle Discord APPLICATION_COMMAND interaction verification', async () => {
      // Real Discord application command interaction
      mockNaclVerify.mockReturnValue(true);

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
      expect(mockNaclVerify).toHaveBeenCalledWith(
        expect.any(Uint8Array), // combined timestamp + body
        expect.any(Uint8Array), // signature
        expect.any(Uint8Array) // public key
      );
    });
  });
});
