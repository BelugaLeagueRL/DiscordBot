# Beluga Discord Bot

Serverless Discord bot for Rocket League using Cloudflare Workers.

## Project Structure

Based on [Discord's official Cloudflare Workers sample app](https://github.com/discord/cloudflare-sample-app):

```
src/
├── index.ts        # Main Worker entry point (server.js equivalent)
├── commands.ts     # Command definitions
├── register.ts     # Command registration utility
├── handlers/       # Command handlers
│   └── register.ts # /register command handler
└── utils/          # Utility functions
    └── discord.ts  # Discord interaction utilities
```

## Setup

1. Copy environment variables:
   ```bash
   cp .dev.vars.example .dev.vars
   ```

2. Full project setup (installs dependencies and Git hooks):
   ```bash
   make setup
   ```

3. Register Discord commands:
   ```bash
   make register
   ```

4. Start local development:
   ```bash
   make dev
   ```

### Git Hooks

The project includes Git hooks that enforce code quality:

- **commit-msg**: Validates conventional commit format and prevents forbidden references
- Automatically installed with `make setup`
- Provides helpful error messages and examples when validation fails

## Development Commands

Use the Makefile for consistent development workflow:

```bash
make help           # Show all available commands
make install        # Install dependencies
make dev            # Start local development server
make test           # Run tests
make check          # Quick lint and type check
make ci             # Run full CI pipeline
make pre-commit     # Run pre-commit checks with fixes
```

For a complete list of commands, run `make help`.

## Local Development & Testing

### Quick Start for `/register` Command Development

For rapid TDD development of the `/register` command, use these npm scripts:

```bash
# 1. Set up development environment
npm run setup:dev

# 2. Register commands for development
npm run register:dev

# 3. Start local development server with hot reload
npm run dev
```

### Development Scripts

| Script | Purpose | Description |
|--------|---------|-------------|
| `npm run dev` | Local development server | Wrangler dev server on port 8787 |
| `npm run dev:tunnel` | Remote tunnel development | Exposes local server via Cloudflare tunnel |
| `npm run dev:local` | Local-only development | Runs purely locally without tunnel |
| `npm run register:dev` | Development command registration | Registers commands to development Discord app |
| `npm run register:prod` | Production command registration | Registers commands to production Discord app |
| `npm run setup:dev` | Development environment setup | Copies .dev.vars.example to .dev.vars |
| `npm run setup:tunnel` | Automated tunnel setup | Starts tunnel and captures URL automatically |
| `npm run save:tunnel <url>` | Manual tunnel URL capture | Saves tunnel URL to .dev.vars with instructions |
| `npm run test:register` | Register command testing | Runs tests specifically for register functionality |
| `npm run dev:full` | Complete development workflow | Runs setup → register → dev in sequence |

### Environment Configuration

#### Development Environment Variables

Edit `.dev.vars` with your Discord bot credentials (contact project maintainer for values):

```bash
# Discord Bot Configuration
DISCORD_TOKEN="your_discord_bot_token_here"
DISCORD_PUBLIC_KEY="your_discord_public_key_here"  
DISCORD_APPLICATION_ID="your_discord_application_id_here"

# Database Configuration  
DATABASE_URL="file:./local.db"

# Google Sheets API (optional)
GOOGLE_SHEETS_API_KEY="your_google_sheets_api_key"

# Environment
ENVIRONMENT="development"
```

**Note**: Use the secrets management script for setup:
```bash
# Setup local development environment
make secrets-setup

# Then manually add Discord credentials from the Discord Developer Portal
# Validate the setup
make secrets-validate
```

#### Production Secrets Management

For production deployment, secrets are managed via Wrangler:

```bash
# Set production secrets securely
wrangler secret put DISCORD_TOKEN
wrangler secret put DISCORD_PUBLIC_KEY
wrangler secret put DISCORD_APPLICATION_ID
wrangler secret put DATABASE_URL
wrangler secret put GOOGLE_SHEETS_API_KEY

# List current secrets
wrangler secret list

# Delete a secret if needed
wrangler secret delete SECRET_NAME
```

### ngrok Setup for Local Discord Development

To expose your local development server for Discord interactions:

1. **Get ngrok auth token**:
   - Sign up at [ngrok.com](https://ngrok.com)
   - Go to [Your Authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)
   - Copy your auth token

2. **Configure ngrok**:
   ```bash
   ngrok config add-authtoken YOUR_AUTHTOKEN
   ```

3. **Start tunnel for Discord bot**:
   ```bash
   # Start tunnel to port 8787 (Wrangler dev server)
   ngrok http 8787
   ```

4. **Copy tunnel URL to Discord**:
   - Copy the `https://xyz.ngrok.io` URL from ngrok output
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Set **Interactions Endpoint URL** to your ngrok URL
   - Save changes

5. **Stop tunnel**:
   ```bash
   # Press Ctrl+C in ngrok terminal, or:
   pkill ngrok
   ```

**Alternative**: Use the automated tunnel scripts:
```bash
npm run ngrok     # Starts tunnel and auto-saves URL to .dev.vars
```

#### Environment-Specific Command Registration

The bot supports separate development and production Discord applications:

```bash
# Register commands to development Discord app
DISCORD_ENV=development npm run register:dev

# Register commands to production Discord app  
DISCORD_ENV=production npm run register:prod
```

### Local Testing Workflow

#### 1. Development Discord Server Setup

Create a dedicated Discord server for development:

1. Create a new Discord server for testing
2. Go to [Discord Developer Portal](https://discord.com/developers/applications)
3. Create a new application for development
4. In the "Bot" section, create a bot user
5. Copy the bot token, public key, and application ID to `.dev.vars`
6. In "OAuth2" → "URL Generator":
   - Select `bot` and `applications.commands` scopes
   - Select `Send Messages` and `Use Slash Commands` permissions
   - Use the generated URL to invite the bot to your test server

#### 2. Local Development Testing

```bash
# Start the local development workflow
npm run dev:full

# This runs:
# 1. npm run setup:dev    (copies environment template)
# 2. npm run register:dev (registers commands to dev Discord app)
# 3. npm run dev          (starts local server with hot reload)
```

#### 3. Testing with Discord Webhook

For testing Discord interactions locally, we've automated the tunnel URL capture process:

**Option A: Automated Tunnel Setup (Recommended)**
```bash
npm run setup:tunnel
# Automatically starts tunnel and captures URL to .dev.vars
# Provides copy-paste instructions for Discord Developer Portal
```

**Option B: Manual Tunnel with URL Capture**
```bash
# Start your preferred tunnel method
npm run dev:tunnel    # Cloudflare tunnel
# OR
npm run dev:local     # Local server (then use ngrok separately)

# When you get the tunnel URL, save it automatically:
npm run save:tunnel https://your-tunnel-url.ngrok.io
# This saves the URL to .dev.vars and shows Discord setup instructions
```

**Option C: Traditional Manual Setup**
```bash
# Install ngrok globally if not using Cloudflare tunnel
npm install -g ngrok

# In one terminal, start local server
npm run dev:local

# In another terminal, expose port 8787
ngrok http 8787

# Copy the ngrok HTTPS URL and update Discord app's Interactions Endpoint URL
```

**Discord Developer Portal Configuration**:
After capturing your tunnel URL, copy it to Discord:
1. Go to [Discord Developer Portal](https://discord.com/developers/applications/1388232360633569491)
2. Navigate to General Information
3. Set "Interactions Endpoint URL" to your tunnel URL
4. Save changes

#### 4. TDD Development Cycle

For rapid red-green-refactor development:

```bash
# Run tests in watch mode
npm run test:watch

# Run register-specific tests
npm run test:register

# Local development with hot reload (no need to restart)
npm run dev
```

### Troubleshooting

#### Common Issues

1. **Commands not appearing in Discord**
   - Ensure you ran `npm run register:dev`
   - Check that DISCORD_TOKEN and DISCORD_APPLICATION_ID are correct
   - Verify bot has proper permissions in Discord server

2. **Local server not receiving Discord interactions**
   - Ensure Discord app's Interactions Endpoint URL points to your tunnel
   - Check that webhook URL ends with your worker route
   - Verify DISCORD_PUBLIC_KEY matches your Discord app

3. **Environment variables not loading**
   - Ensure `.dev.vars` exists and has correct values
   - Restart development server after changing environment variables

#### Testing Commands Locally

Test the `/register` command with various scenarios:

```bash
# Valid Rocket League tracker URLs
/register tracker1:https://rocketleague.tracker.network/rocket-league/profile/steam/76561198000000000/overview

# Invalid URLs (should show error messages)
/register tracker1:https://invalid-site.com/profile

# Multiple trackers
/register tracker1:url1 tracker2:url2 tracker3:url3 tracker4:url4
```

## Commands

- `/register` - Register up to 4 Rocket League tracker URLs