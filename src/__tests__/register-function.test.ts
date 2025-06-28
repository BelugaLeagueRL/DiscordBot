/**
 * TDD test for register.ts registerCommands function
 * GREEN phase - testing with valid environment
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { registerCommands } from '../register';

describe('registerCommands function with valid environment', () => {
  let originalEnv: typeof process.env;
  let originalFetch: typeof global.fetch;
  let originalConsole: typeof global.console;
  let originalProcessExit: typeof process.exit;

  beforeEach(() => {
    // Store originals
    originalEnv = { ...process.env };
    originalFetch = global.fetch;
    originalConsole = global.console;
    originalProcessExit = process.exit;

    // Set valid environment variables
    process.env.DISCORD_TOKEN = 'test_token';
    process.env.DISCORD_APPLICATION_ID = 'test_app_id';

    // Mock fetch
    global.fetch = vi.fn();
    // Mock console
    global.console = { ...global.console, log: vi.fn(), error: vi.fn() };
    // Mock process.exit
    process.exit = vi.fn() as any;
  });

  afterEach(() => {
    // Restore originals
    process.env = originalEnv;
    global.fetch = originalFetch;
    global.console = originalConsole;
    process.exit = originalProcessExit;
  });

  it('should make Discord API call successfully', async () => {
    // GREEN: Test the registerCommands function with mocked fetch
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue([{ name: 'register', description: 'Test command' }]),
    } as any);

    // Call the function directly
    await registerCommands();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://discord.com/api/v10/applications/test_app_id/commands',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bot test_token',
        }),
      })
    );
  });

  it('should handle API error response', async () => {
    // GREEN: Test error handling for failed API response
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: vi.fn().mockResolvedValue('Invalid command format'),
    } as any);

    // Function already imported at top of file

    // Should call process.exit(1) on error
    await registerCommands();
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should handle network errors', async () => {
    // GREEN: Test network error handling
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    // Function already imported at top of file

    // Should call process.exit(1) on network error
    await registerCommands();
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should send correct command payload to Discord API', async () => {
    // RED: Test actual command structure being sent
    const mockFetch = vi.mocked(global.fetch);
    const mockJson = vi
      .fn()
      .mockResolvedValue([
        { name: 'register', description: 'Register your Rocket League tracker URLs' },
      ]);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: mockJson,
    } as any);

    // Function already imported at top of file
    await registerCommands();

    // Verify the command payload structure
    expect(mockFetch).toHaveBeenCalledWith(
      'https://discord.com/api/v10/applications/test_app_id/commands',
      expect.objectContaining({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bot test_token',
        },
        body: JSON.stringify([
          {
            name: 'register',
            description: 'Register your Rocket League tracker URLs',
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
        ]),
      })
    );
  });

  it('should log registration success with command details', async () => {
    // RED: Test logging functionality
    const mockConsoleLog = vi.mocked(global.console.log);
    const mockFetch = vi.mocked(global.fetch);

    const apiResponse = [
      { name: 'register', description: 'Register your Rocket League tracker URLs' },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(apiResponse),
    } as any);

    // Function already imported at top of file
    await registerCommands();

    // Verify logging messages
    expect(mockConsoleLog).toHaveBeenCalledWith('Registering commands...');
    expect(mockConsoleLog).toHaveBeenCalledWith('Successfully registered', 1, 'commands');
    expect(mockConsoleLog).toHaveBeenCalledWith(
      '  - register: Register your Rocket League tracker URLs'
    );
  });

  it('should log error details when API call fails', async () => {
    // RED: Test error logging functionality
    const mockConsoleError = vi.mocked(global.console.error);
    const mockFetch = vi.mocked(global.fetch);

    const errorResponse = 'Invalid command structure';
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: vi.fn().mockResolvedValue(errorResponse),
    } as any);

    // Function already imported at top of file
    await registerCommands();

    // Verify error logging
    expect(mockConsoleError).toHaveBeenCalledWith('Error registering commands:', expect.any(Error));
  });
});
