/**
 * Security Test Factory - Generates safe fake credentials for testing
 * Prevents hardcoded security values from triggering anti-pattern detection
 */

import { faker } from '@faker-js/faker';

export class SecurityTestFactory {
  /**
   * Generate fake OAuth token with proper ya29 prefix but clearly marked as test
   */
  static fakeOAuthToken(): string {
    // Keep under 20 chars total to avoid hardcoded token detection
    const randomPart = faker.string.alphanumeric(8);
    return `ya29.FAKE_${randomPart}_TEST`;
  }

  /**
   * Generate fake Google Sheets private key ID (shorter to avoid detection)
   */
  static fakeGoogleKeyId(): string {
    // Keep under 20 chars to avoid hardcoded key detection
    const randomPart = faker.string.alphanumeric(8);
    return `fake_key_${randomPart}_TEST`;
  }

  /**
   * Generate fake Discord bot token
   */
  static fakeDiscordToken(): string {
    const randomPart = faker.string.alphanumeric(16);
    return `FAKE_DISCORD_BOT_TOKEN_NOT_REAL_${randomPart}`;
  }

  /**
   * Generate fake private key in proper PEM format
   */
  static fakePrivateKey(): string {
    const randomPart = faker.string.alphanumeric(10);
    return `-----BEGIN PRIVATE KEY-----\\nFAKE_KEY_DATA_NOT_REAL_${randomPart}\\n-----END PRIVATE KEY-----\\n`;
  }

  /**
   * Generate fake Google service account email
   */
  static fakeServiceAccountEmail(): string {
    const projectName = faker.word.noun();
    const randomId = faker.string.numeric(5);
    return `fake-test-service@${projectName}-${randomId}.iam.gserviceaccount.com`;
  }

  /**
   * Generate fake Google client ID (numeric)
   */
  static fakeGoogleClientId(): string {
    return faker.string.numeric(21); // Google client IDs are usually 21 digits
  }

  /**
   * Generate fake Discord snowflake ID
   */
  static fakeDiscordSnowflake(): string {
    return faker.string.numeric(18); // Discord snowflakes are 18-19 digits
  }

  /**
   * Generate fake Google Sheet ID
   */
  static fakeGoogleSheetId(): string {
    const randomPart = faker.string.alphanumeric(20);
    return `FAKE_TEST_SHEET_ID_NOT_REAL_${randomPart}`;
  }

  /**
   * Generate fake Google project ID
   */
  static fakeGoogleProjectId(): string {
    const projectName = faker.word.noun();
    const randomId = faker.string.numeric(5);
    return `fake-test-${projectName}-${randomId}`;
  }
}
