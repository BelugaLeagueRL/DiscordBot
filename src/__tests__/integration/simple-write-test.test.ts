/**
 * Simple test: Write one row to Google Sheets and verify it was written
 */

import { describe, it, expect } from 'vitest';
import { SELF } from 'cloudflare:test';

describe('Simple Google Sheets Write Test', () => {
  it('should write one row to Google Sheets and clean up after itself', async () => {
    const testDiscordId = `test-cleanup-${String(Date.now())}`;

    // Call a test endpoint that writes to Google Sheets
    const response = await SELF.fetch('http://localhost/test-sheets-write', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        testData: {
          discord_id: testDiscordId,
          discord_username_display: 'Test User (Cleanup)',
          discord_username_actual: 'testuser',
          server_join_date: '2023-12-01T10:00:00.000Z',
          is_banned: false,
          is_active: true,
        },
      }),
    });

    const result = (await response.json()) as {
      success: boolean;
      rowsWritten: number;
      testData: string[];
    };
    console.log('Test write result:', result);

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.rowsWritten).toBe(1);

    console.log('✅ Successfully wrote test row to Google Sheets:', result.testData);

    // Now test cleanup by deleting the test row
    const cleanupResponse = await SELF.fetch('http://localhost/test-sheets-delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        discordId: testDiscordId,
      }),
    });

    const cleanupResult = (await cleanupResponse.json()) as {
      success: boolean;
      deletedRowsCount: number;
    };
    console.log('Test cleanup result:', cleanupResult);

    expect(cleanupResponse.status).toBe(200);
    expect(cleanupResult.success).toBe(true);
    expect(cleanupResult.deletedRowsCount).toBe(1);

    console.log('🧹 Successfully cleaned up test data from Google Sheets');
  }, 30000);
});
