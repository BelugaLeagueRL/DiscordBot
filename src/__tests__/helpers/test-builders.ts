/**
 * Test Data Builders using Fluent API pattern
 * Replaces Object Mother antipatterns with flexible, composable builders
 * Based on 2025 best practices combining Object Mother + Builder patterns
 */

import { SecurityTestFactory } from './security-test-factory';

/**
 * Base builder interface for fluent API
 */
export interface TestDataBuilder<T> {
  build(): T;
}

/**
 * Google Sheets Credentials Builder
 */
export class CredentialsBuilder
  implements
    TestDataBuilder<{
      client_email: string;
      private_key: string;
    }>
{
  private email: string = 'test-service@test-project.iam.gserviceaccount.com';
  private key: string =
    '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC1234567890...\n-----END PRIVATE KEY-----\n';

  withEmail(email: string): this {
    this.email = email;
    return this;
  }

  withValidPrivateKey(): this {
    this.key =
      '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC1234567890...\n-----END PRIVATE KEY-----\n';
    return this;
  }

  withInvalidPrivateKey(): this {
    this.key = 'not-a-valid-private-key';
    return this;
  }

  withMalformedPrivateKey(): this {
    this.key = '-----BEGIN PRIVATE KEY-----\nINVALID_KEY_DATA\n-----END PRIVATE KEY-----\n';
    return this;
  }

  withEmptyFields(): this {
    this.email = '';
    this.key = '';
    return this;
  }

  build() {
    return {
      client_email: this.email,
      private_key: this.key,
    };
  }
}

/**
 * JWT Configuration Builder
 */
export class JwtConfigBuilder
  implements
    TestDataBuilder<{
      scope: string;
      aud: string;
      exp: number;
      iat: number;
    }>
{
  private scope: string = 'https://www.googleapis.com/auth/spreadsheets';
  private aud: string = 'https://oauth2.googleapis.com/token';
  private expiry: number = Math.floor(Date.now() / 1000) + 3600;
  private issuedAt: number = Math.floor(Date.now() / 1000);

  withScope(scope: string): this {
    this.scope = scope;
    return this;
  }

  withAudience(aud: string): this {
    this.aud = aud;
    return this;
  }

  withExpiry(exp: number): this {
    this.expiry = exp;
    return this;
  }

  withIssuedAt(iat: number): this {
    this.issuedAt = iat;
    return this;
  }

  withEmptyScope(): this {
    this.scope = '';
    return this;
  }

  build() {
    return {
      scope: this.scope,
      aud: this.aud,
      exp: this.expiry,
      iat: this.issuedAt,
    };
  }
}

/**
 * OAuth Token Response Builder
 */
export class OAuthResponseBuilder
  implements
    TestDataBuilder<{
      access_token?: string;
      expires_in?: number | string;
      token_type?: string;
      error?: string;
      error_description?: string | undefined;
    }>
{
  private accessToken: string = SecurityTestFactory.fakeOAuthToken();
  private expiresIn: number | string = 3600;
  private tokenType: string = 'Bearer';
  private error?: string;
  private errorDescription: string | undefined = undefined;

  withAccessToken(token: string): this {
    this.accessToken = token;
    return this;
  }

  withExpiresIn(expires: number | string): this {
    this.expiresIn = expires;
    return this;
  }

  withTokenType(type: string): this {
    this.tokenType = type;
    return this;
  }

  withError(error: string, description?: string): this {
    this.error = error;
    this.errorDescription = description;
    return this;
  }

  withMissingAccessToken(): this {
    this.accessToken = undefined as any;
    return this;
  }

  withInvalidExpiresIn(): this {
    this.expiresIn = 'not-a-number';
    return this;
  }

  build() {
    if (this.error) {
      return {
        error: this.error,
        error_description: this.errorDescription,
      };
    }

    return {
      access_token: this.accessToken,
      expires_in: this.expiresIn,
      token_type: this.tokenType,
    };
  }
}

/**
 * OAuth Request Parameters Builder
 */
export class OAuthParamsBuilder
  implements
    TestDataBuilder<{
      grant_type?: string;
      assertion?: string;
    }>
{
  private grantType: string = 'urn:ietf:params:oauth:grant-type:jwt-bearer';
  private assertion: string =
    'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ0ZXN0QGV4YW1wbGUuY29tIiwic2NvcGUiOiJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9hdXRoL3NwcmVhZHNoZWV0cyIsImF1ZCI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbS9vL29hdXRoMi90b2tlbiIsImV4cCI6MTY4NzUzMjAwMCwiaWF0IjoxNjg3NTI4NDAwfQ.mock-signature';

  withGrantType(type: string): this {
    this.grantType = type;
    return this;
  }

  withAssertion(assertion: string): this {
    this.assertion = assertion;
    return this;
  }

  withMissingAssertion(): this {
    this.assertion = undefined as any;
    return this;
  }

  withWrongGrantType(): this {
    this.grantType = 'authorization_code';
    return this;
  }

  build() {
    const result: any = {};
    if (this.grantType) result.grant_type = this.grantType;
    if (this.assertion) result.assertion = this.assertion;
    return result;
  }
}

/**
 * Google Sheets API Builder Configuration Builder
 */
