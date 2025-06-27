# Secrets Management Guide

This document outlines how secrets and environment variables are managed in the Beluga Discord Bot project.

## Overview

The project uses Cloudflare Workers' environment variable system with different approaches for local development vs production:

- **Local Development**: `.dev.vars` file (Git ignored)
- **Production**: Wrangler secrets (encrypted and secure)

## Required Environment Variables

### Discord Configuration
| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DISCORD_TOKEN` | Bot token from Discord Developer Portal | `MTM4...YAU` | Yes |
| `DISCORD_APPLICATION_ID` | Application ID from Discord Developer Portal | `1388232360633569491` | Yes |
| `DISCORD_PUBLIC_KEY` | Public key for request verification | `ed25519...` | Yes |

### Database Configuration
| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | Database connection string | `file:./local.db` (local)<br>`postgres://...` (prod) | Yes |

### External APIs
| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `GOOGLE_SHEETS_API_KEY` | Google Sheets API key | `AIza...` | Future |

### Environment
| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `ENVIRONMENT` | Current environment | `development`<br>`production` | Yes |

## Local Development Setup

### 1. Copy Environment Template
```bash
cp .dev.vars.example .dev.vars
```

### 2. Get Discord Credentials

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application (or create one)
3. Go to "Bot" section:
   - Copy the **Token** → `DISCORD_TOKEN`
4. Go to "General Information":
   - Copy **Application ID** → `DISCORD_APPLICATION_ID`
   - Copy **Public Key** → `DISCORD_PUBLIC_KEY`

### 3. Update .dev.vars
Edit `.dev.vars` with your actual credentials:

```bash
# Discord Bot Configuration
DISCORD_TOKEN="your_actual_bot_token"
DISCORD_APPLICATION_ID="your_actual_application_id"
DISCORD_PUBLIC_KEY="your_actual_public_key"
```

**Note**: The public key is required for Discord request verification. You can find it in the "General Information" section of your Discord application.

### 4. Test Configuration
```bash
make dev
```

## Helper Commands

The project includes helper commands for easier secrets management:

```bash
# Setup local development secrets from template
make secrets-setup

# Validate local secrets configuration
make secrets-validate

# Setup production secrets (interactive)
make secrets-prod

# List current production secrets
make secrets-list
```

### Using the Secrets Management Script

For more advanced operations, use the helper script directly:

```bash
# Interactive setup
./scripts/manage-secrets.sh setup-dev

# Validation
./scripts/manage-secrets.sh validate-dev

# Production setup
./scripts/manage-secrets.sh setup-prod

# Create encrypted backup
./scripts/manage-secrets.sh backup-secrets
```

## Production Secrets Management

### Setting Production Secrets

Use Wrangler CLI to securely set production secrets:

```bash
# Discord credentials
wrangler secret put DISCORD_TOKEN
wrangler secret put DISCORD_APPLICATION_ID
wrangler secret put DISCORD_PUBLIC_KEY

# Database
wrangler secret put DATABASE_URL

# Google Sheets (when implemented)
wrangler secret put GOOGLE_SHEETS_API_KEY
```

### Environment Variables (Non-secret)
Set non-sensitive environment variables in `wrangler.toml`:

```toml
[vars]
ENVIRONMENT = "production"
```

### Listing Current Secrets
```bash
wrangler secret list
```

### Updating Secrets
```bash
wrangler secret put SECRET_NAME
```

### Deleting Secrets
```bash
wrangler secret delete SECRET_NAME
```

## CI/CD Integration

### GitHub Actions Secrets

For automated deployment, set these secrets in GitHub repository settings:

1. Go to repository → Settings → Secrets and variables → Actions
2. Add secrets:
   - `CLOUDFLARE_API_TOKEN` - Cloudflare API token for Wrangler
   - `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

### Deployment Workflow

The GitHub Actions deployment workflow automatically uses production secrets stored in Cloudflare Workers.

## Security Best Practices

### ✅ Do
- Use `.dev.vars` for local development only
- Set production secrets via `wrangler secret put`
- Keep `.dev.vars` in `.gitignore`
- Rotate secrets regularly
- Use different credentials for development vs production
- Validate all environment variables at startup

### ❌ Don't
- Commit secrets to version control
- Share `.dev.vars` files
- Use production secrets in development
- Log secret values
- Store secrets in plain text files

## Troubleshooting

### Common Issues

**"Missing environment variable" error:**
1. Check `.dev.vars` file exists and has correct values
2. Verify `wrangler.toml` configuration
3. For production, ensure secrets are set via `wrangler secret put`

**"Invalid Discord token" error:**
1. Verify token is copied correctly (no extra spaces)
2. Check token hasn't expired or been regenerated
3. Ensure bot has correct permissions

**Local development not loading secrets:**
1. Ensure `.dev.vars` is in project root
2. Check file format (KEY="value")
3. Restart `wrangler dev`

### Getting Help

1. Check [Cloudflare Workers docs](https://developers.cloudflare.com/workers/development-testing/environment-variables/)
2. Verify [Discord Developer Portal](https://discord.com/developers/applications) settings
3. Review project documentation in `README.md`