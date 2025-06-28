#!/usr/bin/env node

/**
 * Simple script to capture and save tunnel URL to .dev.vars
 * Usage: node scripts/capture-tunnel.js <tunnel_url>
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectDir = join(__dirname, '..');
const devVarsPath = join(projectDir, '.dev.vars');

function updateTunnelUrl(tunnelUrl) {
  try {
    // Read current .dev.vars content
    let content = readFileSync(devVarsPath, 'utf8');
    
    // Remove existing TUNNEL_URL line if it exists
    content = content.replace(/^TUNNEL_URL=.*$/m, '');
    
    // Add new TUNNEL_URL line
    if (!content.endsWith('\n')) {
      content += '\n';
    }
    content += `\n# Development tunnel URL (auto-generated)\nTUNNEL_URL="${tunnelUrl}"\n`;
    
    // Write back to file
    writeFileSync(devVarsPath, content);
    
    console.log('✅ Tunnel URL saved to .dev.vars');
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
    process.exit(1);
  }
}

// Get tunnel URL from command line argument
const tunnelUrl = process.argv[2];

if (!tunnelUrl) {
  console.error('❌ Usage: node scripts/capture-tunnel.js <tunnel_url>');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/capture-tunnel.js https://abc123.ngrok.io');
  process.exit(1);
}

// Validate URL format
try {
  new URL(tunnelUrl);
} catch (e) {
  console.error('❌ Invalid URL format:', tunnelUrl);
  process.exit(1);
}

updateTunnelUrl(tunnelUrl);