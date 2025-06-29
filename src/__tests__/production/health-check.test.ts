/**
 * Production health check endpoint tests
 */

import { describe, it, expect } from 'vitest';
import { createProductionHealthCheck } from '../../utils/health-check';
import { mockEnvironments } from '../mocks/environments';

describe('Production Health Check', () => {
  it('should return healthy status when all systems operational', () => {
    const healthCheck = createProductionHealthCheck(mockEnvironments.production);

    const result = healthCheck.getStatus();

    expect(result.status).toBe('healthy');
    expect(result.checks.secrets).toBe('pass');
    expect(result.timestamp).toBeTypeOf('number');
  });

  it('should return unhealthy status when secrets missing', () => {
    const incompleteEnv = { ENVIRONMENT: 'production' };
    const healthCheck = createProductionHealthCheck(incompleteEnv);

    const result = healthCheck.getStatus();

    expect(result.status).toBe('unhealthy');
    expect(result.checks.secrets).toBe('fail');
  });
});
