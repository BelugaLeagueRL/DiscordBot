/**
 * Builder pattern for Google Sheets API operations
 * Handles URL construction, authentication, and API calls
 */

/**
 * Google Sheets API response types
 */
interface _GoogleSheetsAppendResponse {
  spreadsheetId: string;
  updates: {
    spreadsheetId: string;
    updatedRows: number;
    updatedColumns: number;
    updatedCells: number;
    updatedRange: string;
  };
}

interface _GoogleSheetsGetResponse {
  range: string;
  majorDimension: string;
  values: string[][];
}

export interface GoogleSheetsCredentials {
  type?: 'service_account';
  project_id?: string;
  private_key_id?: string;
  private_key: string;
  client_email: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
  auth_provider_x509_cert_url?: string;
  client_x509_cert_url?: string;
  universe_domain?: string;
}

interface _GoogleOAuthTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface _GoogleSheetsBatchUpdateResponse {
  spreadsheetId: string;
  replies: unknown[];
}

const TOKEN_EXPIRY_SECONDS = 3600;

export class GoogleSheetsApiBuilder {
  private spreadsheetId: string = '';
  private range: string = '';
  private valueInputOption: string = 'USER_ENTERED';
  private accessToken: string = '';
  private values: string[][] = [];

  /**
   * Set the spreadsheet ID
   */
  setSpreadsheetId(id: string): this {
    this.spreadsheetId = id;
    return this;
  }

  /**
   * Set the range in A1 notation (e.g., "Sheet1!A:G")
   */
  setRange(range: string): this {
    this.range = range;
    return this;
  }

  /**
   * Set how input data should be interpreted
   */
  setValueInputOption(option: 'RAW' | 'USER_ENTERED' | 'INPUT_VALUE_OPTION_UNSPECIFIED'): this {
    this.valueInputOption = option;
    return this;
  }

  /**
   * Set the OAuth access token
   */
  setAccessToken(token: string): this {
    this.accessToken = token;
    return this;
  }

  /**
   * Add a row of values
   */
  addRow(row: string[]): this {
    this.values.push(row);
    return this;
  }

  /**
   * Set all values at once
   */
  setValues(values: string[][]): this {
    this.values = values;
    return this;
  }

  /**
   * Build the append API URL
   */
  private buildAppendUrl(): string {
    return `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${this.range}:append?valueInputOption=${this.valueInputOption}`;
  }

  /**
   * Build the get values API URL
   */
  private buildGetUrl(): string {
    return `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${this.range}`;
  }

  /**
   * Build the batch update API URL
   */
  private buildBatchUpdateUrl(): string {
    return `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}:batchUpdate`;
  }

