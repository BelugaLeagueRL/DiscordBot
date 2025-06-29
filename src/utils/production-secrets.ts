/**
 * Production secrets validation utilities
 */

import type { Env } from '../index';

export interface SecretsValidationResult {
  readonly isValid: boolean;
  readonly missingSecrets: ReadonlyArray<string>;
}

export function validateProductionSecrets(env: Partial<Env>): SecretsValidationResult {
  const requiredSecrets = [
    'DISCORD_TOKEN',
    'DISCORD_PUBLIC_KEY',
    'DISCORD_APPLICATION_ID',
  ] as const;

  const missingSecrets = requiredSecrets.filter(
    secret => env[secret] === undefined || env[secret] === ''
  );

  return {
    isValid: missingSecrets.length === 0,
    missingSecrets,
  };
}
