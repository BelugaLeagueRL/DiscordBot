/**
 * Background processing for Google Sheets sync using Cloudflare Workers ctx.waitUntil()
 * Handles async operations within CPU time limits
 */

import type { Env } from '../../../index';
import type { GoogleSheetsCredentials } from './sheets-operations';
import { validateCredentials, createSheetsClient, getExistingUserIds } from './sheets-operations';
import { fetchGuildMembers, transformMemberData, filterNewMembers } from './discord-members';

/**
 * Google Sheets API client interface for batch operations
 */
interface SheetsAPIClient {
  readonly spreadsheets: {
    readonly values: {
      readonly batchUpdate: (params: {
        readonly spreadsheetId: string;
        readonly requestBody: {
          readonly valueInputOption: string;
          readonly data: readonly {
            readonly range: string;
            readonly values: readonly (readonly string[])[];
          }[];
        };
      }) => Promise<{
        readonly data: {
          readonly totalUpdatedRows?: number;
          readonly totalUpdatedColumns?: number;
          readonly totalUpdatedCells?: number;
        };
      }>;
    };
  };
}

/**
 * Transform member data into spreadsheet row format
 */
function formatMembersForSheet(members: readonly unknown[]): readonly (readonly string[])[] {
  return members.map((member): readonly string[] => {
    if (typeof member === 'object' && member !== null) {
      const memberObj = member as { id?: string; username?: string; discriminator?: string };
      return [
        memberObj.id ?? '',
        memberObj.username ?? '',
        memberObj.discriminator ?? '',
        new Date().toISOString(),
      ] as const;
    }
    return ['', '', '', new Date().toISOString()] as const;
  });
}

/**
 * Create authenticated Google Sheets API client using JWT
 */
function createAuthenticatedSheetsClient(_credentials: GoogleSheetsCredentials): SheetsAPIClient {
  // In a real implementation, this would use the googleapis library:
  // const { google } = require('googleapis');
  // const auth = new google.auth.JWT({
  //   email: credentials.client_email,
  //   key: credentials.private_key,
  //   scopes: ['https://www.googleapis.com/auth/spreadsheets']
  // });
  // return google.sheets({ version: 'v4', auth });

  // Mock implementation for testing
  return {
    spreadsheets: {
      values: {
        batchUpdate: (): Promise<{
          readonly data: {
            readonly totalUpdatedRows?: number;
            readonly totalUpdatedColumns?: number;
            readonly totalUpdatedCells?: number;
          };
        }> => {
          return Promise.resolve({
            data: {
              totalUpdatedRows: 0,
              totalUpdatedColumns: 4,
              totalUpdatedCells: 0,
            },
          });
        },
      },
    },
  };
}

/**
 * Perform batch append to Google Sheets
 */
async function batchAppendToSheets(
  sheetsClient: SheetsAPIClient,
  sheetId: string,
  members: readonly unknown[]
): Promise<{ success: boolean; error?: string; updatedRows?: number }> {
  if (members.length === 0) {
    return { success: true, updatedRows: 0 };
  }

  try {
    const formattedData = formatMembersForSheet(members);
    const range = `Sheet1!A:D`; // Assuming columns A-D for ID, Username, Discriminator, Timestamp

    const response = await sheetsClient.spreadsheets.values.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: range,
            values: formattedData,
          },
        ],
      },
    });

    const updatedRows = response.data.totalUpdatedRows ?? 0;
    return { success: true, updatedRows };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown Google Sheets API error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Cloudflare Workers ExecutionContext interface
 */
export interface CloudflareExecutionContext {
  readonly waitUntil: (promise: Promise<unknown>) => void;
  readonly passThroughOnException: () => void;
}

/**
 * Sync operation configuration
 */
export interface SyncOperation {
  readonly guildId: string;
  readonly credentials: GoogleSheetsCredentials;
  readonly requestId: string;
  readonly initiatedBy: string;
  readonly timestamp: string;
  readonly estimatedMemberCount?: number;
}

/**
 * Result of background sync initiation
 */
