/**
 * Integration tests for index.ts → admin sync command handler routing
 * Tests the integration boundary between index.ts and command-handler.ts (lines 438-439)
 * Focused on: Does the routing switch statement correctly call the handler?
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env } from '../../index';

// Mock the admin sync handler - THIS IS THE INTEGRATION BOUNDARY WE'RE TESTING
vi.mock(
  '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler',
  () => ({
    handleAdminSyncUsersToSheetsDiscord: vi.fn(),
  })
);

// Mock everything else to isolate the integration
vi.mock('../../utils/discord', () => ({
  verifyDiscordRequest: vi.fn(),
  createErrorResponse: vi.fn(),
  InteractionType: { ApplicationCommand: 2 },
}));

vi.mock('../../utils/audit', () => ({
  AuditLogger: vi.fn().mockImplementation(() => ({
    logRequestReceived: vi.fn(),
    logCommandExecution: vi.fn(),
    logError: vi.fn(),
  })),
  AuditEventType: { RequestReceived: 'request_received', CommandExecuted: 'command_executed' },
}));

vi.mock('../../middleware/security', () => ({
  createSecurityHeaders: vi.fn(() => ({})),
  extractSecurityContext: vi.fn(() => ({
    requestId: 'test-request-123',
    clientIP: '127.0.0.1',
    userAgent: 'test-agent',
    timestamp: Date.now(),
  })),
  verifyDiscordRequestSecure: vi.fn(),
  withTimeout: vi.fn(promise => Promise.resolve(promise)),
  cleanupRateLimits: vi.fn(),
}));

vi.mock('../../utils/index-functions', () => ({
  formatGlobalErrorMessage: vi.fn(msg => `Global error (no audit context): ${msg}`),
}));

vi.mock('../../utils/health-check', () => ({
  createProductionHealthCheck: vi.fn(() => () => new Response('OK', { status: 200 })),
}));

vi.mock('../../application_commands/register', () => ({
  handleRegisterCommand: vi.fn(() => new Response('{"type": 4}', { status: 200 })),
}));

describe('Index.ts → Command Handler Integration', () => {
  // Minimal test data - only what's needed for the integration
  const mockEnv: Env = {
    DISCORD_TOKEN: 'test_token',
    DISCORD_PUBLIC_KEY: 'test_public_key',
    DISCORD_APPLICATION_ID: 'test_app_id',
    GOOGLE_SHEET_ID: 'test_sheet_id',
    GOOGLE_SHEETS_CLIENT_EMAIL: 'test@test.com',
    GOOGLE_SHEETS_PRIVATE_KEY: 'test_private_key',
    GOOGLE_SHEETS_TYPE: 'service_account',
    GOOGLE_SHEETS_PROJECT_ID: 'test_project',
    GOOGLE_SHEETS_PRIVATE_KEY_ID: 'test_key_id',
    GOOGLE_SHEETS_CLIENT_ID: 'test_client_id',
    TEST_CHANNEL_ID: 'test_channel_123',
    PRIVILEGED_USER_ID: 'test_user_456',
    ENVIRONMENT: 'test',
  };

  const mockContext = {
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
    props: {},
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup minimal mocks - focus on the integration boundary
    const discordUtils = await import('../../utils/discord');
    vi.mocked(discordUtils.verifyDiscordRequest).mockResolvedValue(true);

    // Setup security middleware mocks
    const securityMiddleware = await import('../../middleware/security');
    vi.mocked(securityMiddleware.verifyDiscordRequestSecure).mockResolvedValue({
      isValid: true,
      context: {
        requestId: 'test-request-123',
        clientIP: '127.0.0.1',
        userAgent: 'test-agent',
        timestamp: Date.now(),
      },
    });

    const commandHandler = await import(
      '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler'
    );
    vi.mocked(commandHandler.handleAdminSyncUsersToSheetsDiscord).mockReturnValue(
      new Response('{"type": 5}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    );
  });

  describe('admin_sync_users_to_sheets command routing', () => {
    it('should route to handleAdminSyncUsersToSheetsDiscord with correct parameters (lines 438-439)', async () => {
      // Arrange - Create minimal interaction for testing routing logic
      const mockInteraction = {
        type: 2,
        id: 'test_interaction_id',
        application_id: 'test_app_id',
        token: 'test_token',
        version: 1,
        data: { id: 'test_command_id', name: 'admin_sync_users_to_sheets', type: 1 },
      };

      const mockSecurityContext = {
        requestId: 'test-request-123',
        clientIP: '127.0.0.1',
        userAgent: 'test-agent',
        timestamp: Date.now(),
      };

      // Import the modules we need to test
      const worker = await import('../../index');
      const commandHandler = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler'
      );
      const auditModule = await import('../../utils/audit');

      // Create audit logger mock
      const mockAuditLogger = new auditModule.AuditLogger('test');

      // Test the handleApplicationCommand function directly (this contains lines 438-439)
      const response = await worker.handleApplicationCommand({
        interaction: mockInteraction,
        env: mockEnv,
        audit: mockAuditLogger,
        context: mockSecurityContext,
        ctx: mockContext,
      });

      // Assert - Verify the integration works
      expect(commandHandler.handleAdminSyncUsersToSheetsDiscord).toHaveBeenCalledTimes(1);
      expect(commandHandler.handleAdminSyncUsersToSheetsDiscord).toHaveBeenCalledWith(
        mockInteraction,
        mockContext,
        mockEnv
      );
      expect(response.status).toBe(200);
    });

    it('should pass through response from command handler without modification', async () => {
      // Arrange - Create minimal interaction for testing response passthrough
      const mockInteraction = {
        type: 2,
        id: 'test_interaction_id',
        application_id: 'test_app_id',
        token: 'test_token',
        version: 1,
        data: { id: 'test_command_id', name: 'admin_sync_users_to_sheets', type: 1 },
      };

      const mockSecurityContext = {
        requestId: 'test-request-123',
        clientIP: '127.0.0.1',
        userAgent: 'test-agent',
        timestamp: Date.now(),
      };

      const expectedResponse = new Response('{"type": 5, "data": {"flags": 64}}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

      const commandHandler = await import(
        '../../application_commands/google-sheets/admin-sync-users-to-sheets/command-handler'
      );
      vi.mocked(commandHandler.handleAdminSyncUsersToSheetsDiscord).mockReturnValue(
        expectedResponse
      );

      const worker = await import('../../index');
      const auditModule = await import('../../utils/audit');
      const mockAuditLogger = new auditModule.AuditLogger('test');

      // Act - Test response integration using direct approach
      const response = await worker.handleApplicationCommand({
        interaction: mockInteraction,
        env: mockEnv,
        audit: mockAuditLogger,
        context: mockSecurityContext,
        ctx: mockContext,
      });

      // Assert - Response passes through correctly
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });
});
