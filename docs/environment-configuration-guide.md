# Environment Configuration Guide

This guide provides comprehensive instructions for configuring Cloudflare Workers environments for the Beluga Discord Bot, covering both Cloudflare dashboard settings and development environment setup.

## Overview

The Discord bot uses environment-aware configuration to handle different deployment contexts:

- **Development Environment**: Uses `TEST_CHANNEL_ID` for local testing
- **Production Environment**: Uses `REGISTER_COMMAND_REQUEST_CHANNEL_ID` for live Discord server

Environment mismatches can cause the `/register` command to fail with channel restriction errors.

## Environment Architecture

```
┌─────────────────────┐    ┌─────────────────────┐
│   Development       │    │   Production        │
│                     │    │                     │
│ Name: beluga-bot-dev│    │ Name: belugabot     │
│ Env:  development   │    │ Env:  production    │
│ Channel: TEST_ID    │    │ Channel: REGISTER_ID│
└─────────────────────┘    └─────────────────────┘
          │                           │
          └───────────┬───────────────┘
                      │
                ┌───────────┐
                │ GitHub    │
                │Integration│
                └───────────┘
```

## Critical Configuration Points

### 1. Cloudflare GitHub Integration (Dashboard)

**Location**: Cloudflare Dashboard → Workers & Pages → [Your Worker] → Settings → Git Integration

**Critical Setting**: Deploy Command Configuration
```bash
# ❌ WRONG - Deploys to default/development environment
npx wrangler deploy

# ✅ CORRECT - Deploys to production environment  
npx wrangler deploy --env production
```

**Issue Symptoms**:
- Health check shows `"environment":"development"` instead of `"production"`
- Discord command fails with "Channel restriction not configured. Missing TEST_CHANNEL_ID environment variable"
- Worker name appears as `beluga-discord-bot-dev` instead of `belugabot`

### 2. wrangler.toml Configuration (Development)

**File**: `/wrangler.toml`

**Default Environment Configuration**:
```toml
# Default configuration (production)
[vars]
ENVIRONMENT = "production"  # ← Must be "production" for GitHub integration

# Development environment
[env.development]
name = "beluga-discord-bot-dev"
vars = { ENVIRONMENT = "development" }

# Production environment  
[env.production]
name = "belugabot"
vars = { ENVIRONMENT = "production" }
```

**Critical Notes**:
- Default configuration MUST use `ENVIRONMENT = "production"`
- GitHub integration uses default configuration when `--env production` is specified
- Development environment is for local testing only

### 3. Secret Management (Per Environment)

**Production Secrets** (Required for Discord functionality):
```bash
# Set production secrets
npx wrangler secret put DISCORD_TOKEN --env production
npx wrangler secret put DISCORD_PUBLIC_KEY --env production  
npx wrangler secret put DISCORD_APPLICATION_ID --env production
npx wrangler secret put REGISTER_COMMAND_REQUEST_CHANNEL_ID --env production
npx wrangler secret put REGISTER_COMMAND_RESPONSE_CHANNEL_ID --env production
```

**Development Secrets** (For local testing):
```bash
# Set development secrets  
npx wrangler secret put DISCORD_TOKEN --env development
npx wrangler secret put DISCORD_PUBLIC_KEY --env development
npx wrangler secret put DISCORD_APPLICATION_ID --env development
npx wrangler secret put TEST_CHANNEL_ID --env development
```

**Verification Commands**:
```bash
# Check production secrets
npx wrangler secret list --env production

# Check development secrets
npx wrangler secret list --env development

# Check default environment secrets
npx wrangler secret list
```

## Configuration Troubleshooting

### Problem: GitHub Integration Deploys to Wrong Environment

**Symptoms**:
```json
{
  "environment": "development",
  "deploymentSource": "cloudflare-github-integration"
}
```

**Root Cause**: Cloudflare GitHub integration deploy command not specifying environment

**Solution**:
1. Go to Cloudflare Dashboard → Workers & Pages → [Worker Name] → Settings
2. Find "Build configuration" → "Deploy command"
3. Change from `npx wrangler deploy` to `npx wrangler deploy --env production`
4. Save configuration
5. Trigger new deployment by pushing to GitHub

### Problem: Channel Restriction Errors

**Error Messages**:
```
This command can only be used in the test channel.
Channel restriction not configured. Missing TEST_CHANNEL_ID environment variable.
Channel restriction not configured. Missing REGISTER_COMMAND_REQUEST_CHANNEL_ID environment variable.
```

**Diagnosis**:
```bash
# Check health endpoint to see current environment
curl -s "https://belugabot.belugaleague.workers.dev/" | jq '.checks.environment'

# Should return: "production"
# If returns: "development" → GitHub integration misconfigured
# If returns: "unknown" → Environment variable not set
```

**Solutions by Environment**:

**Development Environment Issues**:
```bash
# Add missing TEST_CHANNEL_ID
echo "1243372169908588554" | npx wrangler secret put TEST_CHANNEL_ID --env development
```

**Production Environment Issues**:
```bash
# Add missing REGISTER_COMMAND_REQUEST_CHANNEL_ID  
echo "1243372169908588554" | npx wrangler secret put REGISTER_COMMAND_REQUEST_CHANNEL_ID --env production
```

### Problem: Manual vs GitHub Deployment Differences

**Manual Deployment** (Developer Machine):
```bash
# Deploys to production environment correctly
npx wrangler deploy --env production
```

**GitHub Integration** (Automatic):
- Uses deploy command configured in Cloudflare dashboard
- Must be set to `npx wrangler deploy --env production`
- Otherwise defaults to development environment

