/**
 * Debug test to see what environment variables are available in Workers environment
 */

import { describe, it, expect } from 'vitest';
import { SELF } from 'cloudflare:test';

describe('Environment Debug', () => {
  it('should show available environment variables', async () => {
    const response = await SELF.fetch('http://localhost/debug-env', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 1 }), // PING type
    });

    expect(response.status).toBe(200);
  });
});
