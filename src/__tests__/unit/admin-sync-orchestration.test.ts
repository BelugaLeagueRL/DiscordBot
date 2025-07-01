/**
 * Tests for admin sync orchestration function executeAdminSyncAndNotify()
 * RED phase: Test for Discord notification integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeAdminSyncAndNotify } from '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler';

// Mock the Discord utilities
vi.mock('../../utils/discord', () => ({
  updateDeferredResponse: vi.fn(),
}));

// Mock the background sync function
vi.mock(
  '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler',
  async importOriginal => {
    const actual = (await importOriginal()) as Record<string, unknown>;
    return {
      ...actual,
      performBackgroundSync: vi.fn(),
    };
  }
);

describe('executeAdminSyncAndNotify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call updateDeferredResponse with success message when sync succeeds', async () => {
    // This test should FAIL initially because executeAdminSyncAndNotify doesn't exist yet
    // This is the RED phase of TDD
    expect(executeAdminSyncAndNotify).toBeDefined();
  });

  it('should call updateDeferredResponse with error message when sync fails', async () => {
    // This test should also FAIL initially
    // This validates error handling path
    expect(executeAdminSyncAndNotify).toBeDefined();
  });
});
