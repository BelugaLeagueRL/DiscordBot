/**
 * Main entry point for the Beluga Discord Bot
 * Based on Discord's official Cloudflare Workers sample app
 * Enhanced with comprehensive security and audit logging
 */

import { InteractionType, InteractionResponseType, createErrorResponse } from './utils/discord';
import { handleRegisterCommand } from './application_commands/register';
import { handleAdminSyncUsersToSheetsDiscord } from './application_commands/google-sheets/admin-sync-users-to-sheets/command-handler';
import {
  extractSecurityContext,
  verifyDiscordRequestSecure,
  createSecurityHeaders,
  withTimeout,
  cleanupRateLimits,
  type SecurityContext,
} from './middleware/security';
import { AuditLogger } from './utils/audit';
import { createProductionHealthCheck } from './utils/health-check';
import { formatGlobalErrorMessage } from './utils/index-functions';
import type { DiscordInteraction } from './types/discord';

export interface Env {
  readonly DISCORD_TOKEN: string;
  readonly DISCORD_PUBLIC_KEY: string;
  readonly DISCORD_APPLICATION_ID: string;
  readonly DATABASE_URL?: string;
  readonly GOOGLE_SHEETS_API_KEY?: string;
  readonly GOOGLE_SHEET_ID?: string;
  readonly GOOGLE_SHEETS_TYPE?: string;
  readonly GOOGLE_SHEETS_PROJECT_ID?: string;
  readonly GOOGLE_SHEETS_PRIVATE_KEY_ID?: string;
  readonly GOOGLE_SHEETS_PRIVATE_KEY?: string;
  readonly GOOGLE_SHEETS_CLIENT_EMAIL?: string;
  readonly GOOGLE_SHEETS_CLIENT_ID?: string;
  readonly GOOGLE_SHEETS_AUTH_URI?: string;
  readonly GOOGLE_SHEETS_TOKEN_URI?: string;
  readonly GOOGLE_SHEETS_AUTH_PROVIDER_X509_CERT_URL?: string;
  readonly GOOGLE_SHEETS_CLIENT_X509_CERT_URL?: string;
  readonly GOOGLE_SHEETS_UNIVERSE_DOMAIN?: string;
  readonly ENVIRONMENT: string;
  readonly REGISTER_COMMAND_REQUEST_CHANNEL_ID?: string;
  readonly REGISTER_COMMAND_RESPONSE_CHANNEL_ID?: string;
  readonly TEST_CHANNEL_ID?: string;
  readonly PRIVILEGED_USER_ID?: string;
}

/**
 * Handle CORS preflight requests
 */
function handleCorsRequest(): Response {
  return new Response(null, {
    headers: {
      ...createSecurityHeaders(),
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-Signature-Ed25519, X-Signature-Timestamp',
    },
  });
}

/**
 * Handle health check requests with production monitoring
 */
function handleHealthCheck(env: Env): Response {
  const healthCheck = createProductionHealthCheck(env);
  const healthStatus = healthCheck.getStatus();

  if (healthStatus.status === 'healthy') {
    return new Response(
      JSON.stringify({
        status: 'healthy',
        message: 'Beluga Discord Bot is running!',
        timestamp: healthStatus.timestamp,
        checks: healthStatus.checks,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...createSecurityHeaders(),
        },
      }
    );
  } else {
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        message: 'Beluga Discord Bot has issues',
        timestamp: healthStatus.timestamp,
        checks: healthStatus.checks,
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          ...createSecurityHeaders(),
        },
      }
    );
  }
}

/**
 * Build Google Sheets credentials from environment variables
 */
function buildGoogleSheetsCredentials(env: Readonly<Env>): {
  client_email: string;
  private_key: string;
} {
  return {
    client_email: env.GOOGLE_SHEETS_CLIENT_EMAIL!,
    private_key: env.GOOGLE_SHEETS_PRIVATE_KEY!,
  };
}

/**
 * Handle test read requests for Google Sheets integration
 */
