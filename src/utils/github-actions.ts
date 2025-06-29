/**
 * GitHub Actions workflow validation utilities
 */

export interface GitHubActionsValidationResult {
  readonly isValid: boolean;
  readonly issues: ReadonlyArray<string>;
}

export interface GitHubActionsWorkflow {
  readonly name: string;
  readonly jobs: Record<
    string,
    {
      readonly environment?: string;
      readonly steps: ReadonlyArray<{
        readonly name: string;
        readonly run?: string;
        readonly if?: string;
      }>;
    }
  >;
}

export function validateGitHubActionsWorkflow(
  workflow: GitHubActionsWorkflow
): GitHubActionsValidationResult {
  const issues: string[] = [];

  // Find production deployment job
  const productionJob = Object.values(workflow.jobs).find(job => job.environment === 'production');

  if (productionJob !== undefined) {
    // Check for health check step
    const hasHealthCheck = productionJob.steps.some(
      step =>
        step.name.toLowerCase().includes('health check') || step.run?.includes('curl') === true
    );

    if (!hasHealthCheck) {
      issues.push('Production deployment must include health check step');
    }

    // Check for notification steps
    const hasSuccessNotification = productionJob.steps.some(
      step => step.if === 'success()' && step.name.toLowerCase().includes('notify')
    );

    const hasFailureNotification = productionJob.steps.some(
      step => step.if === 'failure()' && step.name.toLowerCase().includes('notify')
    );

    if (!hasSuccessNotification || !hasFailureNotification) {
      issues.push('Production deployment must include success/failure notifications');
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
