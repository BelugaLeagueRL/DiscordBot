/**
 * Command registration utility
 * Following Discord sample app pattern from register.js
 */

import { commands } from './commands';

/**
 * Validate required environment variables
 */
export function validateEnvironmentVariables(): { token: string; applicationId: string } {
  const DISCORD_TOKEN = process.env['DISCORD_TOKEN'];
  const DISCORD_APPLICATION_ID = process.env['DISCORD_APPLICATION_ID'];

  if (DISCORD_TOKEN === undefined || DISCORD_APPLICATION_ID === undefined) {
    throw new Error(
      'Missing required environment variables: DISCORD_TOKEN and DISCORD_APPLICATION_ID'
    );
  }

  return {
    token: DISCORD_TOKEN,
    applicationId: DISCORD_APPLICATION_ID,
  };
}

/**
 * Determine registration environment and configuration
 */
export function determineRegistrationEnvironment(): {
  readonly environment: 'development' | 'production';
  readonly applicationId: string;
  readonly endpoint: string;
} {
  const { applicationId } = validateEnvironmentVariables();
  const environment = (process.env['DISCORD_ENV'] as 'development' | 'production') ?? 'development';
  const endpoint = `https://discord.com/api/v10/applications/${applicationId}/commands`;

  return {
    environment,
    applicationId,
    endpoint,
  } as const;
}

/**
 * Register all commands with Discord
 */
export async function registerCommands(): Promise<void> {
  const { token, applicationId } = validateEnvironmentVariables();
  const url = `https://discord.com/api/v10/applications/${applicationId}/commands`;

  try {
    console.log('Registering commands...');

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${token}`,
      },
      body: JSON.stringify(commands),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to register commands: ${String(response.status)} ${response.statusText}\n${errorText}`
      );
    }

    const responseData = await response.json();
    const data = responseData as unknown[];
    console.log('Successfully registered', data.length, 'commands');

    // Log registered commands
    for (const command of data) {
      const cmd = command as { name?: unknown; description?: unknown };
      console.log(`  - ${String(cmd.name)}: ${String(cmd.description)}`);
    }
  } catch (error: unknown) {
    console.error('Error registering commands:', error);
    process.exit(1);
  }
}

// Run command registration if this file is executed directly
if (import.meta.url === `file://${String(process.argv[1])}`) {
  void registerCommands();
}
