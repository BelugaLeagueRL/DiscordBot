#!/bin/bash

# Upload production secrets from .prod.vars to Cloudflare Workers
# This reads the .prod.vars file and uploads each secret via wrangler

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PROD_VARS_FILE="$PROJECT_ROOT/.prod.vars"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if .prod.vars exists
if [[ ! -f "$PROD_VARS_FILE" ]]; then
    log_error ".prod.vars file not found at $PROD_VARS_FILE"
    exit 1
fi

# Check wrangler authentication
log_info "Checking Wrangler authentication..."
if ! npx wrangler whoami >/dev/null 2>&1; then
    log_error "Wrangler not authenticated"
    log_info "Please set CLOUDFLARE_API_TOKEN environment variable or run: npx wrangler login"
    exit 1
fi

log_success "Wrangler authenticated"

# Set account ID for Belugaleague account
export CLOUDFLARE_ACCOUNT_ID="4e80ddd0812bfef6b5c15303902fb943"
log_info "Using Cloudflare account: Belugaleague@gmail.com (${CLOUDFLARE_ACCOUNT_ID})"

echo ""
log_info "Uploading production secrets from .prod.vars..."

# Function to upload a secret
upload_secret() {
    local key="$1"
    local value="$2"
    
    if [[ -z "$value" || "$value" == "\"\"" || "$value" == "''" ]]; then
        log_warning "Skipping empty secret: $key"
        return
    fi
    
    # Remove quotes if present
    value=$(echo "$value" | sed 's/^"//;s/"$//')
    
    log_info "Uploading $key..."
    if echo "$value" | npx wrangler secret put "$key" --env production >/dev/null 2>&1; then
        log_success "$key uploaded successfully"
    else
        log_error "Failed to upload $key"
        return 1
    fi
}

# Read .prod.vars and upload each secret
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ "$key" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$key" ]] && continue
    
    # Only upload actual secrets (not ENVIRONMENT)
    case "$key" in
        "DISCORD_TOKEN"|"DISCORD_PUBLIC_KEY"|"DISCORD_APPLICATION_ID"|"DATABASE_URL"|"GOOGLE_CREDENTIALS_JSON")
            upload_secret "$key" "$value"
            ;;
        *)
            log_info "Skipping non-secret variable: $key"
            ;;
    esac
done < "$PROD_VARS_FILE"

echo ""
log_success "Production secrets upload completed!"

# Verify secrets were uploaded
log_info "Verifying uploaded secrets..."
npx wrangler secret list --env production

echo ""
log_success "✨ All production secrets configured!"
log_info "You can now deploy with: npm run deploy"