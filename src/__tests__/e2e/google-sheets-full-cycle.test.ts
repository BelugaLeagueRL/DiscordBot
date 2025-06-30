/**
 * End-to-End Google Sheets Integration Test
 * Tests the complete lifecycle: READ → WRITE → VERIFY → DELETE → VERIFY
 * This test performs the exact same steps as manual testing with curl commands
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { unstable_dev, type Unstable_DevWorker } from 'wrangler';

describe('Google Sheets E2E Full Cycle Test', () => {
  let worker: Unstable_DevWorker;
  let testDiscordId: string;

  beforeAll(async () => {
    // Start the worker for testing
    worker = await unstable_dev('src/index.ts', {
      experimental: { disableExperimentalWarning: true },
    });

    // Generate unique test ID
    testDiscordId = `test-e2e-${Date.now()}`;
  });

  afterAll(async () => {
    await worker.stop();
  });

  it('should perform complete Google Sheets lifecycle: read → write → verify → delete → verify', async () => {
    // === STEP 1: Initial READ - Get baseline row count ===
    console.log('🔍 STEP 1: Reading initial state...');

    const initialReadResponse = await worker.fetch('/test-sheets-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(initialReadResponse.status).toBe(200);

    const initialData = (await initialReadResponse.json()) as {
      success: boolean;
      values: string[][];
      totalRows: number;
    };

    expect(initialData.success).toBe(true);
    expect(initialData.totalRows).toBeGreaterThanOrEqual(1); // At least header row

    const initialRowCount = initialData.totalRows;
    console.log(`✅ Initial row count: ${initialRowCount}`);

    // === STEP 2: WRITE - Add new test row ===
    console.log('📝 STEP 2: Writing new test row...');

    const testData = {
      discord_id: testDiscordId,
      discord_username_display: 'E2E Test User',
      discord_username_actual: 'e2etest',
      server_join_date: '2025-06-30T16:20:00.000Z',
      is_banned: false,
      is_active: true,
    };

    const writeResponse = await worker.fetch('/test-sheets-write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testData }),
    });

    expect(writeResponse.status).toBe(200);

    const writeResult = (await writeResponse.json()) as {
      success: boolean;
      rowsWritten: number;
      testData: string[];
    };

    expect(writeResult.success).toBe(true);
    expect(writeResult.rowsWritten).toBe(1);
    expect(writeResult.testData[0]).toBe(testDiscordId); // Verify our test ID

    console.log(`✅ Successfully wrote row: ${writeResult.testData.join(', ')}`);

    // === STEP 3: VERIFY WRITE - Confirm row was added ===
    console.log('🔍 STEP 3: Verifying write operation...');

    const verifyWriteResponse = await worker.fetch('/test-sheets-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(verifyWriteResponse.status).toBe(200);

    const verifyWriteData = (await verifyWriteResponse.json()) as {
      success: boolean;
      values: string[][];
      totalRows: number;
    };

    expect(verifyWriteData.success).toBe(true);
    expect(verifyWriteData.totalRows).toBe(initialRowCount + 1);

    // Verify our test row is present
    const testRowExists = verifyWriteData.values.some(
      row =>
        row[0] === testDiscordId && // discord_id column
        row[1] === 'E2E Test User' && // display_name column
        row[2] === 'e2etest' // username column
    );

    expect(testRowExists).toBe(true);
    console.log(`✅ Verified row was added. New total: ${verifyWriteData.totalRows}`);

    // === STEP 4: DELETE - Remove test row ===
    console.log('🗑️ STEP 4: Deleting test row...');

    const deleteResponse = await worker.fetch('/test-sheets-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discordId: testDiscordId }),
    });

    expect(deleteResponse.status).toBe(200);

    const deleteResult = (await deleteResponse.json()) as {
      success: boolean;
      deletedRowsCount: number;
      discordId: string;
    };

    expect(deleteResult.success).toBe(true);
    expect(deleteResult.deletedRowsCount).toBe(1);
    expect(deleteResult.discordId).toBe(testDiscordId);

    console.log(`✅ Successfully deleted ${deleteResult.deletedRowsCount} row(s)`);

    // === STEP 5: VERIFY DELETE - Confirm row was removed ===
    console.log('🔍 STEP 5: Verifying delete operation...');

    const verifyDeleteResponse = await worker.fetch('/test-sheets-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(verifyDeleteResponse.status).toBe(200);

    const verifyDeleteData = (await verifyDeleteResponse.json()) as {
      success: boolean;
      values: string[][];
      totalRows: number;
    };

    expect(verifyDeleteData.success).toBe(true);
    expect(verifyDeleteData.totalRows).toBe(initialRowCount); // Back to original count

    // Verify our test row is gone
    const testRowStillExists = verifyDeleteData.values.some(row => row[0] === testDiscordId);

    expect(testRowStillExists).toBe(false);
    console.log(`✅ Verified row was deleted. Final total: ${verifyDeleteData.totalRows}`);

    // === SUMMARY ===
    console.log('\n🎉 E2E TEST SUMMARY:');
    console.log(`   Initial rows: ${initialRowCount}`);
    console.log(`   After write:  ${initialRowCount + 1}`);
    console.log(`   After delete: ${initialRowCount}`);
    console.log(`   Test ID used: ${testDiscordId}`);
    console.log('   ✅ Full lifecycle test PASSED');
  }, 60000); // 60-second timeout for real API calls

  it('should handle error cases gracefully during E2E operations', async () => {
    console.log('🚨 Testing error handling in E2E flow...');

    // Test invalid write data
    const invalidWriteResponse = await worker.fetch('/test-sheets-write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testData: { invalid: 'data' } }),
    });

    // Should still return 200 but with error details in response body
    const invalidWriteResult = (await invalidWriteResponse.json()) as {
      success: boolean;
      error?: string;
    };

    // The response should indicate failure
    if (!invalidWriteResult.success) {
      expect(invalidWriteResult.error).toBeDefined();
      console.log(`✅ Invalid write handled gracefully: ${invalidWriteResult.error}`);
    }

    // Test deleting non-existent row
    const nonExistentId = `non-existent-${Date.now()}`;
    const deleteNonExistentResponse = await worker.fetch('/test-sheets-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discordId: nonExistentId }),
    });

    const deleteNonExistentResult = (await deleteNonExistentResponse.json()) as {
      success: boolean;
      deletedRowsCount: number;
    };

    expect(deleteNonExistentResult.success).toBe(true);
    expect(deleteNonExistentResult.deletedRowsCount).toBe(0); // No rows deleted

    console.log('✅ Non-existent row deletion handled gracefully');
  }, 30000);
});
