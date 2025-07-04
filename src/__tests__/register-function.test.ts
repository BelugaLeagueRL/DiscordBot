/**
 * TDD test for register.ts registerCommands function
 * GREEN phase - testing with valid environment
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import { registerCommands } from '../utils/command-registration';
import { UrlFactory } from './helpers/url-factories';

describe('registerCommands function with valid environment', () => {
  let originalEnv: typeof process.env;
  let originalFetch: typeof globalThis.fetch;
  let originalConsole: typeof console;
  let mockProcessExit: MockedFunction<typeof process.exit>;

  beforeEach(() => {
    // Store originals
    originalEnv = { ...process.env };
    originalFetch = globalThis.fetch;
    originalConsole = console;
    mockProcessExit = vi.fn() as MockedFunction<typeof process.exit>;

    // Set valid environment variables
    process.env['DISCORD_TOKEN'] = 'test_token';
    process.env['DISCORD_APPLICATION_ID'] = 'test_app_id';
    process.env['DISCORD_PUBLIC_KEY'] = 'test_public_key';
    process.env['GOOGLE_SHEET_ID'] = 'test_sheet_id';
    process.env['GOOGLE_SHEETS_TYPE'] = 'service_account';
    process.env['GOOGLE_SHEETS_PROJECT_ID'] = 'test_project_id';
    process.env['GOOGLE_SHEETS_PRIVATE_KEY_ID'] = 'test_private_key_id';
    process.env['GOOGLE_SHEETS_PRIVATE_KEY'] = 'test_private_key';
    process.env['GOOGLE_SHEETS_CLIENT_EMAIL'] = 'test@test.com';
    process.env['GOOGLE_SHEETS_CLIENT_ID'] = 'test_client_id';
    process.env['TEST_CHANNEL_ID'] = 'test_channel_id';
    process.env['PRIVILEGED_USER_ID'] = 'test_user_id';

    // Mock fetch
    globalThis.fetch = vi.fn();
    // Mock console
    const mockConsole = { ...console, log: vi.fn(), error: vi.fn() };
    (globalThis as unknown as { console: typeof console }).console = mockConsole;
    // Mock process.exit
    process.exit = mockProcessExit;
  });

  afterEach(() => {
    // Restore originals
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
    (globalThis as unknown as { console: typeof console }).console = originalConsole;
    // process.exit is restored by mockProcessExit.mockRestore() if needed
  });

  it('should make Discord API call successfully', async () => {
    // GREEN: Test the registerCommands function with mocked fetch
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue([{ name: 'register', description: 'Test command' }]),
    } as Partial<Response> as Response);

    // Call the function directly
    await registerCommands();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(UrlFactory.discord.commands.test('test_app_id'));
    expect(options.method).toBe('PUT');
    expect(options.headers).toBeDefined();
    const headers = options.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Authorization']).toBe('Bot test_token');
  });

  it('should handle API error response', async () => {
    // GREEN: Test error handling for failed API response
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: vi.fn().mockResolvedValue('Invalid command format'),
    } as Partial<Response> as Response);

    // Function already imported at top of file

    // Should call process.exit(1) on error
    await registerCommands();
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  it('should handle network errors', async () => {
    // GREEN: Test network error handling
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    // Function already imported at top of file

    // Should call process.exit(1) on network error
    await registerCommands();
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  it('should send correct command payload to Discord API', async () => {
    // RED: Test actual command structure being sent
    const mockFetch = vi.mocked(global.fetch);
    const mockJson = vi
      .fn()
      .mockResolvedValue([{ name: 'register', description: 'Register with the league' }]);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: mockJson,
    } as Partial<Response> as Response);

    // Function already imported at top of file
    await registerCommands();

    // Verify the command payload structure
    expect(mockFetch).toHaveBeenCalledWith(
      UrlFactory.discord.commands.test('test_app_id'),
      expect.objectContaining({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bot test_token',
        },
        body: JSON.stringify([
          {
            name: 'register',
            description: 'Register with the league',
            options: [
              {
                name: 'tracker1',
                description: 'First Rocket League tracker URL',
                type: 3,
                required: true,
              },
              {
                name: 'tracker2',
                description: 'Second Rocket League tracker URL (optional)',
                type: 3,
                required: false,
              },
              {
                name: 'tracker3',
                description: 'Third Rocket League tracker URL (optional)',
                type: 3,
                required: false,
              },
              {
                name: 'tracker4',
                description: 'Fourth Rocket League tracker URL (optional)',
                type: 3,
                required: false,
              },
            ],
          },
          {
            name: 'admin_sync_users_to_sheets',
            description: 'Sync Discord server users to Google Sheets (Admin only)',
            options: [],
          },
        ]),
      })
    );
  });

  it('should log registration success with command details', async () => {
    // RED: Test logging functionality
    const mockConsoleLog = vi.mocked(
      (globalThis as unknown as { console: { log: MockedFunction<typeof console.log> } }).console
        .log
    );
    const mockFetch = vi.mocked(globalThis.fetch);

    const apiResponse = [{ name: 'register', description: 'Register with the league' }];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(apiResponse),
    } as Partial<Response> as Response);

    // Function already imported at top of file
    await registerCommands();

    // Verify logging messages
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Registering commands for development environment...'
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Successfully registered 1 commands for development environment'
    );
    expect(mockConsoleLog).toHaveBeenCalledWith('  - register: Register with the league');
  });

  it('should log error details when API call fails', async () => {
    // RED: Test error logging functionality
    const mockConsoleError = vi.mocked(
      (globalThis as unknown as { console: { error: MockedFunction<typeof console.error> } })
        .console.error
    );
    const mockFetch = vi.mocked(globalThis.fetch);

    const errorResponse = 'Invalid command structure';
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: vi.fn().mockResolvedValue(errorResponse),
    } as Partial<Response> as Response);

    // Function already imported at top of file
    await registerCommands();

    // Verify error logging
    expect(mockConsoleError).toHaveBeenCalledTimes(1);
    const [firstArg, secondArg] = mockConsoleError.mock.calls[0] as [string, Error];
    expect(firstArg).toBe('Error registering commands:');
    expect(secondArg).toBeInstanceOf(Error);
  });
});
