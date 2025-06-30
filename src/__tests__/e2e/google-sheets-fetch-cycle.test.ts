/**
 * E2E Google Sheets Test using direct fetch calls
 * Alternative approach that calls the running development server directly
 * Similar to the manual curl testing but automated
 */

import { describe, it, expect, beforeAll } from 'vitest';

// Test configuration
const TEST_SERVER_URL = 'http://localhost:8787';
const TEST_TIMEOUT = 30000;

describe('Google Sheets E2E with Direct Fetch', () => {
  let testDiscordId: string;

  beforeAll(() => {
    testDiscordId = `test-fetch-e2e-${Date.now()}`;
  });

  it(
    'should perform complete lifecycle using direct fetch calls',
    async () => {
      // Helper function to make requests to the test server
      async function callTestEndpoint(endpoint: string, data: unknown = {}) {
        const response = await fetch(`${TEST_SERVER_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        expect(response.status).toBe(200);
        return await response.json();
      }

      // === STEP 1: Initial READ ===
      console.log('🔍 STEP 1: Reading initial state...');

      const initialData = (await callTestEndpoint('/test-sheets-read')) as {
        success: boolean;
        values: string[][];
        totalRows: number;
      };

      expect(initialData.success).toBe(true);
      const initialRowCount = initialData.totalRows;
      console.log(`✅ Initial row count: ${initialRowCount}`);

      // === STEP 2: WRITE ===
      console.log('📝 STEP 2: Writing new test row...');

      const testData = {
        discord_id: testDiscordId,
        discord_username_display: 'Fetch E2E Test User',
        discord_username_actual: 'fetchtest',
        server_join_date: new Date().toISOString(),
        is_banned: false,
        is_active: true,
      };

      const writeResult = (await callTestEndpoint('/test-sheets-write', { testData })) as {
        success: boolean;
        rowsWritten: number;
        testData: string[];
      };

      expect(writeResult.success).toBe(true);
      expect(writeResult.rowsWritten).toBe(1);
      expect(writeResult.testData[0]).toBe(testDiscordId);
      console.log(`✅ Successfully wrote row: ${writeResult.testData.join(', ')}`);

      // === STEP 3: VERIFY WRITE ===
      console.log('🔍 STEP 3: Verifying write operation...');

      const verifyWriteData = (await callTestEndpoint('/test-sheets-read')) as {
        success: boolean;
        values: string[][];
        totalRows: number;
      };

      expect(verifyWriteData.success).toBe(true);
      expect(verifyWriteData.totalRows).toBe(initialRowCount + 1);

      const testRowExists = verifyWriteData.values.some(row => row[0] === testDiscordId);
      expect(testRowExists).toBe(true);
      console.log(`✅ Verified row was added. New total: ${verifyWriteData.totalRows}`);

      // === STEP 4: DELETE ===
      console.log('🗑️ STEP 4: Deleting test row...');

      const deleteResult = (await callTestEndpoint('/test-sheets-delete', {
        discordId: testDiscordId,
      })) as {
        success: boolean;
        deletedRowsCount: number;
        discordId: string;
      };

      expect(deleteResult.success).toBe(true);
      expect(deleteResult.deletedRowsCount).toBe(1);
      expect(deleteResult.discordId).toBe(testDiscordId);
      console.log(`✅ Successfully deleted ${deleteResult.deletedRowsCount} row(s)`);

      // === STEP 5: VERIFY DELETE ===
      console.log('🔍 STEP 5: Verifying delete operation...');

      const verifyDeleteData = (await callTestEndpoint('/test-sheets-read')) as {
        success: boolean;
        values: string[][];
        totalRows: number;
      };

      expect(verifyDeleteData.success).toBe(true);
      expect(verifyDeleteData.totalRows).toBe(initialRowCount);

      const testRowStillExists = verifyDeleteData.values.some(row => row[0] === testDiscordId);
      expect(testRowStillExists).toBe(false);
      console.log(`✅ Verified row was deleted. Final total: ${verifyDeleteData.totalRows}`);

      // === SUMMARY ===
      console.log('\n🎉 FETCH E2E TEST SUMMARY:');
      console.log(`   Initial rows: ${initialRowCount}`);
      console.log(`   After write:  ${initialRowCount + 1}`);
      console.log(`   After delete: ${initialRowCount}`);
      console.log(`   Test ID used: ${testDiscordId}`);
      console.log('   ✅ Full lifecycle test PASSED');
    },
    TEST_TIMEOUT
  );

  it(
    'should verify idempotent operations',
    async () => {
      console.log('🔄 Testing idempotent operations...');

      // Generate unique ID for this test
      const idempotentTestId = `test-idempotent-${Date.now()}`;

      // Helper function
      async function callEndpoint(endpoint: string, data: unknown = {}) {
        const response = await fetch(`${TEST_SERVER_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        return await response.json();
      }

      try {
        // Write test data
        const testData = {
          discord_id: idempotentTestId,
          discord_username_display: 'Idempotent Test',
          discord_username_actual: 'idempotenttest',
          server_join_date: new Date().toISOString(),
          is_banned: false,
          is_active: true,
        };

        await callEndpoint('/test-sheets-write', { testData });

        // Try to delete the same ID multiple times
        const delete1 = await callEndpoint('/test-sheets-delete', { discordId: idempotentTestId });
        const delete2 = await callEndpoint('/test-sheets-delete', { discordId: idempotentTestId });

        expect(delete1.success).toBe(true);
        expect(delete1.deletedRowsCount).toBe(1);

        expect(delete2.success).toBe(true);
        expect(delete2.deletedRowsCount).toBe(0); // Should be 0 since row already deleted

        console.log('✅ Idempotent delete operations work correctly');
      } catch (error) {
        console.error('❌ Idempotent test failed:', error);
        throw error;
      }
    },
    TEST_TIMEOUT
  );
});
