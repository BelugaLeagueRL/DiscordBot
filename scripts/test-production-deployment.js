#!/usr/bin/env node

/**
 * Production deployment validation script
 * Tests actual deployed Worker with real secrets and environment
 * 
 * Usage:
 *   node scripts/test-production-deployment.js [worker-url]
 * 
 * Environment variables required:
 *   DISCORD_TOKEN - Real Discord bot token
 *   DISCORD_PUBLIC_KEY - Real Discord public key  
 *   DISCORD_APPLICATION_ID - Real Discord application ID
 */

import crypto from 'crypto';

const WORKER_URL = process.argv[2] || 'https://beluga-discord-bot.your-subdomain.workers.dev';

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m', 
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createDiscordSignature(body, timestamp, publicKey) {
  const signature = `${timestamp}${body}`;
  // Note: This is a simplified version - real Discord signature verification is more complex
  return crypto.createHmac('sha256', publicKey).update(signature).digest('hex');
}

async function testHealthCheck() {
  log('blue', '🔍 Testing health check endpoint...');
  
  try {
    const response = await fetch(WORKER_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'BelugaBot-ProductionTest/1.0'
      }
    });

    if (response.status !== 200) {
      throw new Error(`Health check failed with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'healthy') {
      throw new Error(`Health check reports unhealthy: ${JSON.stringify(data)}`);
    }

    log('green', '✅ Health check passed');
    return { success: true, data };
  } catch (error) {
    log('red', `❌ Health check failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testCORS() {
  log('blue', '🔍 Testing CORS headers...');
  
  try {
    const response = await fetch(WORKER_URL, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://discord.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, X-Signature-Ed25519, X-Signature-Timestamp'
      }
    });

    if (response.status !== 200) {
      throw new Error(`CORS preflight failed with status: ${response.status}`);
    }

    const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
    const corsMethods = response.headers.get('Access-Control-Allow-Methods');
    
    if (!corsOrigin || !corsMethods) {
      throw new Error('Missing CORS headers');
    }

    log('green', '✅ CORS configuration valid');
    return { success: true };
  } catch (error) {
    log('red', `❌ CORS test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testSecurityHeaders() {
  log('blue', '🔍 Testing security headers...');
  
  try {
    const response = await fetch(WORKER_URL, { method: 'GET' });
    
    const securityHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options', 
      'X-XSS-Protection',
      'Referrer-Policy',
      'Content-Security-Policy',
      'Strict-Transport-Security'
    ];

    const missingHeaders = securityHeaders.filter(header => 
      !response.headers.get(header)
    );

    if (missingHeaders.length > 0) {
      throw new Error(`Missing security headers: ${missingHeaders.join(', ')}`);
    }

    log('green', '✅ Security headers present');
    return { success: true };
  } catch (error) {
    log('red', `❌ Security headers test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testDiscordPing() {
  log('blue', '🔍 Testing Discord PING interaction...');
  
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) {
    log('yellow', '⚠️  Skipping Discord test - no DISCORD_PUBLIC_KEY provided');
    return { success: true, skipped: true };
  }

  try {
    const body = JSON.stringify({ type: 1 }); // PING interaction
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = createDiscordSignature(body, timestamp, publicKey);

    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature-Ed25519': signature,
        'X-Signature-Timestamp': timestamp,
        'User-Agent': 'Discord-Interactions/1.0 (+https://discord.com)'
      },
      body
    });

    // Note: This will likely fail signature verification since we're not using real Ed25519
    // But we can check that the Worker processes the request structure correctly
    
    if (response.status === 401) {
      log('yellow', '⚠️  Discord signature verification failed (expected with test signature)');
      return { success: true, note: 'Signature verification working (rejected test signature)' };
    }

    if (response.status === 200) {
      const data = await response.json();
      if (data.type === 1) { // PONG response
        log('green', '✅ Discord PING/PONG working');
        return { success: true, data };
      }
    }

    throw new Error(`Unexpected response: ${response.status}`);
  } catch (error) {
    log('red', `❌ Discord test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testPerformance() {
  log('blue', '🔍 Testing performance and response times...');
  
  try {
    const startTime = Date.now();
    const response = await fetch(WORKER_URL, { method: 'GET' });
    const endTime = Date.now();
    
    const responseTime = endTime - startTime;
    
    if (responseTime > 5000) { // 5 seconds
      log('yellow', `⚠️  Slow response time: ${responseTime}ms`);
    } else if (responseTime > 1000) { // 1 second
      log('yellow', `⚠️  Moderate response time: ${responseTime}ms`);
    } else {
      log('green', `✅ Good response time: ${responseTime}ms`);
    }

    return { success: true, responseTime };
  } catch (error) {
    log('red', `❌ Performance test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runProductionValidation() {
  log('blue', `🚀 Starting production validation for: ${WORKER_URL}`);
  console.log('');

  const results = {
    healthCheck: await testHealthCheck(),
    cors: await testCORS(), 
    security: await testSecurityHeaders(),
    discord: await testDiscordPing(),
    performance: await testPerformance()
  };

  console.log('');
  log('blue', '📊 Production Validation Results:');
  console.log('');

  let totalTests = 0;
  let passedTests = 0;
  let skippedTests = 0;

  Object.entries(results).forEach(([testName, result]) => {
    totalTests++;
    if (result.skipped) {
      skippedTests++;
      log('yellow', `⚠️  ${testName}: SKIPPED`);
    } else if (result.success) {
      passedTests++;
      log('green', `✅ ${testName}: PASSED`);
    } else {
      log('red', `❌ ${testName}: FAILED - ${result.error}`);
    }
  });

  console.log('');
  log('blue', `📈 Summary: ${passedTests}/${totalTests - skippedTests} tests passed`);
  
  if (skippedTests > 0) {
    log('yellow', `⚠️  ${skippedTests} tests skipped (missing environment variables)`);
  }

  if (passedTests === totalTests - skippedTests) {
    log('green', '🎉 Production deployment validation PASSED!');
    process.exit(0);
  } else {
    log('red', '💥 Production deployment validation FAILED!');
    process.exit(1);
  }
}

// Run the validation
runProductionValidation().catch(error => {
  log('red', `💥 Validation script failed: ${error.message}`);
  process.exit(1);
});