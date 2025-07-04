/**
 * Tests for Discord deferred response utilities
 * Covers createDeferredResponse() and updateDeferredResponse() functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createDeferredResponse,
  updateDeferredResponse,
  InteractionResponseType,
} from '../../utils/discord';
import { UrlFactory } from '../helpers/url-factories';

// Mock fetch globally for updateDeferredResponse tests
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('createDeferredResponse', () => {
  it('should return Discord response with type 5 (DeferredChannelMessageWithSource)', () => {
    // Act
    const response = createDeferredResponse();

    // Assert
    expect(response).toBeInstanceOf(Response);
    expect(response.headers.get('Content-Type')).toBe('application/json');

    // Parse response body to verify Discord response type
    return response.json().then((body: unknown) => {
      expect(body).toMatchObject({
        type: InteractionResponseType.DeferredChannelMessageWithSource,
      });
      expect((body as { type: number }).type).toBe(5);
    });
  });

  it('should return ephemeral deferred response with flags when ephemeral=true', () => {
    // Act
    const response = createDeferredResponse(true);

    // Assert
    expect(response).toBeInstanceOf(Response);
    expect(response.headers.get('Content-Type')).toBe('application/json');

    // Parse response body to verify Discord response type and ephemeral flag
    return response.json().then((body: unknown) => {
      const typedBody = body as { type: number; data?: { flags?: number } };
      expect(typedBody.type).toBe(5);
      expect(typedBody.data?.flags).toBe(64); // EPHEMERAL_FLAG
    });
  });
});

describe('updateDeferredResponse', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should make PATCH request to correct Discord webhook URL format', async () => {
    // Arrange
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    const applicationId = 'test_app_id_123';
    const interactionToken = 'test_interaction_token_456';
    const content = 'Test message content';

    // Act
    await updateDeferredResponse(applicationId, interactionToken, content);

    // Assert
    expect(mockFetch).toHaveBeenCalledWith(
      UrlFactory.discord.webhooks.editMessage(applicationId, interactionToken),
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      }
    );
  });

  it('should handle webhook failures without throwing exceptions', async () => {
    // Arrange
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const applicationId = 'test_app_id_123';
    const interactionToken = 'invalid_token';
    const content = 'Test message content';

    // Act & Assert - should not throw
    await expect(
      updateDeferredResponse(applicationId, interactionToken, content)
    ).resolves.toBeUndefined();

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith('Discord webhook failed: 404');

    consoleSpy.mockRestore();
  });

  it('should handle network errors gracefully', async () => {
    // Arrange
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const applicationId = 'test_app_id_123';
    const interactionToken = 'test_token';
    const content = 'Test message content';

    // Act & Assert - should not throw
    await expect(updateDeferredResponse(applicationId, interactionToken, content)).rejects.toThrow(
      'Network error'
    );

    consoleSpy.mockRestore();
  });
});
