#!/usr/bin/env node

/**
 * Automated ngrok tunnel setup with URL capture
 * This replicates the Discord sample app's ngrok functionality
 * but automatically captures and saves the tunnel URL
 */

import ngrok from 'ngrok';
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
    console.log('🔗 ngrok tunnel is running. Press Ctrl+C to stop.');
    
  } catch (error) {
    console.error('❌ Error updating .dev.vars:', error.message);
  }
}

/**
 * Start ngrok tunnel and capture URL automatically
 */
async function startTunnelWithCapture() {
  const port = 8787; // Default Wrangler dev port
  
  try {
    console.log('🚀 Starting local development server...');
    console.log('🔗 Creating ngrok tunnel...');
    console.log('');
    
    // Start ngrok tunnel
    const tunnelUrl = await ngrok.connect({
      port: port,
      proto: 'http'
    });
    
    console.log(`✅ Tunnel created: ${tunnelUrl}`);
    console.log(`📡 Forwarding: ${tunnelUrl} → http://localhost:${port}`);
    console.log('');
    
    // Automatically save the URL
    updateTunnelUrl(tunnelUrl);
    
    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('');
      console.log('🛑 Stopping ngrok tunnel...');
      await ngrok.disconnect();
      await ngrok.kill();
      console.log('✅ Tunnel stopped');
      process.exit(0);
    });
    
    // Keep the process alive
    console.log('⏳ Tunnel is running. Your local server should be accessible at the URL above.');
    console.log('   Make sure your local development server is running on port 8787');
    console.log('   Run "npm run dev:local" in another terminal if not already running.');
    console.log('');
    
    // Keep process alive
    setInterval(() => {
      // Just keep the process running
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error starting ngrok tunnel:', error.message);
    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('   1. Make sure port 8787 is not already in use');
    console.log('   2. Check if your local development server is running');
    console.log('   3. Try restarting the tunnel');
    process.exit(1);
  }
}

// Start the tunnel
startTunnelWithCapture();