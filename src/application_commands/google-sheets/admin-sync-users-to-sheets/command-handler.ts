/**
 * Discord slash command handler for /admin_sync_users_to_sheets
 * Atomic validation functions with Result pattern for type safety
 */

import type { Env } from '../../../index';
import type { DiscordInteraction } from '../../../types/discord';
import type { GoogleSheetsCredentials } from '../../../utils/google-sheets-builder';
import {
  createErrorResponse,
  createDeferredResponse,
  updateDeferredResponse,
} from '../../../utils/discord';
import { fetchGuildMembers, transformMemberData, filterNewMembers } from './discord-members';
import {
  GoogleOAuthBuilder,
  GoogleSheetsApiBuilder,
  createMemberRow,
} from '../../../utils/google-sheets-builder';

/**
 * Result pattern for type-safe error handling
 */
export type Result<T, E = string> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

/**
 * Response format for admin sync command
 */
export interface AdminSyncResponse {
  readonly success: boolean;
  readonly message?: string;
  readonly error?: string;
  readonly requestId?: string;
  readonly estimatedDuration?: string;
  readonly metadata?: {
    readonly guildId: string;
    readonly initiatedBy: string;
    readonly timestamp: string;
  };
}

/**
 * ExecutionContext interface for type safety
 */
interface ExecutionContext {
  readonly waitUntil: (promise: Promise<unknown>) => void;
  readonly passThroughOnException: () => void;
}

/**
 * Validate Google Sheets credentials format
 */
export function validateCredentials(credentials: GoogleSheetsCredentials): { isValid: boolean } {
  if (!credentials || typeof credentials !== 'object') {
    return { isValid: false };
  }

  if (typeof credentials.client_email !== 'string' || credentials.client_email.length === 0) {
    return { isValid: false };
  }

  if (typeof credentials.private_key !== 'string' || credentials.private_key.length === 0) {
    return { isValid: false };
  }

  return { isValid: true };
}

/**
 * Cloudflare ExecutionContext interface
 */
interface CloudflareExecutionContext {
  readonly waitUntil: (promise: Promise<unknown>) => void;
  readonly passThroughOnException: () => void;
}

/**
 * Background sync operation parameters
 */
interface SyncParameters {
  readonly guildId: string;
  readonly credentials: GoogleSheetsCredentials;
  readonly requestId: string;
  readonly initiatedBy: string;
  readonly timestamp: string;
}

/**
 * Background sync operation result
 */
interface SyncResult {
  readonly success: boolean;
  readonly error?: string;
  readonly requestId?: string;
  readonly estimatedDuration?: string;
}

/**
 * Background sync implementation using Google Sheets Builder
 */
function syncUsersToSheetsBackground(
  params: SyncParameters,
  context: CloudflareExecutionContext,
  env: Env
): SyncResult {
  try {
    // Schedule the background work using waitUntil
    context.waitUntil(performBackgroundSync(params, env));

    return {
      success: true,
      requestId: params.requestId,
      estimatedDuration: '30-60 seconds',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown sync error',
    };
  }
}

/**
 * Perform the actual background sync operation
 */
async function performBackgroundSync(
  params: SyncParameters,
  env: Env
): Promise<{ newMembersAdded: number }> {
  console.log(`Starting background sync for guild ${params.guildId}`);

  // 1. Authenticate with Google Sheets using GoogleOAuthBuilder
  const oauth = GoogleOAuthBuilder.create().setCredentials(params.credentials);
  const accessToken = await oauth.getAccessToken();

  // 2. Fetch Discord guild members using fetchGuildMembers
  const memberResult = await fetchGuildMembers(params.guildId, env);
  if (!memberResult.success) {
    throw new Error(`Failed to fetch members: ${memberResult.error}`);
  }

  // 3. Transform members using transformMemberData
  const memberData = transformMemberData(memberResult.members || []);

  // 4. Get existing IDs to prevent duplicates
  const sheetsApi = GoogleSheetsApiBuilder.create()
    .setSpreadsheetId(env.GOOGLE_SHEET_ID as string)
    .setRange('Sheet1!A:A')
    .setAccessToken(accessToken);

  const existingResult = await sheetsApi.get();
  const existingIds = new Set(
    existingResult.success && existingResult.values
      ? existingResult.values
          .slice(1)
          .flat()
          .filter(id => id && id.length > 0)
      : []
  );

  // 5. Filter new members using filterNewMembers
  const newMembers = filterNewMembers(memberData, existingIds);

  // 6. Append new members using GoogleSheetsApiBuilder
  if (newMembers.length > 0) {
    const appendApi = GoogleSheetsApiBuilder.create()
      .setSpreadsheetId(env.GOOGLE_SHEET_ID as string)
      .setRange('Sheet1!A:G')
      .setAccessToken(accessToken)
      .setValues(newMembers.map(createMemberRow));

    const appendResult = await appendApi.append();
    if (!appendResult.success) {
      throw new Error(`Failed to append members: ${appendResult.error}`);
    }
  }

  console.log(`Background sync completed for guild ${params.guildId}`);
  return { newMembersAdded: newMembers.length };
}

