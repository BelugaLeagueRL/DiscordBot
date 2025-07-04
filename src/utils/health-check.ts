/**
 * Production health check utilities
 */

import type { Env } from '../index';
import { validateProductionSecrets } from './production-secrets';

export interface HealthCheckResult {
  readonly status: 'healthy' | 'unhealthy';
  readonly timestamp: number;
  readonly checks: {
    readonly secrets: 'pass' | 'fail';
    readonly environment: string;
    readonly deploymentSource: 'manual' | 'github-integration';
  };
}

export interface ProductionHealthCheck {
  readonly getStatus: () => HealthCheckResult;
}

export function createProductionHealthCheck(env: Partial<Env>): ProductionHealthCheck {
  return {
    getStatus(): HealthCheckResult {
      const secretsValidation = validateProductionSecrets(env);

      return {
        status: secretsValidation.isValid ? 'healthy' : 'unhealthy',
        timestamp: Date.now(),
        checks: {
          secrets: secretsValidation.isValid ? 'pass' : 'fail',
          environment: env.ENVIRONMENT ?? 'unknown',
          deploymentSource: 'github-integration', // This will show after GitHub deploys
        },
      };
    },
  };
}
