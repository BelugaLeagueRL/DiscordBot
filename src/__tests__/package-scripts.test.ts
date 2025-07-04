/**
 * TDD tests for development npm scripts
 * Testing package.json script configuration for local development workflow
 */

import { describe, it, expect } from 'vitest';
// Import package.json directly (available in test environment)
import packageJsonData from '../../package.json';

interface PackageJson {
  readonly scripts: Record<string, string>;
}

describe('Development NPM Scripts', () => {
  const packageJson = packageJsonData as PackageJson;

  describe('local development workflow scripts', () => {
    it('should have dev script for local wrangler development server', () => {
      // RED: Test for development server script
      expect(packageJson.scripts).toHaveProperty('dev');
      expect(packageJson.scripts['dev']).toContain('wrangler dev');
      expect(packageJson.scripts['dev']).toContain('--env development');
    });

    it('should have dev:tunnel script for remote tunnel development', () => {
      // RED: Test for tunnel development script
      expect(packageJson.scripts).toHaveProperty('dev:tunnel');
      expect(packageJson.scripts['dev:tunnel']).toContain('wrangler dev');
      expect(packageJson.scripts['dev:tunnel']).toContain('--remote');
    });

    it('should have dev:local script for local-only development', () => {
      // RED: Test for local development script
      expect(packageJson.scripts).toHaveProperty('dev:local');
      expect(packageJson.scripts['dev:local']).toContain('wrangler dev');
      expect(packageJson.scripts['dev:local']).toContain('--local');
    });

    it('should have register:dev script for development command registration', () => {
      // RED: Test for development command registration
      expect(packageJson.scripts).toHaveProperty('register:dev');
      expect(packageJson.scripts['register:dev']).toContain('DISCORD_ENV=development');
      expect(packageJson.scripts['register:dev']).toContain('src/utils/command-registration.ts');
    });

    it('should have register:prod script for production command registration', () => {
      // RED: Test for production command registration
      expect(packageJson.scripts).toHaveProperty('register:prod');
      expect(packageJson.scripts['register:prod']).toContain('DISCORD_ENV=production');
      expect(packageJson.scripts['register:prod']).toContain('src/utils/command-registration.ts');
    });

    it('should have setup:dev script for easy development environment setup', () => {
      // RED: Test for development setup script
      expect(packageJson.scripts).toHaveProperty('setup:dev');
      expect(packageJson.scripts['setup:dev']).toContain('.dev.vars.example');
      expect(packageJson.scripts['setup:dev']).toContain('.dev.vars');
    });

    it('should have dev:full script for complete development workflow', () => {
      // RED: Test for full development workflow script
      expect(packageJson.scripts).toHaveProperty('dev:full');
      expect(packageJson.scripts['dev:full']).toContain('setup:dev');
      expect(packageJson.scripts['dev:full']).toContain('register:dev');
      expect(packageJson.scripts['dev:full']).toContain('dev');
    });
  });

  describe('environment-specific deployment scripts', () => {
    it('should have deploy:dev script for development deployment', () => {
      // RED: Test for development deployment
      expect(packageJson.scripts).toHaveProperty('deploy:dev');
      expect(packageJson.scripts['deploy:dev']).toContain('wrangler deploy');
      expect(packageJson.scripts['deploy:dev']).toContain('--env development');
    });

    it('should NOT have direct deploy script (security: prevent accidental production deployments)', () => {
      // RED: Test that direct deploy script is removed for security
      expect(packageJson.scripts).not.toHaveProperty('deploy');
      // Direct production deployments should go through CI/CD pipeline instead
    });
  });

  describe('testing workflow scripts', () => {
    it('should have test:register script for register command testing', () => {
      // RED: Test for register-specific testing
      expect(packageJson.scripts).toHaveProperty('test:register');
      expect(packageJson.scripts['test:register']).toContain('src/__tests__/register');
    });
  });
});
