/**
 * Wrangler configuration validation utilities
 */

export interface WranglerConfigValidationResult {
  readonly isValid: boolean;
  readonly issues: ReadonlyArray<string>;
}

export interface WranglerConfig {
  readonly observability?: {
    readonly enabled?: boolean;
    readonly head_sampling_rate?: number;
  };
}

export function validateWranglerConfig(
  config: WranglerConfig,
  environment: string
): WranglerConfigValidationResult {
  const issues: string[] = [];

  if (environment === 'production') {
    if (config.observability === undefined) {
      issues.push('Missing observability configuration for production');
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
