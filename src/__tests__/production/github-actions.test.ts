/**
 * GitHub Actions deployment workflow validation tests
 */

import { describe, it, expect } from 'vitest';
import { validateGitHubActionsWorkflow } from '../../utils/github-actions';

describe('GitHub Actions Deployment Workflow', () => {
  it('should validate production deployment has monitoring notifications', () => {
    const workflow = {
      name: 'Deploy',
      jobs: {
        deploy: {
          environment: 'production',
          steps: [
            { name: 'Deploy to Cloudflare Workers' },
            { name: 'Health Check', run: 'curl -f ${{ env.HEALTH_CHECK_URL }}' },
            { name: 'Notify Success', if: 'success()' },
            { name: 'Notify Failure', if: 'failure()' },
          ],
        },
      },
    };

    const result = validateGitHubActionsWorkflow(workflow);

    expect(result.isValid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('should fail validation when health check is missing', () => {
    const workflow = {
      name: 'Deploy',
      jobs: {
        deploy: {
          environment: 'production',
          steps: [
            { name: 'Deploy to Cloudflare Workers' },
            { name: 'Notify Success', if: 'success()' },
          ],
        },
      },
    };

    const result = validateGitHubActionsWorkflow(workflow);

    expect(result.isValid).toBe(false);
    expect(result.issues).toContain('Production deployment must include health check step');
  });

  it('should fail validation when deployment notifications are missing', () => {
    const workflow = {
      name: 'Deploy',
      jobs: {
        deploy: {
          environment: 'production',
          steps: [
            { name: 'Deploy to Cloudflare Workers' },
            { name: 'Health Check', run: 'curl -f ${{ env.HEALTH_CHECK_URL }}' },
          ],
        },
      },
    };

    const result = validateGitHubActionsWorkflow(workflow);

    expect(result.isValid).toBe(false);
    expect(result.issues).toContain(
      'Production deployment must include success/failure notifications'
    );
  });
});