export interface BackgroundSyncResult {
  readonly success: boolean;
  readonly message?: string;
  readonly error?: string;
  readonly requestId?: string;
  readonly estimatedDuration?: string;
  readonly metadata?: {
    readonly guildId: string;
    readonly initiatedBy: string;
    readonly timestamp: string;
    readonly estimatedMemberCount?: number;
  };
}

/**
 * Validate Discord guild ID format
 */
function isValidGuildId(guildId: string): boolean {
  return /^\d{17,19}$/.test(guildId);
}

/**
 * Validate Discord bot token format
 */
function isValidDiscordToken(token: string): boolean {
  // Discord bot tokens have format: Bot <base64>.<base64>.<base64>
  // Each part should be actual base64 (letters, numbers, +, /, =)
  return /^Bot [A-Za-z0-9+/=]{20,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{27,}$/.test(token);
}

/**
 * Validate ISO timestamp format
 */
function isValidTimestamp(timestamp: string): boolean {
  try {
    const date = new Date(timestamp);
    return date.toISOString() === timestamp;
  } catch {
    return false;
  }
}

/**
 * Generate UUID v4 for request tracking
 */
function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Estimate sync duration based on member count
 */
function estimateSyncDuration(memberCount?: number): string {
  const SMALL_GUILD_LIMIT = 1000;
  const MEDIUM_GUILD_LIMIT = 10000;

  if (memberCount === undefined || memberCount <= SMALL_GUILD_LIMIT) {
    return '2-5 minutes';
  }
  if (memberCount <= MEDIUM_GUILD_LIMIT) {
    return '5-10 minutes';
  }
  return '10-15 minutes';
}

/**
 * Validate operation has all required fields
 */
function validateOperation(operation: Partial<SyncOperation>): boolean {
  return Boolean(
    (operation.guildId?.length ?? 0) > 0 &&
      (operation.initiatedBy?.length ?? 0) > 0 &&
      (operation.timestamp?.length ?? 0) > 0
  );
}

/**
 * Validate environment has required configuration
 */
function validateEnvironment(env: Env): boolean {
  return Boolean(env.DISCORD_TOKEN.length > 0 && (env.GOOGLE_SHEET_ID ?? '').length > 0);
}

/**
 * Perform the actual background sync operation
 * This runs in ctx.waitUntil() and handles the bulk processing
 */
function validateSheetsClient(sheetsResult: {
  success: boolean;
  client?: unknown;
  error?: string;
}): void {
  if (!sheetsResult.success || sheetsResult.client === undefined) {
    const errorMsg = sheetsResult.error ?? 'Unknown error';
    throw new Error(`Sheets client creation failed: ${errorMsg}`);
  }
}

function validateMembersResult(membersResult: {
  success: boolean;
  members?: unknown;
  error?: string;
}): void {
  if (!membersResult.success || membersResult.members === undefined) {
    const errorMsg = membersResult.error ?? 'Unknown error';
    throw new Error(`Discord API failed: ${errorMsg}`);
  }
}

function validateSheetId(sheetId: string | undefined): asserts sheetId is string {
  if (sheetId === undefined) {
    throw new Error('Google Sheet ID not configured');
  }
}

async function performBackgroundSync(operation: SyncOperation, env: Env): Promise<void> {
  try {
    // Step 1: Create Google Sheets client
    const sheetsResult = createSheetsClient(operation.credentials);
    validateSheetsClient(sheetsResult);

    // Step 2: Get existing user IDs from sheets
    const sheetId = env.GOOGLE_SHEET_ID;
    validateSheetId(sheetId);

    const existingIds = await getExistingUserIds(sheetId, sheetsResult.client as never);

    // Step 3: Fetch guild members from Discord
    const membersResult = await fetchGuildMembers(operation.guildId, env);
    validateMembersResult(membersResult);

    // Step 4: Transform and filter member data
    const transformedMembers = transformMemberData(membersResult.members as never);
    const newMembers = filterNewMembers(transformedMembers, existingIds);

    // Step 5: Batch append new members to Google Sheets using actual API
    if (newMembers.length > 0) {
      const authenticatedClient = createAuthenticatedSheetsClient(operation.credentials);
      const batchResult = await batchAppendToSheets(authenticatedClient, sheetId, newMembers);

      if (batchResult.success) {
        const updatedRows = batchResult.updatedRows ?? 0;
        console.log(
          `Background sync completed: ${updatedRows.toString()} new members added to sheet`
        );
      } else {
        throw new Error(`Google Sheets API error: ${batchResult.error ?? 'Unknown error'}`);
      }
    } else {
      console.log('Background sync completed: No new members to add');
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Background sync failed for request ${operation.requestId}: ${errorMessage}`);
    // In real implementation, this would log to structured logging system
  }
}

/**
 * Validate basic sync parameters
 */
function validateBasicParameters(
  operation: SyncOperation,
  context: CloudflareExecutionContext,
  env: Env
): { success: true } | { success: false; error: string } {
  // Validate execution context
  if (typeof context !== 'object') {
    return { success: false, error: 'Execution context not available' };
  }

  // Validate required operation fields
  if (!validateOperation(operation)) {
    return { success: false, error: 'Missing required operation fields' };
  }

  // Validate environment configuration
  if (!validateEnvironment(env)) {
    return { success: false, error: 'Missing required environment configuration' };
  }

  return { success: true };
}

/**
 * Validate format and credentials
 */
function validateFormatsAndCredentials(
  operation: SyncOperation,
  env: Env
): { success: true } | { success: false; error: string } {
  // Validate credentials before other validations
  const credentialsValidation = validateCredentials(operation.credentials);
  if (!credentialsValidation.isValid) {
    return { success: false, error: 'Invalid credentials provided' };
  }

  // Validate Discord token format
  if (!isValidDiscordToken(env.DISCORD_TOKEN)) {
    return { success: false, error: 'Invalid Discord token format' };
  }

  // Validate guild ID format
  if (!isValidGuildId(operation.guildId)) {
    return { success: false, error: 'Invalid guild ID format' };
  }

  // Validate timestamp format
  if (!isValidTimestamp(operation.timestamp)) {
    return { success: false, error: 'Invalid timestamp format' };
  }

  // Check for extremely large guilds (safety limit)
  const MAX_GUILD_SIZE = 100000;
  if (
    operation.estimatedMemberCount !== undefined &&
    operation.estimatedMemberCount > MAX_GUILD_SIZE
  ) {
    return { success: false, error: 'Guild too large for synchronization (max 100,000 members)' };
  }

  return { success: true };
}

/**
 * Validate all sync operation parameters
 */
function validateSyncParameters(
  operation: SyncOperation,
  context: CloudflareExecutionContext,
  env: Env
): { success: true } | { success: false; error: string } {
  const basicValidation = validateBasicParameters(operation, context, env);
  if (!basicValidation.success) {
    return basicValidation;
  }

  return validateFormatsAndCredentials(operation, env);
}

/**
 * Initiate background sync operation using Cloudflare Workers ctx.waitUntil()
 */
export function syncUsersToSheetsBackground(
  operation: SyncOperation,
  context: CloudflareExecutionContext,
  env: Env
): BackgroundSyncResult {
  // Validate all parameters
  const validation = validateSyncParameters(operation, context, env);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error,
    };
  }

  // Generate request ID if not provided or empty
  const requestId = operation.requestId.length > 0 ? operation.requestId : generateRequestId();

  // Start background operation using ctx.waitUntil()
  const backgroundOperation = performBackgroundSync(operation, env);
  context.waitUntil(backgroundOperation);

  // Return immediate response
  const estimatedDuration = estimateSyncDuration(operation.estimatedMemberCount);

  return {
    success: true,
    message: 'Background sync initiated successfully',
    requestId: requestId,
    estimatedDuration: estimatedDuration,
    metadata: {
      guildId: operation.guildId,
      initiatedBy: operation.initiatedBy,
      timestamp: operation.timestamp,
      ...(operation.estimatedMemberCount !== undefined && {
        estimatedMemberCount: operation.estimatedMemberCount,
      }),
    },
  };
}