export class ApiBuilderConfigBuilder
  implements
    TestDataBuilder<{
      spreadsheetId: string;
      range: string;
      accessToken: string;
      valueInputOption: 'USER_ENTERED' | 'RAW';
    }>
{
  private spreadsheetId: string = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
  private range: string = 'Sheet1!A:G';
  private accessToken: string = 'ya29.mock_oauth_token_test';
  private valueInputOption: 'USER_ENTERED' | 'RAW' = 'USER_ENTERED';

  withSpreadsheetId(id: string): this {
    this.spreadsheetId = id;
    return this;
  }

  withRange(range: string): this {
    this.range = range;
    return this;
  }

  withAccessToken(token: string): this {
    this.accessToken = token;
    return this;
  }

  withValueInputOption(option: 'USER_ENTERED' | 'RAW'): this {
    this.valueInputOption = option;
    return this;
  }

  build() {
    return {
      spreadsheetId: this.spreadsheetId,
      range: this.range,
      accessToken: this.accessToken,
      valueInputOption: this.valueInputOption,
    };
  }
}

/**
 * Google Sheets Response Builder
 */
export class SheetsResponseBuilder
  implements
    TestDataBuilder<{
      range?: string;
      majorDimension?: string;
      values?: string[][];
      spreadsheetId?: string;
      updates?: {
        spreadsheetId: string;
        updatedRows: number;
        updatedColumns: number;
        updatedCells: number;
        updatedRange: string;
      };
      replies?: object[];
    }>
{
  private range?: string = 'Sheet1!A:G';
  private majorDimension?: string = 'ROWS';
  private values: string[][] | undefined = [
    [
      'discord_id',
      'display_name',
      'username',
      'join_date',
      'is_banned',
      'is_active',
      'last_updated',
    ],
    [
      '123456789012345678',
      'ExistingUser',
      'existinguser',
      '2023-01-01T00:00:00.000Z',
      'false',
      'true',
      '2023-01-01T12:00:00.000Z',
    ],
  ];
  private spreadsheetId?: string = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
  private updates?: {
    spreadsheetId: string;
    updatedRows: number;
    updatedColumns: number;
    updatedCells: number;
    updatedRange: string;
  };
  private replies?: object[];

  withRange(range: string): this {
    this.range = range;
    return this;
  }

  withValues(values: string[][]): this {
    this.values = values;
    return this;
  }

  withEmptyValues(): this {
    this.values = undefined as undefined;
    return this;
  }

  withAppendUpdates(updatedRows: number = 2): this {
    this.updates = {
      spreadsheetId: this.spreadsheetId || '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      updatedRows,
      updatedColumns: 7,
      updatedCells: updatedRows * 7,
      updatedRange: `Sheet1!A3:G${2 + updatedRows}`,
    };
    return this;
  }

  withBatchUpdateReplies(): this {
    this.replies = [{}];
    return this;
  }

  build() {
    const result: any = {};
    if (this.range) result.range = this.range;
    if (this.majorDimension) result.majorDimension = this.majorDimension;
    if (this.values !== undefined) result.values = this.values;
    if (this.spreadsheetId) result.spreadsheetId = this.spreadsheetId;
    if (this.updates) result.updates = this.updates;
    if (this.replies) result.replies = this.replies;
    return result;
  }
}

/**
 * Member Rows Builder
 */
export class MemberRowsBuilder implements TestDataBuilder<string[][]> {
  private rows: string[][] = [];

  addMember(
    discordId: string = '123456789012345678',
    displayName: string = 'DisplayName1',
    username: string = 'username1',
    joinDate: string = '2023-01-01T00:00:00.000Z',
    isBanned: string = 'false',
    isActive: string = 'true',
    lastUpdated: string = '2023-06-01T12:00:00.000Z'
  ): this {
    this.rows.push([discordId, displayName, username, joinDate, isBanned, isActive, lastUpdated]);
    return this;
  }

  withSampleMembers(count: number = 2): this {
    this.rows = [];
    for (let i = 1; i <= count; i++) {
      this.addMember(
        `${i.toString().padStart(18, '1')}`,
        `DisplayName${i}`,
        `username${i}`,
        '2023-01-01T00:00:00.000Z',
        'false',
        'true',
        '2023-06-01T12:00:00.000Z'
      );
    }
    return this;
  }

  build(): string[][] {
    return this.rows;
  }
}

/**
 * Hybrid Object Mother + Builder Pattern
 * Provides convenient starting points while maintaining flexibility
 */
export const TestDataBuilders = {
  // Credentials
  validCredentials: () => new CredentialsBuilder(),
  invalidCredentials: () => new CredentialsBuilder().withEmail('not-an-email'),
  emptyCredentials: () => new CredentialsBuilder().withEmptyFields(),

  // JWT Config
  validJwtConfig: () => new JwtConfigBuilder(),
  invalidJwtConfig: () => new JwtConfigBuilder().withEmptyScope(),

  // OAuth Responses
  validOAuthResponse: () => new OAuthResponseBuilder(),
  oauthErrorResponse: () =>
    new OAuthResponseBuilder().withError('invalid_grant', 'Invalid JWT Signature.'),
  invalidOAuthResponse: () => new OAuthResponseBuilder().withMissingAccessToken(),

  // OAuth Parameters
  validOAuthParams: () => new OAuthParamsBuilder(),
  invalidOAuthParams: () => new OAuthParamsBuilder().withMissingAssertion(),

  // Google Sheets API
  validApiBuilderConfig: () => new ApiBuilderConfigBuilder(),
  validSheetsGetResponse: () => new SheetsResponseBuilder(),
  emptySheetsResponse: () => new SheetsResponseBuilder().withEmptyValues(),
  appendSheetsResponse: () => new SheetsResponseBuilder().withAppendUpdates(),
  batchUpdateResponse: () => new SheetsResponseBuilder().withBatchUpdateReplies(),

  // Member Data
  sampleMemberRows: () => new MemberRowsBuilder().withSampleMembers(2),
  singleMemberRow: () => new MemberRowsBuilder().withSampleMembers(1),
};
