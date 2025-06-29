#!/usr/bin/env node

/**
 * Wrangler-based production validation script
 * Uses Wrangler's native monitoring capabilities for comprehensive validation
 * 
 * Usage:
 *   node scripts/wrangler-production-validation.js
 * 
 * Required:
 *   - Cloudflare API token configured
 *   - wrangler.toml properly configured
 */

import { execSync, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m', 
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkWranglerAuth() {
  log('blue', '🔐 Checking Wrangler authentication...');
  
  try {
    const { stdout } = await execAsync('npx wrangler whoami');
    const email = stdout.match(/You are logged in with email '(.+)'/)?.[1] || 'unknown';
    log('green', `✅ Authenticated as: ${email}`);
    return { success: true, email };
  } catch (error) {
    log('red', `❌ Wrangler authentication failed: ${error.message}`);
    log('yellow', '💡 Run: npx wrangler login');
    return { success: false, error: error.message };
  }
}

async function checkDeploymentStatus() {
  log('blue', '🚢 Checking deployment status...');
  
  try {
    const { stdout } = await execAsync('npx wrangler deployments status --env production');
    log('green', '✅ Deployment status retrieved');
    
    // Parse deployment info
    const lines = stdout.split('\n');
    const statusInfo = lines.reduce((info, line) => {
      const trimmed = line.trim();
      if (trimmed.includes('Version ID:')) {
        info.versionId = trimmed.split(':')[1]?.trim();
      } else if (trimmed.includes('Created on:')) {
        info.createdOn = trimmed.split('Created on:')[1]?.trim();
      } else if (trimmed.includes('Deployments:')) {
        info.deployments = trimmed.split(':')[1]?.trim();
      }
      return info;
    }, {});

    log('cyan', `📦 Version ID: ${statusInfo.versionId || 'unknown'}`);
    log('cyan', `📅 Deployed: ${statusInfo.createdOn || 'unknown'}`);
    log('cyan', `🌍 Deployments: ${statusInfo.deployments || 'unknown'}`);
    
    return { success: true, statusInfo };
  } catch (error) {
    log('red', `❌ Failed to get deployment status: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function listRecentDeployments() {
  log('blue', '📋 Listing recent deployments...');
  
  try {
    const { stdout } = await execAsync('npx wrangler deployments list --env production');
    log('green', '✅ Recent deployments retrieved');
    
    // Extract deployment info
    const lines = stdout.split('\n').filter(line => line.trim());
    const deployments = lines
      .slice(1) // Skip header
      .filter(line => line.includes('|'))
      .slice(0, 3) // Show last 3 deployments
      .map(line => {
        const parts = line.split('|').map(p => p.trim());
        return {
          versionId: parts[0] || 'unknown',
          createdOn: parts[1] || 'unknown',
          environment: parts[2] || 'unknown'
        };
      });

    deployments.forEach((deployment, index) => {
      const prefix = index === 0 ? '🔴 Current:' : `  ${index + 1}.`;
      log('cyan', `${prefix} ${deployment.versionId} (${deployment.createdOn})`);
    });
    
    return { success: true, deployments };
  } catch (error) {
    log('red', `❌ Failed to list deployments: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function validateWorkerLogs() {
  log('blue', '📊 Checking Worker logs (last 30 seconds)...');
  
  try {
    // Start tailing logs for 30 seconds
    const tailPromise = new Promise((resolve, reject) => {
      const tailProcess = exec(
        'timeout 30s npx wrangler tail --env production --format json',
        { timeout: 35000 }
      );
      
      let logCount = 0;
      let errorCount = 0;
      let requestCount = 0;
      
      tailProcess.stdout?.on('data', (data) => {
        const lines = data.toString().split('\n').filter(Boolean);
        
        lines.forEach(line => {
          try {
            const logEntry = JSON.parse(line);
            logCount++;
            
            if (logEntry.outcome === 'ok') {
              requestCount++;
            } else if (logEntry.outcome === 'exception' || logEntry.outcome === 'error') {
              errorCount++;
            }
          } catch (e) {
            // Ignore JSON parse errors for non-JSON lines
          }
        });
      });
      
      tailProcess.on('close', (code) => {
        resolve({ logCount, errorCount, requestCount });
      });
      
      tailProcess.on('error', reject);
      
      // Send a test request to generate logs
      setTimeout(async () => {
        try {
          await fetch('https://beluga-discord-bot.your-subdomain.workers.dev', {
            method: 'GET',
            headers: { 'User-Agent': 'WranglerValidation/1.0' }
          });
        } catch (e) {
          // Ignore fetch errors - we just want to generate logs
        }
      }, 5000);
    });
    
    const { logCount, errorCount, requestCount } = await tailPromise;
    
    if (logCount === 0) {
      log('yellow', '⚠️  No logs captured (Worker may be idle)');
    } else {
      log('green', `✅ Captured ${logCount} log entries`);
      log('cyan', `📈 Requests: ${requestCount}, Errors: ${errorCount}`);
      
      if (errorCount > 0) {
        log('yellow', `⚠️  ${errorCount} errors detected in logs`);
      }
    }
    
    return { 
      success: true, 
      metrics: { logCount, errorCount, requestCount }
    };
  } catch (error) {
    log('red', `❌ Failed to validate logs: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function checkWorkerSecrets() {
  log('blue', '🔑 Checking Worker secrets...');
  
  try {
    const { stdout } = await execAsync('npx wrangler secret list --env production');
    
    const secretLines = stdout.split('\n')
      .filter(line => line.includes('|'))
      .slice(1); // Skip header
    
    const secrets = secretLines.map(line => {
      const parts = line.split('|').map(p => p.trim());
      return parts[0]; // Secret name
    }).filter(Boolean);
    
    const requiredSecrets = [
      'DISCORD_TOKEN',
      'DISCORD_PUBLIC_KEY', 
      'DISCORD_APPLICATION_ID'
    ];
    
    const missingSecrets = requiredSecrets.filter(secret => 
      !secrets.includes(secret)
    );
    
    if (missingSecrets.length === 0) {
      log('green', '✅ All required secrets are configured');
      log('cyan', `🔐 Configured secrets: ${secrets.join(', ')}`);
    } else {
      log('red', `❌ Missing secrets: ${missingSecrets.join(', ')}`);
    }
    
    return { 
      success: missingSecrets.length === 0, 
      secrets, 
      missingSecrets 
    };
  } catch (error) {
    log('red', `❌ Failed to check secrets: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function performRollbackTest() {
  log('blue', '🔄 Testing rollback capabilities...');
  
  try {
    // Get deployment list to check rollback options
    const { stdout } = await execAsync('npx wrangler deployments list --env production');
    const lines = stdout.split('\n').filter(line => line.includes('|')).slice(1);
    
    if (lines.length < 2) {
      log('yellow', '⚠️  Only one deployment found - rollback test skipped');
      return { success: true, note: 'Insufficient deployment history for rollback test' };
    }
    
    log('green', '✅ Multiple deployments available for rollback');
    log('cyan', `📦 Rollback options: ${lines.length} previous deployments`);
    
    // Note: We don't actually perform a rollback in validation
    // Just verify the capability exists
    
    return { success: true, rollbackOptions: lines.length };
  } catch (error) {
    log('red', `❌ Rollback test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runWranglerValidation() {
  log('blue', '🚀 Starting Wrangler-based production validation...');
  console.log('');

  const results = {
    auth: await checkWranglerAuth(),
    deploymentStatus: await checkDeploymentStatus(),
    recentDeployments: await listRecentDeployments(),
    secrets: await checkWorkerSecrets(),
    logs: await validateWorkerLogs(),
    rollback: await performRollbackTest()
  };

  console.log('');
  log('blue', '📊 Wrangler Production Validation Results:');
  console.log('');

  let totalTests = 0;
  let passedTests = 0;
  let warningTests = 0;

  Object.entries(results).forEach(([testName, result]) => {
    totalTests++;
    if (result.success) {
      passedTests++;
      log('green', `✅ ${testName}: PASSED`);
    } else if (result.note) {
      warningTests++;
      log('yellow', `⚠️  ${testName}: WARNING - ${result.note}`);
    } else {
      log('red', `❌ ${testName}: FAILED - ${result.error}`);
    }
  });

  console.log('');
  log('blue', `📈 Summary: ${passedTests}/${totalTests} tests passed`);
  
  if (warningTests > 0) {
    log('yellow', `⚠️  ${warningTests} tests with warnings`);
  }

  // Show deployment commands
  console.log('');
  log('cyan', '🔧 Useful Wrangler Commands:');
  log('cyan', '   npx wrangler deployments status --env production');
  log('cyan', '   npx wrangler tail --env production --format json');
  log('cyan', '   npx wrangler rollback [version-id] --env production');
  log('cyan', '   npx wrangler secret list --env production');

  if (passedTests === totalTests || (passedTests + warningTests === totalTests)) {
    log('green', '🎉 Wrangler production validation PASSED!');
    process.exit(0);
  } else {
    log('red', '💥 Wrangler production validation FAILED!');
    process.exit(1);
  }
}

// Run the validation
runWranglerValidation().catch(error => {
  log('red', `💥 Wrangler validation script failed: ${error.message}`);
  process.exit(1);
});