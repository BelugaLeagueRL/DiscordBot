/**
 * Wrangler production configuration validation tests
 */

import { describe, it, expect } from 'vitest';
import { validateWranglerConfig } from '../../utils/wrangler-config';

describe('Wrangler Production Configuration', () => {
  it('should validate production environment has observability enabled', () => {
    const prodConfig = {
      observability: {
        enabled: true,
        head_sampling_rate: 1,
      },
    };

    const result = validateWranglerConfig(prodConfig, 'production');

    expect(result.isValid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('should fail validation when observability is missing', () => {
    const invalidConfig = {};

    const result = validateWranglerConfig(invalidConfig, 'production');

    expect(result.isValid).toBe(false);
    expect(result.issues).toContain('Missing observability configuration for production');
  });
});
