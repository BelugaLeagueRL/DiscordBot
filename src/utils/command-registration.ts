/**
 * Command registration utility
 * Following Discord sample app pattern from register.js
 */

import { commands } from '../commands.js';

// Branded types for better type safety (Effective TypeScript Item 37)
type DiscordToken = string & { readonly __brand: 'DiscordToken' };
type ApplicationId = string & { readonly __brand: 'ApplicationId' };
type PublicKey = string & { readonly __brand: 'PublicKey' };
type GoogleSheetId = string & { readonly __brand: 'GoogleSheetId' };
type GoogleSheetsType = string & { readonly __brand: 'GoogleSheetsType' };
type GoogleSheetsProjectId = string & { readonly __brand: 'GoogleSheetsProjectId' };
type GoogleSheetsPrivateKeyId = string & { readonly __brand: 'GoogleSheetsPrivateKeyId' };
type GoogleSheetsPrivateKey = string & { readonly __brand: 'GoogleSheetsPrivateKey' };
type GoogleSheetsClientEmail = string & { readonly __brand: 'GoogleSheetsClientEmail' };
type GoogleSheetsClientId = string & { readonly __brand: 'GoogleSheetsClientId' };
type TestChannelId = string & { readonly __brand: 'TestChannelId' };
type PrivilegedUserId = string & { readonly __brand: 'PrivilegedUserId' };
type Environment = 'development' | 'production';

/**
 * Validated environment configuration for all 12 required variables
 */
interface EnvironmentConfig {
  readonly token: DiscordToken;
  readonly applicationId: ApplicationId;
  readonly publicKey: PublicKey;
  readonly googleSheetId: GoogleSheetId;
  readonly googleSheetsType: GoogleSheetsType;
  readonly googleSheetsProjectId: GoogleSheetsProjectId;
  readonly googleSheetsPrivateKeyId: GoogleSheetsPrivateKeyId;
  readonly googleSheetsPrivateKey: GoogleSheetsPrivateKey;
  readonly googleSheetsClientEmail: GoogleSheetsClientEmail;
  readonly googleSheetsClientId: GoogleSheetsClientId;
  readonly testChannelId: TestChannelId;
  readonly privilegedUserId: PrivilegedUserId;
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
 * Validate all 12 required environment variables
 */
export function validateEnvironmentVariables(): EnvironmentConfig {
  const DISCORD_TOKEN = process.env['DISCORD_TOKEN'];
  const DISCORD_APPLICATION_ID = process.env['DISCORD_APPLICATION_ID'];
  const DISCORD_PUBLIC_KEY = process.env['DISCORD_PUBLIC_KEY'];
  const GOOGLE_SHEET_ID = process.env['GOOGLE_SHEET_ID'];
  const GOOGLE_SHEETS_TYPE = process.env['GOOGLE_SHEETS_TYPE'];
  const GOOGLE_SHEETS_PROJECT_ID = process.env['GOOGLE_SHEETS_PROJECT_ID'];
  const GOOGLE_SHEETS_PRIVATE_KEY_ID = process.env['GOOGLE_SHEETS_PRIVATE_KEY_ID'];
  const GOOGLE_SHEETS_PRIVATE_KEY = process.env['GOOGLE_SHEETS_PRIVATE_KEY'];
  const GOOGLE_SHEETS_CLIENT_EMAIL = process.env['GOOGLE_SHEETS_CLIENT_EMAIL'];
  const GOOGLE_SHEETS_CLIENT_ID = process.env['GOOGLE_SHEETS_CLIENT_ID'];
  const TEST_CHANNEL_ID = process.env['TEST_CHANNEL_ID'];
  const PRIVILEGED_USER_ID = process.env['PRIVILEGED_USER_ID'];

  // Check for missing required variables
  const missingVariables: string[] = [];

  if (DISCORD_TOKEN === undefined) missingVariables.push('DISCORD_TOKEN');
  if (DISCORD_APPLICATION_ID === undefined) missingVariables.push('DISCORD_APPLICATION_ID');
  if (DISCORD_PUBLIC_KEY === undefined) missingVariables.push('DISCORD_PUBLIC_KEY');
  if (GOOGLE_SHEET_ID === undefined) missingVariables.push('GOOGLE_SHEET_ID');
  if (GOOGLE_SHEETS_TYPE === undefined) missingVariables.push('GOOGLE_SHEETS_TYPE');
  if (GOOGLE_SHEETS_PROJECT_ID === undefined) missingVariables.push('GOOGLE_SHEETS_PROJECT_ID');
  if (GOOGLE_SHEETS_PRIVATE_KEY_ID === undefined)
    missingVariables.push('GOOGLE_SHEETS_PRIVATE_KEY_ID');
  if (GOOGLE_SHEETS_PRIVATE_KEY === undefined) missingVariables.push('GOOGLE_SHEETS_PRIVATE_KEY');
  if (GOOGLE_SHEETS_CLIENT_EMAIL === undefined) missingVariables.push('GOOGLE_SHEETS_CLIENT_EMAIL');
  if (GOOGLE_SHEETS_CLIENT_ID === undefined) missingVariables.push('GOOGLE_SHEETS_CLIENT_ID');
  if (TEST_CHANNEL_ID === undefined) missingVariables.push('TEST_CHANNEL_ID');
  if (PRIVILEGED_USER_ID === undefined) missingVariables.push('PRIVILEGED_USER_ID');

  if (missingVariables.length > 0) {
    if (missingVariables.length === 1) {
      throw new Error(`Missing required environment variable: ${missingVariables[0]}`);
    } else {
      throw new Error(`Missing required environment variables: ${missingVariables.join(', ')}`);
    }
  }

  return {
    token: DISCORD_TOKEN as DiscordToken,
    applicationId: DISCORD_APPLICATION_ID as ApplicationId,
    publicKey: DISCORD_PUBLIC_KEY as PublicKey,
    googleSheetId: GOOGLE_SHEET_ID as GoogleSheetId,
    googleSheetsType: GOOGLE_SHEETS_TYPE as GoogleSheetsType,
    googleSheetsProjectId: GOOGLE_SHEETS_PROJECT_ID as GoogleSheetsProjectId,
    googleSheetsPrivateKeyId: GOOGLE_SHEETS_PRIVATE_KEY_ID as GoogleSheetsPrivateKeyId,
    googleSheetsPrivateKey: GOOGLE_SHEETS_PRIVATE_KEY as GoogleSheetsPrivateKey,
    googleSheetsClientEmail: GOOGLE_SHEETS_CLIENT_EMAIL as GoogleSheetsClientEmail,
    googleSheetsClientId: GOOGLE_SHEETS_CLIENT_ID as GoogleSheetsClientId,
    testChannelId: TEST_CHANNEL_ID as TestChannelId,
    privilegedUserId: PRIVILEGED_USER_ID as PrivilegedUserId,
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
