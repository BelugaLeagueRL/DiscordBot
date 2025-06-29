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
        },
      };
    },
  };
}