**Verification**:
```bash
# Check latest deployment source
curl -s "https://belugabot.belugaleague.workers.dev/" | jq '.checks.deploymentSource'

# Should return: "cloudflare-github-integration" for auto-deployments
```

## Environment Validation Procedures

### 1. Pre-Deployment Validation

```bash
echo "🔍 Validating environment configuration..."

# Check wrangler.toml default environment
grep -A 3 "# Default configuration" wrangler.toml

# Verify production secrets exist
npx wrangler secret list --env production | grep -E "(DISCORD_|REGISTER_COMMAND_)"

# Check development secrets (for local testing)
npx wrangler secret list --env development | grep -E "(DISCORD_|TEST_)"
```

### 2. Post-Deployment Validation

```bash
echo "🔍 Validating deployed environment..."

# Check environment detection
HEALTH_RESPONSE=$(curl -s "https://belugabot.belugaleague.workers.dev/")
echo $HEALTH_RESPONSE | jq '.checks.environment'
echo $HEALTH_RESPONSE | jq '.checks.deploymentSource'

# Validate expected values
if [[ $(echo $HEALTH_RESPONSE | jq -r '.checks.environment') == "production" ]]; then
  echo "✅ Environment: Production (correct)"
else
  echo "❌ Environment: Not production (issue detected)"
fi
```

### 3. Discord Integration Test

```bash
echo "🧪 Testing Discord integration..."

# Test health endpoint
curl -s "https://belugabot.belugaleague.workers.dev/" | jq '.status'

# Manual Discord test:
# 1. Open Discord client
# 2. Navigate to channel: 1243372169908588554  
# 3. Run: /register
# 4. Expected: Command processes successfully
# 5. If error: Check environment and secrets configuration
```

## Development Workflow

### Local Development Setup

```bash
# 1. Set up development environment
cp .dev.vars.example .dev.vars
# Edit .dev.vars with development values

# 2. Test locally with development environment
npx wrangler dev --env development

# 3. Test production deployment manually  
npx wrangler deploy --env production

# 4. Validate deployment
npm run test:wrangler
```

### Production Deployment Process

```bash
# 1. Commit changes to GitHub
git add -A
git commit -m "Your changes"
git push origin main

# 2. Monitor GitHub integration deployment
# (Automatic via Cloudflare GitHub integration)

# 3. Validate deployment
sleep 30  # Wait for propagation
curl -s "https://belugabot.belugaleague.workers.dev/" | jq '.'

# 4. Test Discord functionality
# Use /register command in channel 1243372169908588554
```

## Monitoring and Debugging

### Environment Detection Commands

```bash
# Quick environment check
curl -s "https://belugabot.belugaleague.workers.dev/" | jq '.checks'

# Detailed deployment information  
npx wrangler deployments list --env production | head -5

# Current deployment version
npx wrangler versions view $(npx wrangler deployments list --env production | head -2 | tail -1 | awk '{print $8}') --env production
```

### Debug Health Check Endpoint

The health check endpoint provides environment debugging information:

```json
{
  "status": "healthy",
  "checks": {
    "secrets": "pass",
    "environment": "production",          // ← Current environment
    "deploymentSource": "cloudflare-github-integration"  // ← Deployment method
  }
}
```

**Environment Values**:
- `"production"` = Correct for live Discord server
- `"development"` = Issue with GitHub integration configuration  
- `"unknown"` = Environment variable not set

**Deployment Source Values**:
- `"cloudflare-github-integration"` = Automatic GitHub deployment
- `"manual"` = Developer machine deployment

### Log Monitoring

```bash
# Monitor deployment logs
npx wrangler tail --env production --format json

# Monitor environment-specific issues
npx wrangler tail --env production --search "environment\|channel"

# Monitor Discord command errors
npx wrangler tail --env production --search "register\|channel.*restriction"
```

## Emergency Procedures

### Emergency Environment Fix

If production is deployed to wrong environment:

```bash
echo "🚨 Emergency environment fix..."

# 1. Deploy manually to correct environment immediately
npx wrangler deploy --env production

# 2. Verify fix
curl -s "https://belugabot.belugaleague.workers.dev/" | jq '.checks.environment'

# 3. Fix GitHub integration (prevent future issues)
# → Go to Cloudflare Dashboard
# → Update deploy command to: npx wrangler deploy --env production

# 4. Test Discord functionality
echo "Test /register command in Discord channel 1243372169908588554"
```

### Rollback Procedures

```bash
# List recent deployments
npx wrangler deployments list --env production

# Rollback to previous version
npx wrangler rollback [previous-version-id] --env production --message "Environment configuration rollback"

# Verify rollback
npm run test:wrangler
```

## Configuration Checklist

### ✅ Cloudflare Dashboard Configuration
- [ ] GitHub integration deploy command: `npx wrangler deploy --env production`
- [ ] Production environment secrets configured
- [ ] Health check endpoint returns `"environment":"production"`

### ✅ Development Configuration
- [ ] wrangler.toml default environment: `ENVIRONMENT = "production"`
- [ ] Production environment section properly configured
- [ ] Development environment section for local testing

### ✅ Secret Management
- [ ] All production secrets set with `--env production`
- [ ] Channel IDs correctly configured for each environment
- [ ] Discord API credentials valid and accessible

### ✅ Validation Procedures
- [ ] Health check endpoint accessible and returning correct data
- [ ] Discord `/register` command works in production channel
- [ ] Manual deployment process documented and tested
- [ ] GitHub integration deployment verified

This configuration ensures reliable environment handling across development and production contexts with proper secret management and deployment procedures.