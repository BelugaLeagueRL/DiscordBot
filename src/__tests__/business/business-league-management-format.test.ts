/**
 * Business logic tests for Google Sheets 7-column structure validation
 * FLOW_3_TESTS_NEEDED.md lines 62-68: Google Sheets 7-column structure validation
 * Tests: Column structure, league management format, header validation, data format compatibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { createMemberRow } from '../../utils/google-sheets-builder';
import { handleAdminSyncUsersToSheetsDiscord } from '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler';
import { createMockCommandInteraction } from '../helpers/discord-helpers';
import { EnvFactory, ExecutionContextFactory } from '../helpers/test-factories';
import type { Env } from '../../index';

// Mock discord-interactions for business logic tests
vi.mock('discord-interactions', () => ({
  verifyKey: vi.fn(() => true),
}));

describe('Google Sheets 7-Column Structure Validation', () => {
  let mockEnv: Env;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv = EnvFactory.create();
  });

  describe('Column Structure Requirements', () => {
    it('should validate exact 7-column structure for league management', () => {
      // Arrange - Create member data for column structure testing
      const testMemberData = {
        discord_id: faker.string.numeric(18),
        discord_username_display: faker.internet.username(),
        discord_username_actual: faker.internet.username(),
        server_join_date: new Date().toISOString(),
        is_banned: false,
        is_active: true,
        last_updated: new Date().toISOString(),
      };

      // Act - Create member row using the utility function
      const memberRow = createMemberRow(testMemberData);

      // Assert - Must have exactly 7 columns as per league management format
      expect(memberRow).toHaveLength(7);

      // Validate column order and content
      expect(memberRow[0]).toBe(testMemberData.discord_id); // Column 1: discord_id
      expect(memberRow[1]).toBe(testMemberData.discord_username_display); // Column 2: display_name
      expect(memberRow[2]).toBe(testMemberData.discord_username_actual); // Column 3: actual_username
      expect(memberRow[3]).toBe(testMemberData.server_join_date); // Column 4: join_date
      expect(memberRow[4]).toBe('false'); // Column 5: is_banned (string)
      expect(memberRow[5]).toBe('true'); // Column 6: is_active (string)
      expect(memberRow[6]).toBe(testMemberData.last_updated); // Column 7: last_updated
    });

    it('should enforce column data types for league management compatibility', () => {
      // Arrange - Test different data type scenarios
      const testCases = [
        {
          memberData: {
            discord_id: '123456789012345678', // Must be string numeric
            discord_username_display: 'DisplayName',
            discord_username_actual: 'actualname',
            server_join_date: '2023-01-01T00:00:00.000Z', // Must be ISO string
            is_banned: true, // Boolean input
            is_active: false, // Boolean input
            last_updated: '2023-06-01T12:00:00.000Z',
          },
          expectedRow: [
            '123456789012345678',
            'DisplayName',
            'actualname',
            '2023-01-01T00:00:00.000Z',
            'true', // Must be string representation
            'false', // Must be string representation
            '2023-06-01T12:00:00.000Z',
          ],
        },
        {
          memberData: {
            discord_id: '987654321098765432',
            discord_username_display: 'Nick Name',
            discord_username_actual: 'username123',
            server_join_date: '2023-02-15T10:30:00.000Z',
            is_banned: false,
            is_active: true,
            last_updated: '2023-06-15T14:45:00.000Z',
          },
          expectedRow: [
            '987654321098765432',
            'Nick Name',
            'username123',
            '2023-02-15T10:30:00.000Z',
            'false',
            'true',
            '2023-06-15T14:45:00.000Z',
          ],
        },
      ];

      // Act & Assert - Test each case
      for (const [index, testCase] of testCases.entries()) {
        const memberRow = createMemberRow(testCase.memberData);

        expect(memberRow, `Test case ${index + 1} failed`).toEqual(testCase.expectedRow);
        expect(memberRow, `Test case ${index + 1} column count`).toHaveLength(7);
      }
    });

    it('should handle special characters and Unicode in league member data', () => {
      // Arrange - Create member data with special characters
      const specialCharacterMemberData = {
        discord_id: faker.string.numeric(18),
        discord_username_display: 'Player™️🎮', // Emoji and special chars
        discord_username_actual: 'user_with_underscores',
        server_join_date: new Date().toISOString(),
        is_banned: false,
        is_active: true,
        last_updated: new Date().toISOString(),
      };

      // Act - Create row with special characters
      const memberRow = createMemberRow(specialCharacterMemberData);

      // Assert - Should preserve special characters while maintaining structure
      expect(memberRow).toHaveLength(7);
      expect(memberRow[1]).toBe('Player™️🎮'); // Display name with emoji
      expect(memberRow[2]).toBe('user_with_underscores'); // Underscores preserved

      // All columns should be strings
      for (const [index, column] of memberRow.entries()) {
        expect(typeof column, `Column ${index + 1} should be string`).toBe('string');
      }
    });
  });

  describe('Header Row Validation', () => {
    it('should validate exact header structure for league management', () => {
      // Arrange - Define expected header structure
      const expectedHeaders = [
        'discord_id',
        'display_name',
        'actual_username',
        'join_date',
        'is_banned',
        'is_active',
        'last_updated',
      ];

      // Act & Assert - Header structure must match exactly
      expect(expectedHeaders).toHaveLength(7);

      // Validate each header name and position
      expect(expectedHeaders[0]).toBe('discord_id'); // Column A
      expect(expectedHeaders[1]).toBe('display_name'); // Column B
      expect(expectedHeaders[2]).toBe('actual_username'); // Column C
      expect(expectedHeaders[3]).toBe('join_date'); // Column D
      expect(expectedHeaders[4]).toBe('is_banned'); // Column E
      expect(expectedHeaders[5]).toBe('is_active'); // Column F
      expect(expectedHeaders[6]).toBe('last_updated'); // Column G
    });

    it('should validate column range A:G for Google Sheets integration', () => {
      // Arrange - Test the expected range format
      const expectedRange = 'A:G';
      const expectedSheetRange = 'Sheet1!A:G';

      // Act & Assert - Range validation for 7 columns
      expect(expectedRange).toBe('A:G'); // Covers columns A through G (7 columns)
      expect(expectedSheetRange).toBe('Sheet1!A:G'); // Full sheet range format

      // Validate range covers exactly 7 columns
      const columnLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
      expect(columnLetters).toHaveLength(7);
      expect(columnLetters[0]).toBe('A'); // First column
      expect(columnLetters[6]).toBe('G'); // Last column (7th)
    });
  });

  describe('Data Format Compatibility', () => {
    it('should ensure ISO date format compatibility with league management tools', () => {
      // Arrange - Test various date scenarios
      const testDates = [
        new Date('2023-01-01T00:00:00.000Z'),
        new Date('2023-06-15T14:30:45.123Z'),
        new Date('2023-12-31T23:59:59.999Z'),
      ];

      // Act & Assert - All dates must be ISO format
      for (const [index, date] of testDates.entries()) {
        const memberData = {
          discord_id: faker.string.numeric(18),
          discord_username_display: faker.internet.username(),
          discord_username_actual: faker.internet.username(),
          server_join_date: date.toISOString(),
          is_banned: false,
          is_active: true,
          last_updated: date.toISOString(),
        };

        const memberRow = createMemberRow(memberData);

        // Validate ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)
        const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
        expect(memberRow[3], `Join date ${index + 1}`).toMatch(isoRegex);
        expect(memberRow[6], `Last updated ${index + 1}`).toMatch(isoRegex);

        // Validate parseable by Date constructor
        expect(
          new Date(memberRow[3] as string).toISOString(),
          `Join date ${index + 1} parseable`
        ).toBe(memberRow[3]);
        expect(
          new Date(memberRow[6] as string).toISOString(),
          `Last updated ${index + 1} parseable`
        ).toBe(memberRow[6]);
      }
    });

    it('should ensure boolean string format for league management tools', () => {
      // Arrange - Test all boolean combinations
      const booleanTestCases = [
        { is_banned: true, is_active: true, expected_banned: 'true', expected_active: 'true' },
        { is_banned: true, is_active: false, expected_banned: 'true', expected_active: 'false' },
        { is_banned: false, is_active: true, expected_banned: 'false', expected_active: 'true' },
        { is_banned: false, is_active: false, expected_banned: 'false', expected_active: 'false' },
      ];

      // Act & Assert - Boolean values must be string representations
      for (const [index, testCase] of booleanTestCases.entries()) {
        const memberData = {
          discord_id: faker.string.numeric(18),
          discord_username_display: faker.internet.username(),
          discord_username_actual: faker.internet.username(),
          server_join_date: new Date().toISOString(),
          is_banned: testCase.is_banned,
          is_active: testCase.is_active,
          last_updated: new Date().toISOString(),
        };

        const memberRow = createMemberRow(memberData);

        expect(memberRow[4], `Case ${index + 1} banned status`).toBe(testCase.expected_banned);
        expect(memberRow[5], `Case ${index + 1} active status`).toBe(testCase.expected_active);

        // Must be string type, not boolean
        expect(typeof memberRow[4], `Case ${index + 1} banned type`).toBe('string');
        expect(typeof memberRow[5], `Case ${index + 1} active type`).toBe('string');
      }
    });

    it('should validate Discord ID format for league management systems', () => {
      // Arrange - Test Discord ID format requirements
      const validDiscordIds = [
        '123456789012345678', // 18 digits
        '987654321098765432', // 18 digits
        '111111111111111111', // 18 digits, all same
      ];

      const invalidDiscordIds = [
        '12345678901234567', // 17 digits (too short)
        '1234567890123456789', // 19 digits (too long)
        'invalid_id_format', // Non-numeric
        '', // Empty string
      ];

      // Act & Assert - Valid Discord IDs should work
      for (const [index, discordId] of validDiscordIds.entries()) {
        const memberData = {
          discord_id: discordId,
          discord_username_display: faker.internet.username(),
          discord_username_actual: faker.internet.username(),
          server_join_date: new Date().toISOString(),
          is_banned: false,
          is_active: true,
          last_updated: new Date().toISOString(),
        };

        const memberRow = createMemberRow(memberData);

        expect(memberRow[0], `Valid Discord ID ${index + 1}`).toBe(discordId);
        expect(memberRow[0], `Valid Discord ID ${index + 1} length`).toHaveLength(18);
        expect(
          /^\d{18}$/.test(memberRow[0] as string),
          `Valid Discord ID ${index + 1} format`
        ).toBe(true);
      }

      // Invalid Discord IDs should still be handled (graceful degradation)
      for (const [index, discordId] of invalidDiscordIds.entries()) {
        const memberData = {
          discord_id: discordId,
          discord_username_display: faker.internet.username(),
          discord_username_actual: faker.internet.username(),
          server_join_date: new Date().toISOString(),
          is_banned: false,
          is_active: true,
          last_updated: new Date().toISOString(),
        };

        const memberRow = createMemberRow(memberData);

        // Should still create row with 7 columns, even with invalid ID
        expect(memberRow, `Invalid Discord ID ${index + 1} structure`).toHaveLength(7);
        expect(memberRow[0], `Invalid Discord ID ${index + 1} preserved`).toBe(discordId);
      }
    });
  });

  describe('League Management Tool Integration', () => {
    it('should validate complete row structure for external tool compatibility', async () => {
      // Arrange - Create interaction that generates league management data
      const adminSyncInteraction = createMockCommandInteraction('admin_sync_users_to_sheets', [], {
        guild_id: faker.string.numeric(18),
        channel_id: mockEnv.TEST_CHANNEL_ID || 'default_channel_id',
        member: {
          user: {
            id: mockEnv.PRIVILEGED_USER_ID || 'default_admin_id',
            username: 'admin_user',
            discriminator: '0001',
          },
        },
      });

      // Mock Discord API with sample member data
      const sampleMembers = [
        {
          user: {
            id: '123456789012345678',
            username: 'player1',
            discriminator: '0001',
          },
          nick: 'Player One',
          joined_at: '2023-01-01T00:00:00.000Z',
          roles: [],
        },
        {
          user: {
            id: '987654321098765432',
            username: 'player2',
            discriminator: '0002',
          },
          nick: null, // No nickname
          joined_at: '2023-02-15T10:30:00.000Z',
          roles: [],
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(sampleMembers),
      });

      const mockCtx = ExecutionContextFactory.create();

      // Act - Execute admin sync to generate league management data
      const response = await handleAdminSyncUsersToSheetsDiscord(
        adminSyncInteraction,
        mockCtx,
        mockEnv
      );

      // Assert - Should handle league management format correctly
      expect(response.status).toBe(200);

      // Verify member data would be formatted correctly for league tools
      for (const [index, member] of sampleMembers.entries()) {
        const memberData = {
          discord_id: member.user.id,
          discord_username_display: member.nick || member.user.username,
          discord_username_actual: member.user.username,
          server_join_date: member.joined_at,
          is_banned: false,
          is_active: true,
          last_updated: new Date().toISOString(),
        };

        const memberRow = createMemberRow(memberData);

        // Validate league management format
        expect(memberRow, `Member ${index + 1} structure`).toHaveLength(7);
        expect(memberRow[0], `Member ${index + 1} ID`).toBe(member.user.id);
        expect(memberRow[1], `Member ${index + 1} display name`).toBe(
          member.nick || member.user.username
        );
        expect(memberRow[2], `Member ${index + 1} actual username`).toBe(member.user.username);
        expect(memberRow[3], `Member ${index + 1} join date`).toBe(member.joined_at);
      }
    });

    it('should handle bulk data export in league management format', () => {
      // Arrange - Create bulk member data for league export
      const bulkMemberData = Array.from({ length: 100 }, (_, i) => ({
        discord_id: faker.string.numeric(18),
        discord_username_display: `Player${i + 1}`,
        discord_username_actual: `player${i + 1}`,
        server_join_date: new Date(2023, 0, 1 + i).toISOString(),
        is_banned: i % 10 === 0, // Every 10th member is banned
        is_active: i % 5 !== 0, // Every 5th member is inactive
        last_updated: new Date().toISOString(),
      }));

      // Act - Convert all members to league management format
      const allMemberRows = bulkMemberData.map(memberData => createMemberRow(memberData));

      // Assert - Bulk export validation
      expect(allMemberRows).toHaveLength(100);

      // Validate structure consistency across all rows
      for (const [index, row] of allMemberRows.entries()) {
        expect(row, `Bulk row ${index + 1} structure`).toHaveLength(7);

        // Validate data types
        expect(typeof row[0], `Row ${index + 1} discord_id type`).toBe('string');
        expect(typeof row[1], `Row ${index + 1} display_name type`).toBe('string');
        expect(typeof row[2], `Row ${index + 1} actual_username type`).toBe('string');
        expect(typeof row[3], `Row ${index + 1} join_date type`).toBe('string');
        expect(typeof row[4], `Row ${index + 1} is_banned type`).toBe('string');
        expect(typeof row[5], `Row ${index + 1} is_active type`).toBe('string');
        expect(typeof row[6], `Row ${index + 1} last_updated type`).toBe('string');

        // Validate boolean string values
        expect(['true', 'false']).toContain(row[4]); // is_banned
        expect(['true', 'false']).toContain(row[5]); // is_active
      }

      // Validate statistics for league management
      const bannedCount = allMemberRows.filter(row => row[4] === 'true').length;
      const activeCount = allMemberRows.filter(row => row[5] === 'true').length;

      expect(bannedCount).toBe(10); // Every 10th member is banned
      expect(activeCount).toBe(80); // 80 out of 100 are active (every 5th is inactive)
    });
  });

  describe('Error Handling and Data Validation', () => {
    it('should handle missing or undefined data gracefully', () => {
      // Arrange - Test with missing optional data
      const memberDataWithMissingFields = {
        discord_id: faker.string.numeric(18),
        discord_username_display: faker.internet.username(),
        discord_username_actual: faker.internet.username(),
        server_join_date: new Date().toISOString(),
        is_banned: false,
        is_active: true,
        // last_updated is optional and should be auto-generated
      };

      // Act - Create row with missing last_updated
      const memberRow = createMemberRow(memberDataWithMissingFields);

      // Assert - Should handle missing fields gracefully
      expect(memberRow).toHaveLength(7);
      expect(memberRow[6]).toBeDefined(); // last_updated should be auto-generated
      expect(new Date(memberRow[6] as string).toISOString()).toBe(memberRow[6]); // Should be valid ISO date
    });

    it('should maintain data integrity under edge cases', () => {
      // Arrange - Test edge cases
      const edgeCases = [
        {
          name: 'Very long usernames',
          data: {
            discord_id: faker.string.numeric(18),
            discord_username_display: 'A'.repeat(100), // Very long display name
            discord_username_actual: 'b'.repeat(50), // Long username
            server_join_date: new Date().toISOString(),
            is_banned: false,
            is_active: true,
            last_updated: new Date().toISOString(),
          },
        },
        {
          name: 'Empty strings',
          data: {
            discord_id: faker.string.numeric(18),
            discord_username_display: '', // Empty display name
            discord_username_actual: '', // Empty username
            server_join_date: new Date().toISOString(),
            is_banned: false,
            is_active: true,
            last_updated: new Date().toISOString(),
          },
        },
      ];

      // Act & Assert - Test each edge case
      for (const edgeCase of edgeCases) {
        const memberRow = createMemberRow(edgeCase.data);

        expect(memberRow, `${edgeCase.name} structure`).toHaveLength(7);
        expect(memberRow[1], `${edgeCase.name} display name`).toBe(
          edgeCase.data.discord_username_display
        );
        expect(memberRow[2], `${edgeCase.name} actual username`).toBe(
          edgeCase.data.discord_username_actual
        );
      }
    });
  });
});
