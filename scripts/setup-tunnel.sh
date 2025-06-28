#!/bin/bash

# Setup development tunnel and capture URL for Discord configuration
# This script enhances the development workflow by automatically capturing
# the tunnel URL and making it easy to copy for Discord Developer Portal

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DEV_VARS_FILE="$PROJECT_DIR/.dev.vars"

echo "🚀 Setting up development tunnel for Discord bot..."

# Check if .dev.vars exists
if [ ! -f "$DEV_VARS_FILE" ]; then
    echo "❌ .dev.vars file not found. Running setup first..."
    npm run setup:dev
fi

# Function to extract and save tunnel URL
capture_tunnel_url() {
    local tunnel_url="$1"
    
    if [ -n "$tunnel_url" ]; then
        echo ""
        echo "🌐 Tunnel URL captured: $tunnel_url"
        
        # Add/update TUNNEL_URL in .dev.vars
        if grep -q "^TUNNEL_URL=" "$DEV_VARS_FILE"; then
            # Update existing line
            sed -i "s|^TUNNEL_URL=.*|TUNNEL_URL=\"$tunnel_url\"|" "$DEV_VARS_FILE"
            echo "✅ Updated TUNNEL_URL in .dev.vars"
        else
            # Add new line
            echo "" >> "$DEV_VARS_FILE"
            echo "# Development tunnel URL (auto-generated)" >> "$DEV_VARS_FILE"
            echo "TUNNEL_URL=\"$tunnel_url\"" >> "$DEV_VARS_FILE"
            echo "✅ Added TUNNEL_URL to .dev.vars"
        fi
        
        echo ""
        echo "📋 COPY THIS URL TO DISCORD DEVELOPER PORTAL:"
        echo "   Interactions Endpoint URL: $tunnel_url"
        echo ""
        echo "📖 Instructions:"
        echo "   1. Go to https://discord.com/developers/applications"
        echo "   2. Select your application (ID: $(grep DISCORD_APPLICATION_ID .dev.vars | cut -d'=' -f2 | tr -d '\"'))"
        echo "   3. Go to General Information"
        echo "   4. Set 'Interactions Endpoint URL' to: $tunnel_url"
        echo "   5. Save changes"
        echo ""
    fi
}

# Check if we should use remote tunnel or ngrok
if command -v wrangler >/dev/null 2>&1; then
    echo "🔧 Using Wrangler tunnel (recommended)..."
    
    # Try to start wrangler dev with remote tunnel
    # Note: This requires being logged in to Cloudflare
    if wrangler whoami >/dev/null 2>&1; then
        echo "✅ Wrangler authenticated"
        echo "🌐 Starting Cloudflare tunnel..."
        echo ""
        echo "⚠️  When the tunnel starts, the URL will be displayed in the console."
        echo "   Copy that URL and paste it into Discord Developer Portal as shown above."
        echo ""
        
        # Start the development server with tunnel
        npm run dev:tunnel
    else
        echo "❌ Wrangler not authenticated. Please run 'wrangler login' first."
        echo "   Alternatively, you can use local development with ngrok."
        echo ""
        echo "🔧 Falling back to local development setup..."
        
        # Check if ngrok is available
        if command -v ngrok >/dev/null 2>&1; then
            echo "🌐 Starting ngrok tunnel..."
            
            # Start local server in background
            npm run dev:local &
            LOCAL_SERVER_PID=$!
            
            # Wait a moment for server to start
            sleep 3
            
            # Start ngrok and capture URL
            echo "🔗 Creating ngrok tunnel..."
            ngrok http 8787 --log=stdout | while IFS= read -r line; do
                if echo "$line" | grep -q "url=https://"; then
                    tunnel_url=$(echo "$line" | grep -o 'url=https://[^"]*' | cut -d'=' -f2)
                    capture_tunnel_url "$tunnel_url"
                fi
            done
            
            # Cleanup function
            cleanup() {
                echo "🧹 Cleaning up..."
                kill $LOCAL_SERVER_PID 2>/dev/null || true
                pkill -f ngrok 2>/dev/null || true
            }
            trap cleanup EXIT
            
            wait $LOCAL_SERVER_PID
        else
            echo "❌ Neither Wrangler authentication nor ngrok found."
            echo "   Please either:"
            echo "   1. Run 'wrangler login' to authenticate with Cloudflare"
            echo "   2. Install ngrok: https://ngrok.com/download"
            echo "   3. Use local development: npm run dev:local"
            exit 1
        fi
    fi
else
    echo "❌ Wrangler not found. Please install Cloudflare Wrangler CLI."
    exit 1
fi