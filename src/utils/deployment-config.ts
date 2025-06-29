/**
 * Deployment configuration validation utilities
 */

export interface DeploymentConfigValidationResult {
  readonly isValid: boolean;
  readonly issues: ReadonlyArray<string>;
}

export interface DeploymentConfig {
  readonly environment: string;
  readonly gradualDeployment?: {
    readonly enabled: boolean;
    readonly stages?: ReadonlyArray<{
      readonly percentage: number;
      readonly duration: string;
    }>;
  };
  readonly healthChecks?: {
    readonly enabled: boolean;
    readonly endpoint?: string;
    readonly timeout?: number;
  };
}

export function validateDeploymentConfig(
  config: DeploymentConfig
): DeploymentConfigValidationResult {
  const issues: string[] = [];

  if (config.environment === 'production') {
    if (config.gradualDeployment?.enabled !== true) {
      issues.push('Production deployment must have gradual rollout configured');
    }

    if (config.healthChecks?.enabled !== true) {
      issues.push('Production deployment must have health checks enabled');
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
