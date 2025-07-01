/**
 * Pure functions extracted from index.ts for true unit testing
 * These functions have no side effects and can be tested in isolation
 */

import type { Env } from '../index';

/**
 * Pure function: Validate test data structure
 */
export function isValidTestData(data: unknown): data is TestMemberData {
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

/**
 * Test data interface
 */
export interface TestMemberData {
  discord_id: string;
  discord_username_display: string;
  discord_username_actual: string;
  server_join_date: string;
  is_banned: boolean;
  is_active: boolean;
}

/**
 * Pure function: Build Google Sheets credentials from environment
 */
export function buildGoogleSheetsCredentials(env: Readonly<Env>): {
  client_email: string;
  private_key: string;
} {
  return {
    client_email: env.GOOGLE_SHEETS_CLIENT_EMAIL!,
    private_key: env.GOOGLE_SHEETS_PRIVATE_KEY!,
  };
}

/**
 * Pure function: Determine request handler type
 */
export function determineRequestHandler(
  request: Request
): 'health' | 'discord' | 'test-sheets' | 'cors' | 'unknown' {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return 'cors';
  }

  if (request.method === 'GET') {
    return 'health';
  }

  if (request.method === 'POST') {
    if (url.pathname.startsWith('/test-sheets')) {
      return 'test-sheets';
    }
    return 'discord';
  }

  return 'unknown';
}

/**
 * Pure function: Parse health check response structure
 */
export function buildHealthResponse(
  status: 'healthy' | 'unhealthy',
  timestamp: string,
  checks: Record<string, string>
): {
  status: string;
  message: string;
  timestamp: string;
  checks: Record<string, string>;
} {
  if (status === 'healthy') {
    return {
      status: 'healthy',
      message: 'Beluga Discord Bot is running!',
      timestamp,
      checks,
    };
  }

  return {
    status: 'unhealthy',
    message: 'Beluga Discord Bot has issues',
    timestamp,
    checks,
  };
}

/**
 * Pure function: Determine interaction handler name
 */
export function determineInteractionHandler(interaction: {
  type: number;
  data?: { name?: string };
}): string {
  if (interaction.type === 1) {
    // InteractionType.Ping
    return 'ping';
  }

  if (interaction.type === 2) {
    // InteractionType.ApplicationCommand
    return interaction.data?.name ?? 'unknown';
  }

  return 'unknown';
}

/**
 * Pure function: Build security headers
 */
export function createSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}

/**
 * Pure function: Build CORS headers
 */
export function createCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Signature-Ed25519, X-Signature-Timestamp',
  };
}

/**
 * Pure function: Format error response data
 */
export function formatErrorResponse(
  error: string,
  success: false = false
): {
  success: boolean;
  error: string;
} {
  return {
    success,
    error,
  };
}

/**
 * Pure function: Format success response data
 */
export function formatSuccessResponse<T>(data: T): {
  success: boolean;
  data: T;
} {
  return {
    success: true,
    data,
  };
}

/**
 * Pure function: Create Google Sheets read response data (Line 152 business logic)
 */
export function createSheetsReadResponseData(values: string[][]): {
  success: boolean;
  values: string[][];
  totalRows: number;
} {
  return {
    success: true,
    values: values ?? [],
    totalRows: (values ?? []).length,
  };
}

/**
 * Pure function: Create Google Sheets delete response data (Lines 216-220 business logic)
 */
export function createSheetsDeleteResponseData(
  deletedRowsCount: number,
  discordId: string
): {
  success: boolean;
  deletedRowsCount: number;
  discordId: string;
} {
  return {
    success: true,
    deletedRowsCount: deletedRowsCount ?? 0,
    discordId,
  };
}

/**
 * Pure function: Format global error message (Line 662 business logic)
 */
export function formatGlobalErrorMessage(errorMsg: string): string {
  return `Global error (no audit context): ${errorMsg}`;
}
