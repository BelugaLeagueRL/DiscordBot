/**
 * Unit tests for Google Sheets utility functions
 * Testing granular data formatting logic following TDD Red-Green-Refactor
 */

import { describe, it, expect } from 'vitest';

// Object Mother pattern for test data - provides well-known test objects
interface MemberData {
  readonly discord_id: string;
  readonly discord_username_display: string;
  readonly discord_username_actual: string;
  readonly server_join_date: string;
  readonly is_banned: boolean;
  readonly is_active: boolean;
  readonly last_updated?: string;
}

const MemberMother = {
  // Standard active member
  validMember(): MemberData {
    return {
      discord_id: '123456789012345678',
      discord_username_display: 'DisplayName',
      discord_username_actual: 'actualusername',
      server_join_date: '2023-01-01T00:00:00.000Z',
      is_banned: false,
      is_active: true,
      last_updated: '2023-06-01T12:00:00.000Z',
    };
  },

  // Banned member
  bannedMember(): MemberData {
    return {
      discord_id: '111111111111111111',
      discord_username_display: 'BannedUser',
      discord_username_actual: 'banneduser',
      server_join_date: '2023-01-01T00:00:00.000Z',
      is_banned: true,
      is_active: false,
    };
  },

  // Active member (explicitly not banned)
  activeMember(): MemberData {
    return {
      discord_id: '222222222222222222',
      discord_username_display: 'ActiveUser',
      discord_username_actual: 'activeuser',
      server_join_date: '2023-01-01T00:00:00.000Z',
      is_banned: false,
      is_active: true,
    };
  },

  // Member without timestamp (for auto-generation testing)
  memberWithoutTimestamp(): Omit<MemberData, 'last_updated'> {
    return {
      discord_id: '333333333333333333',
      discord_username_display: 'NoTimestampUser',
      discord_username_actual: 'notimestampuser',
      server_join_date: '2023-01-01T00:00:00.000Z',
      is_banned: false,
      is_active: true,
    };
  },

  // Member with special characters
  memberWithSpecialChars(): MemberData {
    return {
      discord_id: '444444444444444444',
      discord_username_display: 'User With Spaces & Symbols!@#',
      discord_username_actual: 'user_with_underscores',
      server_join_date: '2023-12-31T23:59:59.999Z',
      is_banned: false,
      is_active: true,
      last_updated: '2023-12-31T23:59:59.999Z',
    };
  },
};

describe('Google Sheets Utilities - Unit Tests', () => {
  describe('createMemberRow', () => {
    it('should transform member data into sheet row format with all required fields', async () => {
      // Arrange
      const memberData = MemberMother.validMember();
      const { createMemberRow } = await import('../../utils/google-sheets-builder');

      // Act
      const result = createMemberRow(memberData);

      // Assert
      expect(result).toEqual([
        '123456789012345678', // discord_id
        'DisplayName', // discord_username_display
        'actualusername', // discord_username_actual
        '2023-01-01T00:00:00.000Z', // server_join_date
        'false', // is_banned converted to string
        'true', // is_active converted to string
        '2023-06-01T12:00:00.000Z', // last_updated
      ]);
      expect(result).toHaveLength(7);
    });

    it('should convert true boolean values to string "true"', async () => {
      // Arrange
      const memberData = MemberMother.bannedMember();
      const { createMemberRow } = await import('../../utils/google-sheets-builder');

      // Act
      const result = createMemberRow(memberData);

      // Assert
      expect(result[4]).toBe('true'); // is_banned
      expect(result[5]).toBe('false'); // is_active
    });

    it('should convert false boolean values to string "false"', async () => {
      // Arrange
      const memberData = MemberMother.activeMember();
      const { createMemberRow } = await import('../../utils/google-sheets-builder');

      // Act
      const result = createMemberRow(memberData);

      // Assert
      expect(result[4]).toBe('false'); // is_banned
      expect(result[5]).toBe('true'); // is_active
    });

    it('should generate automatic timestamp when last_updated is not provided', async () => {
      // Arrange
      const memberData = MemberMother.memberWithoutTimestamp();
      const { createMemberRow } = await import('../../utils/google-sheets-builder');

      // Act
      const result = createMemberRow(memberData);

      // Assert
      expect(result).toHaveLength(7);
      expect(result[6]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/); // ISO format

      // Timestamp should be recent (within last few seconds)
      expect(result[6]).toBeDefined();
      const timestamp = new Date(result[6]!);
      const now = new Date();
      const diffMs = now.getTime() - timestamp.getTime();
      expect(diffMs).toBeLessThan(5000); // Within 5 seconds
    });

    it('should handle edge cases with special characters and empty strings', async () => {
      // Arrange
      const memberData = MemberMother.memberWithSpecialChars();
      const { createMemberRow } = await import('../../utils/google-sheets-builder');

      // Act
      const result = createMemberRow(memberData);

      // Assert
      expect(result[0]).toBe('444444444444444444');
      expect(result[1]).toBe('User With Spaces & Symbols!@#'); // Preserve special chars
      expect(result[2]).toBe('user_with_underscores'); // Preserve underscores
      expect(result[3]).toBe('2023-12-31T23:59:59.999Z'); // Preserve exact timestamp
      expect(result[4]).toBe('false');
      expect(result[5]).toBe('true');
      expect(result[6]).toBe('2023-12-31T23:59:59.999Z');
    });
  });
});
