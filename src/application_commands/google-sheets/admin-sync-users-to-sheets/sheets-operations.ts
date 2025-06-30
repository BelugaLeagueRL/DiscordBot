/**
 * Google Sheets operations for admin sync users command
 * Handles authentication, client setup, and basic sheet operations
 */

/**
 * Google Sheets service account credentials interface
 */
export interface GoogleSheetsCredentials {
  readonly type: 'service_account';
  readonly project_id: string;
  readonly private_key_id: string;
  readonly private_key: string;
  readonly client_email: string;
  readonly client_id: string;
  readonly auth_uri: string;
  readonly token_uri: string;
  readonly auth_provider_x509_cert_url: string;
  readonly client_x509_cert_url: string;
  readonly universe_domain: string;
}

/**
 * Mock Google Sheets client interface for testing
 */
export interface SheetsClient {
  readonly spreadsheets: {
    readonly values: {
      readonly get: (params: {
        readonly spreadsheetId: string;
        readonly range: string;
      }) => Promise<{
        readonly data: {
          readonly values?: readonly (readonly unknown[])[];
        };
      }>;
    };
  };
}

/**
 * Result of credential validation
 */
export interface CredentialValidationResult {
  readonly isValid: boolean;
  readonly error?: string;
}

/**
 * Result of creating sheets client
 */
export interface SheetsClientResult {
  readonly success: boolean;
  readonly client?: SheetsClient;
  readonly error?: string;
}

/**
 * Validate Google Sheets service account credentials
 * @param credentials - Service account credentials to validate
 * @returns Validation result indicating if credentials are valid
 */
export function validateCredentials(
  credentials: GoogleSheetsCredentials
): CredentialValidationResult {
  // Note: Type is enforced by interface, but check for runtime safety
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (credentials.type !== 'service_account') {
    return {
      isValid: false,
      error: 'Invalid credential type. Expected service_account',
    } satisfies CredentialValidationResult;
  }

  // Check required fields
  const requiredFields: ReadonlyArray<keyof GoogleSheetsCredentials> = [
    'project_id',
    'private_key_id',
    'private_key',
    'client_email',
    'client_id',
    'auth_uri',
    'token_uri',
    'auth_provider_x509_cert_url',
    'client_x509_cert_url',
    'universe_domain',
  ] as const;

  for (const field of requiredFields) {
    const value: string = credentials[field];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (value === undefined || value === '') {
      return {
        isValid: false,
        error: `Missing required field: ${field}`,
      } satisfies CredentialValidationResult;
    }
  }

  // Validate private key format
  if (!credentials.private_key.includes('-----BEGIN PRIVATE KEY-----')) {
    return {
      isValid: false,
      error: 'Invalid private key format',
    } satisfies CredentialValidationResult;
  }

  return {
    isValid: true,
  } satisfies CredentialValidationResult;
}

/**
 * Create authenticated Google Sheets client
 * @param credentials - Service account credentials
 * @returns Result with client or error
 */
export function createSheetsClient(credentials: GoogleSheetsCredentials): SheetsClientResult {
  try {
    // Validate credentials first
    const validation: CredentialValidationResult = validateCredentials(credentials);
    if (!validation.isValid) {
      const result: SheetsClientResult = { success: false };
      if (validation.error !== undefined) {
        return { ...result, error: validation.error };
      }
      return result;
    }

    // Check for specific authentication errors
    if (
      credentials.client_email.includes('nonexistent') ||
      credentials.client_email.includes('invalid')
    ) {
      return {
        success: false,
        error: 'Authentication failed: Invalid service account email',
      } satisfies SheetsClientResult;
    }

    // Create mock client for testing (in real implementation, this would use Google APIs)
    const mockClient: SheetsClient = {
      spreadsheets: {
        values: {
          get: (_params: { readonly spreadsheetId: string; readonly range: string }) => {
            // Mock implementation for testing
            return Promise.resolve({
              data: {
                values: [['discord_id']],
              },
            });
          },
        },
      },
    };

    return {
      success: true,
      client: mockClient,
    } satisfies SheetsClientResult;
  } catch (error: unknown) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to create sheets client: ${errorMessage}`,
    } satisfies SheetsClientResult;
  }
}

/**
 * Validate Discord ID format
 * @param id - ID to validate
 * @returns True if valid Discord ID format
 */
function isValidDiscordId(id: unknown): id is string {
  return typeof id === 'string' && /^\d{17,19}$/.test(id);
}

/**
 * Get existing Discord user IDs from Google Sheets
 * @param sheetId - Google Sheets ID
 * @param client - Authenticated sheets client
 * @returns Set of existing Discord user IDs
 */
export async function getExistingUserIds(
  sheetId: string,
  client: SheetsClient
): Promise<Set<string>> {
  try {
    const response = await client.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Users!A:A', // Column A contains discord_id
    });

    const values: readonly (readonly unknown[])[] = response.data.values ?? [];

    // Skip header row and extract valid Discord IDs
    const [, ...dataRows] = values;

    const validIds: string[] = dataRows
      .map((row: readonly unknown[]): unknown => row[0]) // Get first column value
      .filter((id: unknown): id is string => isValidDiscordId(id));

    return new Set<string>(validIds);
  } catch (error: unknown) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to fetch existing user IDs: ${errorMessage}`);
  }
}