/**
 * Execute admin sync operation and notify Discord with results
 */
export async function executeAdminSyncAndNotify(
  interaction: DiscordInteraction,
  env: Env,
  params: SyncParameters
): Promise<void> {
  try {
    const syncResult = await performBackgroundSync(params, env);

    // Notify success with member count
    await updateDeferredResponse(
      env.DISCORD_APPLICATION_ID,
      interaction.token,
      `✅ Successfully synced ${syncResult.newMembersAdded} new members to sheets`
    );
  } catch (error) {
    // Convert technical errors to user-friendly messages
    const friendlyMessage = convertErrorToUserMessage(error);
    await updateDeferredResponse(
      env.DISCORD_APPLICATION_ID,
      interaction.token,
      `❌ Sync failed: ${friendlyMessage}`
    );
  }
}

/**
 * Validate execution context has required methods
 */
export function validateExecutionContext(context: unknown): Result<ExecutionContext> {
  if (context === null || context === undefined) {
    return { success: false, error: 'Execution context not available' };
  }

  if (
    typeof context !== 'object' ||
    typeof (context as { waitUntil?: unknown }).waitUntil !== 'function'
  ) {
    return { success: false, error: 'Execution context missing required methods' };
  }

  return { success: true, data: context as ExecutionContext };
}

/**
 * Extended Discord interaction interface matching the test expectations
 */
interface ExtendedDiscordInteraction extends DiscordInteraction {
  readonly guild_id?: string;
  readonly channel_id?: string;
  readonly user?: {
    readonly id: string;
    readonly username?: string;
    readonly discriminator?: string;
    readonly global_name?: string;
  };
  readonly member?: {
    readonly user?: {
      readonly id: string;
      readonly username?: string;
      readonly discriminator?: string;
      readonly global_name?: string;
    };
    readonly nick?: string;
    readonly roles?: readonly string[];
  };
  readonly data?: {
    readonly id: string;
    readonly name: string;
    readonly type: number;
    readonly options?: readonly {
      readonly name: string;
      readonly value: string;
      readonly type: number;
    }[];
  };
}

/**
 * Validate Discord interaction has required structure
 */
export function validateInteractionStructure(interaction: unknown): Result<DiscordInteraction> {
  if (interaction === null || interaction === undefined || typeof interaction !== 'object') {
    return { success: false, error: 'Invalid interaction format' };
  }

  const obj = interaction as { id?: unknown; application_id?: unknown; type?: unknown };
  if (typeof obj.id !== 'string' || obj.id.length === 0 || typeof obj.application_id !== 'string') {
    return { success: false, error: 'Invalid interaction format' };
  }

  return { success: true, data: interaction as DiscordInteraction };
}

/**
 * Validate channel and permission requirements
 */
export function validateChannelPermissions(
  interaction: ExtendedDiscordInteraction,
  env: Env
): Result<boolean> {
  if ((interaction.guild_id ?? '').length === 0) {
    return { success: false, error: 'This command can only be used in a Discord server' };
  }

  if (interaction.channel_id !== env.TEST_CHANNEL_ID) {
    return {
      success: false,
      error: 'This command can only be used in the designated admin channel',
    };
  }

  const userId = interaction.user?.id ?? interaction.member?.user?.id ?? '';
  if (userId !== env.PRIVILEGED_USER_ID) {
    return { success: false, error: 'Insufficient permissions for this admin command' };
  }

  return { success: true, data: true };
}

// SECURITY: isOptionWithName() helper removed - no longer needed without extractCredentials()

/**
 * Validate basic context and interaction structure
 */
