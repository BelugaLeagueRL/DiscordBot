#!/usr/bin/env node

/**
 * Test script to verify ngrok URL capture functionality
 * Simulates ngrok tunnel creation and URL capture
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectDir = join(__dirname, '..');
const devVarsPath = join(projectDir, '.dev.vars');

/**
 * Update .dev.vars with the tunnel URL
 */
function updateTunnelUrl(tunnelUrl) {
  try {
    // Read current .dev.vars content
    let content = readFileSync(devVarsPath, 'utf8');
    
    // Remove existing TUNNEL_URL line if it exists
    content = content.replace(/^TUNNEL_URL=.*$/m, '');
    content = content.replace(/^# Development tunnel URL.*$/m, '');
    
    // Clean up extra newlines
    content = content.replace(/\n\n+/g, '\n\n');
    
    // Add new TUNNEL_URL line
    if (!content.endsWith('\n')) {
      content += '\n';
    }
    content += `\n# Development tunnel URL (auto-generated)\nTUNNEL_URL="${tunnelUrl}"\n`;
    
    // Write back to file
    writeFileSync(devVarsPath, content);
    
    console.log('✅ Tunnel URL automatically saved to .dev.vars');
    console.log('');
    console.log('📋 COPY THIS URL TO DISCORD DEVELOPER PORTAL:');
    console.log(`   Interactions Endpoint URL: ${tunnelUrl}`);
    console.log('');
    console.log('📖 Instructions:');
    
    // Try to extract Discord Application ID for helpful instructions
    try {
      const discordAppId = content.match(/DISCORD_APPLICATION_ID="([^"]+)"/)?.[1];
      if (discordAppId) {
        console.log(`   1. Go to https://discord.com/developers/applications/${discordAppId}`);
      } else {
        console.log('   1. Go to https://discord.com/developers/applications');
      }
    } catch (e) {
      console.log('   1. Go to https://discord.com/developers/applications');
    }
    
    console.log('   2. Go to General Information');
    console.log(`   3. Set "Interactions Endpoint URL" to: ${tunnelUrl}`);
    console.log('   4. Save changes');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error updating .dev.vars:', error.message);
  }
}

// Simulate a real ngrok URL
const simulatedNgrokUrl = 'https://abc123-def456-ghi789.ngrok-free.app';

console.log('🧪 Testing ngrok URL capture functionality...');
console.log('');
console.log('📡 Simulated ngrok tunnel URL:', simulatedNgrokUrl);
console.log('');

updateTunnelUrl(simulatedNgrokUrl);

console.log('🔍 Verification: Check .dev.vars file to confirm URL was saved correctly');