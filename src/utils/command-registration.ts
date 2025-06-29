/**
 * Command registration utility
 * Following Discord sample app pattern from register.js
 */

import { commands } from '../commands.js';

// Branded types for better type safety (Effective TypeScript Item 37)
type DiscordToken = string & { readonly __brand: 'DiscordToken' };
type ApplicationId = string & { readonly __brand: 'ApplicationId' };
type Environment = 'development' | 'production';

/**
 * Validated environment configuration
 */
interface EnvironmentConfig {
  readonly token: DiscordToken;
  readonly applicationId: ApplicationId;
}

/**
 * Registration environment details
 */
interface RegistrationEnvironment {
  readonly environment: Environment;
  readonly applicationId: ApplicationId;
  readonly endpoint: string;
}

/**
 * Validate required environment variables
 */
export function validateEnvironmentVariables(): EnvironmentConfig {
  const DISCORD_TOKEN = process.env['DISCORD_TOKEN'];
  const DISCORD_APPLICATION_ID = process.env['DISCORD_APPLICATION_ID'];

  if (DISCORD_TOKEN === undefined || DISCORD_APPLICATION_ID === undefined) {
    throw new Error(
      'Missing required environment variables: DISCORD_TOKEN and DISCORD_APPLICATION_ID'
    );
  }

  return {
    token: DISCORD_TOKEN as DiscordToken,
    applicationId: DISCORD_APPLICATION_ID as ApplicationId,
  };
}

/**
 * Determine registration environment and configuration
 */
export function determineRegistrationEnvironment(): RegistrationEnvironment {
  const { applicationId } = validateEnvironmentVariables();
  const envValue = process.env['DISCORD_ENV'];
  const environment: Environment = envValue === 'production' ? 'production' : 'development';
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
  const { token } = validateEnvironmentVariables();
  const { environment, endpoint } = determineRegistrationEnvironment();

  try {
    console.log(`Registering commands for ${environment} environment...`);

    const response = await fetch(endpoint, {
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
    console.log(
      `Successfully registered ${String(data.length)} commands for ${environment} environment`
    );

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
