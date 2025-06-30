/**
 * Integration Test: Google Sheets Operations
 *
 * Tests the integration between Google Sheets API calls and data transformation
 * Uses controlled mocking to test specific operation scenarios
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GoogleSheetsApiBuilder,
  GoogleOAuthBuilder,
  createMemberRow,
} from '../../utils/google-sheets-builder';
import type { GoogleSheetsCredentials } from '../../utils/google-sheets-builder';

describe('Integration: Google Sheets Operations', () => {
  let mockCredentials: GoogleSheetsCredentials;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCredentials = {
      private_key: '-----BEGIN PRIVATE KEY-----\nMOCK_KEY\n-----END PRIVATE KEY-----',
      client_email: 'test@test-project.iam.gserviceaccount.com',
    };

    // Mock fetch globally
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
  });

  it('should integrate OAuth authentication with Sheets API calls', async () => {
    console.log('🧪 Testing OAuth → Sheets API integration...');

    // Mock OAuth token response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          access_token: 'mock-access-token-123',
          token_type: 'Bearer',
          expires_in: 3599,
        }),
    });

    // Mock Sheets API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          values: [
            [
              'discord_id',
              'display_name',
              'username',
              'join_date',
              'banned',
              'active',
              'last_updated',
            ],
            [
              'existing-user-1',
              'User One',
              'user1',
              '2023-01-01',
              'false',
              'true',
              '2023-01-01T00:00:00Z',
            ],
          ],
        }),
    });

    // Step 1: Get OAuth token
    const accessToken = await GoogleOAuthBuilder.create()
      .setCredentials(mockCredentials)
      .getAccessToken();

    expect(accessToken).toBe('mock-access-token-123');

    // Step 2: Use token in Sheets API call
    const result = await GoogleSheetsApiBuilder.create()
      .setSpreadsheetId('test-sheet-id')
      .setRange('A:G')
      .setAccessToken(accessToken)
      .get();

    expect(result.success).toBe(true);
    expect(result.values).toHaveLength(2); // Header + 1 data row

    // Verify OAuth call was made first
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      'https://accounts.google.com/o/oauth2/token',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    );

    // Verify Sheets API call used the token
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'https://sheets.googleapis.com/v4/spreadsheets/test-sheet-id/values/A%3AG',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-access-token-123',
        }),
      })
    );

    console.log('✅ OAuth → Sheets API integration working');
  });

  it('should integrate data transformation with Sheets API write', async () => {
    console.log('🧪 Testing data transformation → write integration...');

    // Mock OAuth response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ access_token: 'mock-token' }),
    });

    // Mock Sheets append response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          updates: {
            updatedRows: 2,
            updatedColumns: 7,
            updatedCells: 14,
          },
        }),
    });

    const accessToken = await GoogleOAuthBuilder.create()
      .setCredentials(mockCredentials)
      .getAccessToken();

    // Create member rows using data transformation
    const memberRow1 = createMemberRow({
      discord_id: 'user-123',
      discord_username_display: 'Test User',
      discord_username_actual: 'testuser',
      server_join_date: '2023-12-01T10:00:00.000Z',
      is_banned: false,
      is_active: true,
    });

    const memberRow2 = createMemberRow({
      discord_id: 'user-456',
      discord_username_display: 'Another User',
      discord_username_actual: 'anotheruser',
      server_join_date: '2023-12-02T11:00:00.000Z',
      is_banned: true,
      is_active: false,
    });

    // Write multiple rows using the builder
    const result = await GoogleSheetsApiBuilder.create()
      .setSpreadsheetId('test-sheet-id')
      .setRange('A:G')
      .setAccessToken(accessToken)
      .addRow(memberRow1)
      .addRow(memberRow2)
      .append();

    expect(result.success).toBe(true);
    expect(result.updatedRows).toBe(2);

    // Verify the data transformation was applied correctly
    const appendCall = mockFetch.mock.calls[1];
    const requestBody = JSON.parse(appendCall[1].body as string);

    expect(requestBody.values).toHaveLength(2);

    // Check first row transformation
    expect(requestBody.values[0][0]).toBe('user-123'); // discord_id
    expect(requestBody.values[0][1]).toBe('Test User'); // display_name
    expect(requestBody.values[0][4]).toBe('false'); // is_banned (boolean → string)
    expect(requestBody.values[0][5]).toBe('true'); // is_active (boolean → string)
    expect(requestBody.values[0][6]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // last_updated timestamp

    // Check second row transformation
    expect(requestBody.values[1][0]).toBe('user-456');
    expect(requestBody.values[1][4]).toBe('true'); // is_banned
    expect(requestBody.values[1][5]).toBe('false'); // is_active

    console.log('✅ Data transformation → write integration working');
  });

  it('should integrate read → filter → write operations', async () => {
    console.log('🧪 Testing read → filter → write integration...');

    // Mock OAuth (called multiple times)
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'mock-token-1' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            values: [['discord_id'], ['existing-user-1'], ['existing-user-2']],
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'mock-token-2' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            updates: { updatedRows: 1, updatedColumns: 7, updatedCells: 7 },
          }),
      });

    // Step 1: Read existing users
    const readToken = await GoogleOAuthBuilder.create()
      .setCredentials(mockCredentials)
      .getAccessToken();

    const existingUsers = await GoogleSheetsApiBuilder.create()
      .setSpreadsheetId('test-sheet-id')
      .setRange('A:A')
      .setAccessToken(readToken)
      .get();

    expect(existingUsers.success).toBe(true);

    // Step 2: Filter new users (simulate Discord API data)
    const discordUsers = [
      { id: 'existing-user-1', username: 'user1' }, // Should be filtered out
      { id: 'new-user-3', username: 'newuser3' }, // Should be added
    ];

    const existingUserIds = new Set(existingUsers.values?.slice(1).map(row => row[0]) || []);

    const newUsers = discordUsers.filter(user => !existingUserIds.has(user.id));

    expect(newUsers).toHaveLength(1);
    expect(newUsers[0].id).toBe('new-user-3');

    // Step 3: Write only new users
    const writeToken = await GoogleOAuthBuilder.create()
      .setCredentials(mockCredentials)
      .getAccessToken();

    const newMemberRows = newUsers.map(user =>
      createMemberRow({
        discord_id: user.id,
        discord_username_display: user.username,
        discord_username_actual: user.username,
        server_join_date: new Date().toISOString(),
        is_banned: false,
        is_active: true,
      })
    );

    let builder = GoogleSheetsApiBuilder.create()
      .setSpreadsheetId('test-sheet-id')
      .setRange('A:G')
      .setAccessToken(writeToken);

    newMemberRows.forEach(row => {
      builder = builder.addRow(row);
    });

    const writeResult = await builder.append();

    expect(writeResult.success).toBe(true);
    expect(writeResult.updatedRows).toBe(1);

    // Verify the filtering logic worked
    const finalWriteCall = mockFetch.mock.calls[3];
    const finalRequestBody = JSON.parse(finalWriteCall[1].body as string);

    expect(finalRequestBody.values).toHaveLength(1);
    expect(finalRequestBody.values[0][0]).toBe('new-user-3');

    console.log('✅ Read → filter → write integration working');
  });

  it('should integrate error handling across OAuth and Sheets operations', async () => {
    console.log('🧪 Testing error handling integration...');

    // Mock OAuth failure
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: () => Promise.resolve({ error: 'invalid_grant' }),
    });

    // OAuth should fail
    await expect(
      GoogleOAuthBuilder.create().setCredentials(mockCredentials).getAccessToken()
    ).rejects.toThrow('Failed to get access token: 400 Bad Request');

    // Reset for Sheets API error test
    mockFetch.mockClear();

    // Mock successful OAuth but failed Sheets call
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'valid-token' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'Sheet not found' }),
      });

    const accessToken = await GoogleOAuthBuilder.create()
      .setCredentials(mockCredentials)
      .getAccessToken();

    // Sheets API should fail
    const result = await GoogleSheetsApiBuilder.create()
      .setSpreadsheetId('nonexistent-sheet')
      .setRange('A:G')
      .setAccessToken(accessToken)
      .get();

    expect(result.success).toBe(false);
    expect(result.error).toContain('404');

    console.log('✅ Error handling integration working');
  });
});