function validateBasics(
  interaction: DiscordInteraction,
  context: ExecutionContext
): Result<{ extendedInteraction: ExtendedDiscordInteraction; validatedContext: ExecutionContext }> {
  const contextValidation = validateExecutionContext(context);
  if (!contextValidation.success) {
    return { success: false, error: contextValidation.error };
  }

  const interactionValidation = validateInteractionStructure(interaction);
  if (!interactionValidation.success) {
    return { success: false, error: interactionValidation.error };
  }

  const extendedInteraction = interaction as ExtendedDiscordInteraction;
  if (extendedInteraction.data === undefined) {
    return { success: false, error: 'Invalid command data' };
  }

  return {
    success: true,
    data: { extendedInteraction, validatedContext: contextValidation.data },
  };
}

/**
 * Extract and validate user ID from interaction
 */
function extractUserId(extendedInteraction: ExtendedDiscordInteraction): Result<string> {
  const userId = extendedInteraction.user?.id ?? extendedInteraction.member?.user?.id;
  if ((userId ?? '').length === 0) {
    return { success: false, error: 'User information not available' };
  }
  return { success: true, data: userId ?? '' };
}

/**
 * Validate user and environment requirements
 */
function validateUserAndEnvironment(
  extendedInteraction: ExtendedDiscordInteraction,
  env: Env
): Result<string> {
  const userIdResult = extractUserId(extendedInteraction);
  if (!userIdResult.success) {
    return userIdResult;
  }

  if ((env.GOOGLE_SHEET_ID ?? '').length === 0) {
    return { success: false, error: 'Missing required environment configuration' };
  }

  const permissionValidation = validateChannelPermissions(extendedInteraction, env);
  if (!permissionValidation.success) {
    return { success: false, error: permissionValidation.error };
  }

  return { success: true, data: userIdResult.data };
}

/**
 * Perform all validation steps for the command
 */
function performValidation(
  interaction: DiscordInteraction,
  context: ExecutionContext,
  env: Env
): Result<{
  extendedInteraction: ExtendedDiscordInteraction;
  userId: string;
  validatedContext: ExecutionContext;
}> {
  const basicsResult = validateBasics(interaction, context);
  if (!basicsResult.success) {
    return { success: false, error: basicsResult.error };
  }

  const userResult = validateUserAndEnvironment(basicsResult.data.extendedInteraction, env);
  if (!userResult.success) {
    return { success: false, error: userResult.error };
  }

  return {
    success: true,
    data: {
      extendedInteraction: basicsResult.data.extendedInteraction,
      userId: userResult.data,
      validatedContext: basicsResult.data.validatedContext,
    },
  };
}

/**
 * Execute the background sync operation
 */
function executeSyncOperation(
  validatedData: {
    extendedInteraction: ExtendedDiscordInteraction;
    userId: string;
    validatedContext: ExecutionContext;
  },
  env: Env
): Result<AdminSyncResponse> {
  // SECURITY: Use environment credentials only, never from user input
  const credentialsResult = loadCredentialsFromEnvironment(env);
  if (!credentialsResult.success) {
    return { success: false, error: credentialsResult.error };
  }

  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const guildId = validatedData.extendedInteraction.guild_id ?? '';

  const syncResult = syncUsersToSheetsBackground(
    {
      guildId: guildId,
      credentials: credentialsResult.data,
      requestId: requestId,
      initiatedBy: validatedData.userId,
      timestamp: timestamp,
    },
    validatedData.validatedContext as CloudflareExecutionContext,
    env
  );

  if (!syncResult.success) {
    return { success: false, error: syncResult.error ?? 'Unknown sync error' };
  }

  return {
    success: true,
    data: {
      success: true,
      message: 'Background sync initiated successfully',
      requestId: syncResult.requestId ?? '',
      estimatedDuration: syncResult.estimatedDuration ?? '',
      metadata: {
        guildId: guildId,
        initiatedBy: validatedData.userId,
        timestamp: timestamp,
      },
    },
  };
}

/**
 * Main handler function for /admin_sync_users_to_sheets command
 * Returns AdminSyncResponse for backward compatibility with tests
 */
export function handleAdminSyncUsersToSheets(
  interaction: DiscordInteraction,
  context: ExecutionContext,
  env: Env
): Promise<AdminSyncResponse> {
  const validationResult = performValidation(interaction, context, env);
  if (!validationResult.success) {
    return Promise.resolve({ success: false, error: validationResult.error });
  }

  const syncResult = executeSyncOperation(validationResult.data, env);
  if (!syncResult.success) {
    return Promise.resolve({ success: false, error: syncResult.error });
  }

  return Promise.resolve(syncResult.data);
}

