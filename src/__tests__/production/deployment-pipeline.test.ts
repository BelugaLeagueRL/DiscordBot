/**
 * Enhanced deployment pipeline validation tests
 */

import { describe, it, expect } from 'vitest';
import { validateDeploymentConfig } from '../../utils/deployment-config';

describe('Enhanced Deployment Pipeline', () => {
  it('should validate production deployment has gradual rollout enabled', () => {
    const deployConfig = {
      environment: 'production',
      gradualDeployment: {
        enabled: true,
        stages: [
          { percentage: 10, duration: '5m' },
          { percentage: 50, duration: '10m' },
          { percentage: 100, duration: '0m' },
        ],
      },
      healthChecks: {
        enabled: true,
        endpoint: '/health',
        timeout: 30,
      },
    };

    const result = validateDeploymentConfig(deployConfig);

    expect(result.isValid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('should fail validation when gradual deployment is missing for production', () => {
    const invalidConfig = {
      environment: 'production',
      healthChecks: { enabled: true },
    };

    const result = validateDeploymentConfig(invalidConfig);

    expect(result.isValid).toBe(false);
    expect(result.issues).toContain('Production deployment must have gradual rollout configured');
  });

  it('should fail validation when health checks are disabled for production', () => {
    const invalidConfig = {
      environment: 'production',
      gradualDeployment: { enabled: true },
      healthChecks: { enabled: false },
    };

    const result = validateDeploymentConfig(invalidConfig);

    expect(result.isValid).toBe(false);
    expect(result.issues).toContain('Production deployment must have health checks enabled');
  });
});
