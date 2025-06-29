/**
 * Production secrets validation tests
 */

import { describe, it, expect } from 'vitest';
import { validateProductionSecrets } from '../../utils/production-secrets';
import { mockEnvironments } from '../mocks/environments';

describe('Production Secrets Validation', () => {
  it('should validate that all required production secrets are present', () => {
    const validProdEnv = mockEnvironments.production;

    const result = validateProductionSecrets(validProdEnv);

    expect(result.isValid).toBe(true);
    expect(result.missingSecrets).toHaveLength(0);
  });

  it('should fail validation when required secrets are missing', () => {
    const invalidEnv = {
      DISCORD_TOKEN: 'token',
      // Missing DISCORD_PUBLIC_KEY, DISCORD_APPLICATION_ID
      ENVIRONMENT: 'production',
    };

    const result = validateProductionSecrets(invalidEnv);

    expect(result.isValid).toBe(false);
    expect(result.missingSecrets).toContain('DISCORD_PUBLIC_KEY');
    expect(result.missingSecrets).toContain('DISCORD_APPLICATION_ID');
  });
});