/**
 * Validate required credential fields are present
 */
function validateRequiredCredentialFields(env: Env): Result<boolean> {
  const requiredFields = [
    env.GOOGLE_SHEETS_TYPE,
    env.GOOGLE_SHEETS_PROJECT_ID,
    env.GOOGLE_SHEETS_PRIVATE_KEY_ID,
    env.GOOGLE_SHEETS_PRIVATE_KEY,
    env.GOOGLE_SHEETS_CLIENT_EMAIL,
    env.GOOGLE_SHEETS_CLIENT_ID,
  ];

  const fieldNames = [
    'GOOGLE_SHEETS_TYPE',
    'GOOGLE_SHEETS_PROJECT_ID',
    'GOOGLE_SHEETS_PRIVATE_KEY_ID',
    'GOOGLE_SHEETS_PRIVATE_KEY',
    'GOOGLE_SHEETS_CLIENT_EMAIL',
    'GOOGLE_SHEETS_CLIENT_ID',
  ];

  for (let i = 0; i < requiredFields.length; i++) {
    const field = requiredFields[i];
    if (field === undefined || field.length === 0) {
      return {
        success: false,
        error: `Missing required credential field: ${fieldNames[i] ?? 'unknown'}`,
      };
    }
  }

  return { success: true, data: true };
}

/**
 * Build credentials object from environment variables
 */
export function buildCredentialsObject(env: Env): GoogleSheetsCredentials {
  return {
    client_email: env.GOOGLE_SHEETS_CLIENT_EMAIL as string,
    private_key: env.GOOGLE_SHEETS_PRIVATE_KEY as string,
  };
}

/**
 * Load Google Sheets credentials from individual environment variables
 */
function loadCredentialsFromEnvironment(env: Env): Result<GoogleSheetsCredentials> {
  const fieldsValidation = validateRequiredCredentialFields(env);
  if (!fieldsValidation.success) {
    return { success: false, error: fieldsValidation.error };
  }

  try {
    const credentials = buildCredentialsObject(env);

    const validation = validateCredentials(credentials);
    if (!validation.isValid) {
      return { success: false, error: 'Invalid credentials format in environment' };
    }

    return { success: true, data: credentials };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
    return { success: false, error: `Failed to build credentials: ${errorMessage}` };
  }
}

/**
 * Discord handler function for /admin_sync_users_to_sheets command
 * Implements Flow 3 deferred response pattern with background processing
 */
export function handleAdminSyncUsersToSheetsDiscord(
  interaction: DiscordInteraction,
  context: ExecutionContext,
  env: Env
): Response {
  // Immediate validation check
  const validationResult = performValidation(interaction, context, env);
  if (!validationResult.success) {
    return createErrorResponse(validationResult.error);
  }

  // Load credentials from environment variable
  const credentialsResult = loadCredentialsFromEnvironment(env);
  if (!credentialsResult.success) {
    return createErrorResponse(credentialsResult.error);
  }

  // Return ephemeral deferred response immediately (Flow 3 requirement: < 3 seconds)
  const deferredResponse = createDeferredResponse(true);

  // Schedule background processing with Discord notification
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const guildId = validationResult.data.extendedInteraction.guild_id ?? '';

  const syncParams: SyncParameters = {
    guildId: guildId,
    credentials: credentialsResult.data,
    requestId: requestId,
    initiatedBy: validationResult.data.userId,
    timestamp: timestamp,
  };

  // Use context.waitUntil for background work with notification
  context.waitUntil(executeAdminSyncAndNotify(interaction, env, syncParams));

  return deferredResponse;
}

/**
 * Convert technical errors to user-friendly messages
 */
function convertErrorToUserMessage(error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (errorMessage.includes('Bot lacks permission')) {
    return 'Bot needs "View Server Members" permission';
  }
  if (errorMessage.includes('authentication failed') || errorMessage.includes('OAuth failed')) {
    return 'Google Sheets configuration error';
  }
  if (errorMessage.includes('Discord API error')) {
    return 'Discord service temporarily unavailable';
  }
  if (errorMessage.includes('Failed to fetch members')) {
    return 'Could not access Discord server members';
  }
  if (errorMessage.includes('Failed to append members')) {
    return 'Could not update Google Sheets';
  }

  return 'Unexpected error - check server logs';
}