  /**
   * Execute append operation
   */
  async append(): Promise<{
    success: boolean;
    updatedRows?: number;
    error?: string;
  }> {
    try {
      if (this.spreadsheetId === '' || this.range === '' || this.accessToken === '') {
        throw new Error(
          'Missing required fields: spreadsheetId, range, and accessToken are required'
        );
      }

      if (this.values.length === 0) {
        throw new Error('No values to append');
      }

      const response = await fetch(this.buildAppendUrl(), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: this.values,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Google Sheets API error: ${String(response.status)} ${response.statusText} - ${errorText}`
        );
      }

      const data = (await response.json()) as _GoogleSheetsAppendResponse;

      return {
        success: true,
        updatedRows: data.updates?.updatedRows ?? 0,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Execute get values operation
   */
  async get(): Promise<{
    success: boolean;
    values?: string[][];
    error?: string;
  }> {
    try {
      if (this.spreadsheetId === '' || this.range === '' || this.accessToken === '') {
        throw new Error(
          'Missing required fields: spreadsheetId, range, and accessToken are required'
        );
      }

      const response = await fetch(this.buildGetUrl(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Google Sheets API error: ${String(response.status)} ${response.statusText} - ${errorText}`
        );
      }

      const data = (await response.json()) as _GoogleSheetsGetResponse;

      return {
        success: true,
        values: data.values ?? [],
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Find row indexes that contain a specific value in a specific column
   */
  async findRowsByValue(
    columnIndex: number,
    searchValue: string
  ): Promise<{
    success: boolean;
    rowIndexes?: number[];
    error?: string;
  }> {
    try {
      if (this.spreadsheetId === '' || this.range === '' || this.accessToken === '') {
        throw new Error(
          'Missing required fields: spreadsheetId, range, and accessToken are required'
        );
      }

      const result = await this.get();
      if (!result.success || !result.values) {
        return {
          success: false,
          error: result.error ?? 'Failed to get values for search',
        };
      }

      // Find rows that match the search value in the specified column
      // Skip the header row (index 0) and start from index 1
      const matchingIndexes: number[] = [];
      result.values.forEach((row, index) => {
        if (index > 0) {
          const cellValue = row[columnIndex];

          // Normalize both values for comparison
          const normalizedCellValue = String(cellValue || '').trim();
          const normalizedSearchValue = String(searchValue || '').trim();

          if (normalizedCellValue === normalizedSearchValue) {
            matchingIndexes.push(index + 1); // +1 because Google Sheets is 1-indexed
          }
        }
      });

      return {
        success: true,
        rowIndexes: matchingIndexes,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Delete specific rows by their row numbers (1-indexed)
   */
  async deleteRows(
    rowNumbers: number[],
    sheetId: number = 0
  ): Promise<{
    success: boolean;
    deletedRowsCount?: number;
    error?: string;
  }> {
    try {
      if (this.spreadsheetId === '' || this.accessToken === '') {
        throw new Error('Missing required fields: spreadsheetId and accessToken are required');
      }

      if (rowNumbers.length === 0) {
        return {
          success: true,
          deletedRowsCount: 0,
        };
      }

      // Sort row numbers in descending order to avoid index shifting issues
      const sortedRows = [...rowNumbers].sort((a, b) => b - a);

      // Create delete requests for each row
      const requests = sortedRows.map(rowNumber => ({
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowNumber - 1, // Convert to 0-indexed
            endIndex: rowNumber, // Exclusive end
          },
        },
      }));

      const response = await fetch(this.buildBatchUpdateUrl(), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Google Sheets API error: ${String(response.status)} ${response.statusText} - ${errorText}`
        );
      }

      (await response.json()) as _GoogleSheetsBatchUpdateResponse;

      // The count equals the number of delete requests we made
      const deletedRowsCount = requests.length;

      return {
        success: true,
        deletedRowsCount,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Convenience method to delete rows by Discord ID
   */
  async deleteRowsByDiscordId(
    discordId: string,
    sheetId: number = 0
  ): Promise<{
    success: boolean;
    deletedRowsCount?: number;
    error?: string;
  }> {
    try {
      // Find rows with the specified Discord ID (column 0)
      const searchResult = await this.findRowsByValue(0, discordId);
      if (!searchResult.success || !searchResult.rowIndexes) {
        return {
          success: false,
          error: searchResult.error ?? 'Failed to find rows with Discord ID',
        };
      }

      if (searchResult.rowIndexes.length === 0) {
        return {
          success: true,
          deletedRowsCount: 0,
        };
      }

      // Delete the found rows
      return await this.deleteRows(searchResult.rowIndexes, sheetId);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Reset the builder to initial state
   */
  reset(): this {
    this.spreadsheetId = '';
    this.range = '';
    this.valueInputOption = 'USER_ENTERED';
    this.accessToken = '';
    this.values = [];
    return this;
  }

  /**
   * Create a new builder instance
   */
  static create(): GoogleSheetsApiBuilder {
    return new GoogleSheetsApiBuilder();
  }
}

/**
 * Helper function to create a member data row
 */
export function createMemberRow(member: {
  discord_id: string;
  discord_username_display: string;
  discord_username_actual: string;
  server_join_date: string;
  is_banned: boolean;
  is_active: boolean;
  last_updated?: string;
}): string[] {
  return [
    member.discord_id,
    member.discord_username_display,
    member.discord_username_actual,
    member.server_join_date,
    member.is_banned.toString(),
    member.is_active.toString(),
    member.last_updated || new Date().toISOString(),
  ];
}

/**
 * OAuth token builder for Google Sheets
 */
export class GoogleOAuthBuilder {
  private credentials: GoogleSheetsCredentials = {
    client_email: '',
    private_key: '',
  };

  setCredentials(creds: GoogleSheetsCredentials): this {
    this.credentials = creds;
    return this;
  }

  async getAccessToken(): Promise<string> {
    if (this.credentials.client_email === '' || this.credentials.private_key === '') {
      throw new Error('OAuth credentials not set');
    }

    const jwt = await import('@tsndr/cloudflare-worker-jwt');

    const jwtToken = await jwt.default.sign(
      {
        iss: this.credentials.client_email,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://accounts.google.com/o/oauth2/token',
        exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS,
        iat: Math.floor(Date.now() / 1000),
      },
      this.credentials.private_key,
      { algorithm: 'RS256' }
    );

    const tokenResponse = await fetch('https://accounts.google.com/o/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwtToken,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`OAuth failed: ${String(tokenResponse.status)} ${tokenResponse.statusText}`);
    }

    const tokenData = (await tokenResponse.json()) as _GoogleOAuthTokenResponse;
    return tokenData.access_token;
  }

  static create(): GoogleOAuthBuilder {
    return new GoogleOAuthBuilder();
  }
}