async function handleTestSheetsRead(
  request: Readonly<Request>,
  env: Readonly<Env>,
  audit: Readonly<AuditLogger>,
  context: Readonly<SecurityContext>
): Promise<Response> {
  try {
    audit.logRequestReceived(context, { method: request.method, path: '/test-sheets-read' });

    // Build credentials from environment
    const credentials = buildGoogleSheetsCredentials(env);

    // Use the builder pattern for cleaner API calls
    const { GoogleSheetsApiBuilder, GoogleOAuthBuilder } = await import(
      './utils/google-sheets-builder'
    );

    // Get OAuth token
    const accessToken = await GoogleOAuthBuilder.create()
      .setCredentials(credentials)
      .getAccessToken();

    // Read from Google Sheets
    const result = await GoogleSheetsApiBuilder.create()
      .setSpreadsheetId(env.GOOGLE_SHEET_ID!)
      .setRange('A:G')
      .setAccessToken(accessToken)
      .get();

    if (!result.success) {
      throw new Error(result.error ?? 'Unknown read error');
    }

    return new Response(
      JSON.stringify({
        success: true,
        values: result.values ?? [],
        totalRows: (result.values ?? []).length,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    audit.logError(context, { error: errorMessage });
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Handle test delete requests for Google Sheets integration
 */
async function handleTestSheetsDelete(
  request: Readonly<Request>,
  env: Readonly<Env>,
  audit: Readonly<AuditLogger>,
  context: Readonly<SecurityContext>
): Promise<Response> {
  try {
    audit.logRequestReceived(context, { method: request.method, path: '/test-sheets-delete' });

    const { discordId } = (await request.json()) as { discordId: string };

    // Build credentials from environment
    const credentials = buildGoogleSheetsCredentials(env);

    // Use the builder pattern for cleaner API calls
    const { GoogleSheetsApiBuilder, GoogleOAuthBuilder } = await import(
      './utils/google-sheets-builder'
    );

    // Get OAuth token
    const accessToken = await GoogleOAuthBuilder.create()
      .setCredentials(credentials)
      .getAccessToken();

    // Delete rows by Discord ID
    const result = await GoogleSheetsApiBuilder.create()
      .setSpreadsheetId(env.GOOGLE_SHEET_ID!)
      .setRange('A:G')
      .setAccessToken(accessToken)
      .deleteRowsByDiscordId(discordId);

    if (!result.success) {
      throw new Error(result.error ?? 'Unknown delete error');
    }

    return new Response(
      JSON.stringify({
        success: true,
        deletedRowsCount: result.deletedRowsCount ?? 0,
        discordId,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    audit.logError(context, { error: errorMessage });
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Handle test requests for Google Sheets integration
 */
async function handleTestSheetsWrite(
  request: Readonly<Request>,
  env: Readonly<Env>,
  audit: Readonly<AuditLogger>,
  context: Readonly<SecurityContext>
): Promise<Response> {
  try {
    audit.logRequestReceived(context, { method: request.method, path: '/test-sheets-write' });

    const { testData } = (await request.json()) as { testData: unknown };

    // Type guard for test data
    interface TestMemberData {
      discord_id: string;
      discord_username_display: string;
      discord_username_actual: string;
      server_join_date: string;
      is_banned: boolean;
      is_active: boolean;
    }

    function isValidTestData(data: unknown): data is TestMemberData {
      if (typeof data !== 'object' || data === null) {
        return false;
      }

      const obj = data as Record<string, unknown>;
      return (
        typeof obj['discord_id'] === 'string' &&
        typeof obj['discord_username_display'] === 'string' &&
        typeof obj['discord_username_actual'] === 'string' &&
        typeof obj['server_join_date'] === 'string' &&
        typeof obj['is_banned'] === 'boolean' &&
        typeof obj['is_active'] === 'boolean'
      );
    }

    if (!isValidTestData(testData)) {
      return new Response('Invalid test data format', { status: 400 });
    }

    // Build credentials from environment
    const credentials = buildGoogleSheetsCredentials(env);

    // Use the builder pattern for cleaner API calls
    const { GoogleSheetsApiBuilder, GoogleOAuthBuilder, createMemberRow } = await import(
      './utils/google-sheets-builder'
    );

    // Get OAuth token
    const accessToken = await GoogleOAuthBuilder.create()
      .setCredentials(credentials)
      .getAccessToken();

    // Create member row
    const memberRow = createMemberRow({
      discord_id: testData.discord_id,
      discord_username_display: testData.discord_username_display,
      discord_username_actual: testData.discord_username_actual,
      server_join_date: testData.server_join_date,
      is_banned: testData.is_banned,
      is_active: testData.is_active,
    });

    // Append to Google Sheets
    const result = await GoogleSheetsApiBuilder.create()
      .setSpreadsheetId(env.GOOGLE_SHEET_ID!)
      .setRange('A:G')
      .setAccessToken(accessToken)
      .addRow(memberRow)
      .append();

    if (!result.success) {
      throw new Error(result.error ?? 'Unknown append error');
    }

    const writeResult = { data: { totalUpdatedRows: result.updatedRows ?? 0 } };

    return new Response(
      JSON.stringify({
        success: true,
        rowsWritten: writeResult.data.totalUpdatedRows,
        testData: memberRow,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    audit.logError(context, { error: errorMessage });
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Handle method not allowed
 */
function handleMethodNotAllowed(): Response {
  return new Response('Method not allowed', {
    status: 405,
    headers: createSecurityHeaders(),
  });
}

/**
 * Handle request validation failure
 */
function handleValidationFailure(
  audit: Readonly<AuditLogger>,
  context: Readonly<SecurityContext>,
  error: string
): Response {
  audit.logRequestRejected(context, { reason: error });

  // Log security violations for specific errors
  if (error.includes('rate limit') || error.includes('signature') || error.includes('timestamp')) {
    audit.logSecurityViolation(context, { violationType: 'REQUEST_VALIDATION', details: error });
  }

  return new Response('Unauthorized', {
    status: 401,
    headers: createSecurityHeaders(),
  });
}

/**
 * Parse interaction from request
 */
async function parseInteraction(request: Readonly<Request>): Promise<DiscordInteraction> {
  const result = await withTimeout(request.json());
  return result as DiscordInteraction;
}

/**
 * Handle PING interaction
 */
function handlePingInteraction(
  audit: Readonly<AuditLogger>,
  context: Readonly<SecurityContext>,
  interaction: Readonly<DiscordInteraction>,
  startTime: number
): Response {
  const responseTime = Date.now() - startTime;
  audit.logCommandExecution(context, {
    interaction,
    success: true,
    responseTime,
  });

  return new Response(JSON.stringify({ type: InteractionResponseType.Pong }), {
    headers: {
      'Content-Type': 'application/json',
      ...createSecurityHeaders(),
    },
  });
}

/**
 * Handle application command
 */
async function handleApplicationCommand(
  params: Readonly<{
    readonly interaction: DiscordInteraction;
    readonly env: Env;
    readonly audit: AuditLogger;
    readonly context: SecurityContext;
    readonly ctx: ExecutionContext;
  }>
): Promise<Response> {
  const { interaction, env, audit, context, ctx } = params;
  const { name } = interaction.data ?? { name: '' };
  const commandStartTime = Date.now();

  try {
    let response: Response;

    switch (name) {
      case 'register':
        response = await withTimeout(Promise.resolve(handleRegisterCommand(interaction, env, ctx)));
        break;

      case 'admin_sync_users_to_sheets':
        response = handleAdminSyncUsersToSheetsDiscord(interaction, ctx, env);
        break;

      default:
        audit.logError(context, {
          error: `Unknown command: ${name}`,
          metadata: { commandName: name },
        });
        response = createErrorResponse('Unknown command. Please try again.');
        break;
    }

    const responseTime = Date.now() - commandStartTime;
    audit.logCommandExecution(context, {
      interaction,
      success: true,
      responseTime,
    });

    // Add security headers to response
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(createSecurityHeaders())) {
      headers.set(key, value);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error: unknown) {
    const responseTime = Date.now() - commandStartTime;
    const errorMsg = error instanceof Error ? error.message : 'Command execution failed';
    audit.logCommandExecution(context, {
      interaction,
      success: false,
      responseTime,
      error: errorMsg,
    });

    return createErrorResponse('An error occurred while processing your command.');
  }
}

/**
 * Handle unknown interaction type
 */
function handleUnknownInteraction(
  audit: Readonly<AuditLogger>,
  context: Readonly<SecurityContext>,
  interaction: Readonly<DiscordInteraction>
): Response {
  audit.logError(context, {
    error: `Unknown interaction type: ${String(interaction.type)}`,
    metadata: { interactionType: interaction.type },
  });
  return new Response('Bad request', {
    status: 400,
    headers: createSecurityHeaders(),
  });
}

/**
 * Initialize request processing
 */
function initializeRequest(
  request: Readonly<Request>,
  env: Readonly<Env>
): {
  context: SecurityContext;
  audit: AuditLogger;
} {
  const context = extractSecurityContext(request);
  const audit = new AuditLogger(env.ENVIRONMENT === '' ? 'development' : env.ENVIRONMENT);

  // Cleanup rate limits periodically
  const CLEANUP_PROBABILITY = 0.01; // 1% chance
  if (Math.random() < CLEANUP_PROBABILITY) {
    cleanupRateLimits();
  }

  audit.logRequestReceived(context, {
    method: request.method,
    path: new URL(request.url).pathname,
  });

  return { context, audit };
}

/**
 * Handle method routing
 */
async function handleMethodRouting(
  request: Readonly<Request>,
  env: Readonly<Env>,
  audit: Readonly<AuditLogger>,
  context: Readonly<SecurityContext>
): Promise<Response | null> {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    audit.logHealthCheck(context);
    return handleCorsRequest();
  }

  // Handle GET request for health check
  if (request.method === 'GET') {
    audit.logHealthCheck(context);
    return handleHealthCheck(env);
  }

  // Handle POST request for test endpoints
  if (request.method === 'POST') {
    const url = new URL(request.url);
    if (url.pathname === '/test-sheets-write') {
      return await handleTestSheetsWrite(request, env, audit, context);
    }
    if (url.pathname === '/test-sheets-read') {
      return await handleTestSheetsRead(request, env, audit, context);
    }
    if (url.pathname === '/test-sheets-delete') {
      return await handleTestSheetsDelete(request, env, audit, context);
    }
  }

  // Only handle POST requests for Discord interactions
  if (request.method !== 'POST') {
    audit.logRequestRejected(context, { reason: 'Method not allowed' });
    return handleMethodNotAllowed();
  }

  return null; // Continue with POST processing
}

/**
 * Process Discord interaction
 */
async function processDiscordInteraction(
  requestData: Readonly<{
    readonly request: Request;
    readonly env: Env;
    readonly audit: AuditLogger;
    readonly context: SecurityContext;
    readonly startTime: number;
    readonly ctx: ExecutionContext;
  }>
): Promise<Response> {
  const { request, env, audit, context, startTime, ctx } = requestData;
  // Enhanced Discord request verification with security checks
  const validationResult = await withTimeout(
    verifyDiscordRequestSecure(request, env.DISCORD_PUBLIC_KEY, context)
  );

  if (!validationResult.isValid) {
    const error = validationResult.error ?? 'Request validation failed';
    return handleValidationFailure(audit, context, error);
  }

  audit.logRequestVerified(context);

  // Parse interaction with timeout and error handling
  let interaction: DiscordInteraction;
  try {
    interaction = await parseInteraction(request);
  } catch (error: unknown) {
    const errorMsg = 'Failed to parse interaction JSON';
    audit.logError(context, {
      error: errorMsg,
      metadata: {
        parseError: error instanceof Error ? error.message : 'Unknown',
      },
    });
    return createErrorResponse('Invalid request format');
  }

  // Handle ping from Discord
  if (interaction.type === (InteractionType.Ping as number)) {
    return handlePingInteraction(audit, context, interaction, startTime);
  }

  // Handle application commands
  if (interaction.type === (InteractionType.ApplicationCommand as number)) {
    return await handleApplicationCommand({ interaction, env, audit, context, ctx });
  }

  // Handle unknown interaction types
  return handleUnknownInteraction(audit, context, interaction);
}

export default {
  async fetch(
    request: Readonly<Request>,
    env: Readonly<Env>,
    ctx: ExecutionContext
  ): Promise<Response> {
    const startTime = Date.now();
    let context: SecurityContext | undefined;
    let audit: AuditLogger | undefined;

    try {
      // Initialize request processing
      const init = initializeRequest(request, env);
      context = init.context;
      audit = init.audit;

      // Handle method routing
      const methodResponse = await handleMethodRouting(request, env, audit, context);
      if (methodResponse !== null) {
        return methodResponse;
      }

      // Process Discord interaction
      return await processDiscordInteraction({ request, env, audit, context, startTime, ctx });
    } catch (error: unknown) {
      // Global error handler
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';

      if (audit !== undefined && context !== undefined) {
        audit.logError(context, {
          error: errorMsg,
          metadata: {
            stack: error instanceof Error ? error.stack : undefined,
            responseTime: Date.now() - startTime,
          },
        });
      } else {
        console.error(formatGlobalErrorMessage(errorMsg));
      }

      return new Response('Internal server error', {
        status: 500,
        headers: createSecurityHeaders(),
      });
    }
  },
};
