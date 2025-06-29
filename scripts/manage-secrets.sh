#!/bin/bash

# Beluga Discord Bot - Secrets Management Helper
# This script helps manage secrets for development and production

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEV_VARS_FILE="$PROJECT_ROOT/.dev.vars"
DEV_VARS_EXAMPLE="$PROJECT_ROOT/.dev.vars.example"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_help() {
    echo "Beluga Discord Bot - Secrets Management"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  setup-dev       Setup local development environment variables"
    echo "  validate-dev    Validate local .dev.vars file"
    echo "  setup-prod      Setup production secrets (interactive)"
    echo "  list-prod       List production secrets"
    echo "  backup-secrets  Create encrypted backup of production secrets"
    echo "  help           Show this help message"
    echo ""
}

setup_dev() {
    echo -e "${BLUE}Setting up local development environment...${NC}"
    
    if [[ ! -f "$DEV_VARS_EXAMPLE" ]]; then
        echo -e "${RED}Error: .dev.vars.example not found${NC}"
        exit 1
    fi
    
    if [[ -f "$DEV_VARS_FILE" ]]; then
        echo -e "${YELLOW}Warning: .dev.vars already exists${NC}"
        read -p "Overwrite? (y/N): " confirm
        if [[ $confirm != [yY] ]]; then
            echo "Skipping setup"
            return
        fi
    fi
    
    cp "$DEV_VARS_EXAMPLE" "$DEV_VARS_FILE"
    echo -e "${GREEN}✓ Created .dev.vars from template${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Go to https://discord.com/developers/applications"
    echo "2. Select your application (ID: 1388232360633569491)"
    echo "3. Copy the required values to .dev.vars:"
    echo "   - Bot Token (from Bot section)"
    echo "   - Public Key (from General Information)"
    echo ""
    echo -e "${BLUE}Then run: $0 validate-dev${NC}"
}

validate_dev() {
    echo -e "${BLUE}Validating local development environment...${NC}"
    
    if [[ ! -f "$DEV_VARS_FILE" ]]; then
        echo -e "${RED}Error: .dev.vars not found${NC}"
        echo "Run: $0 setup-dev"
        exit 1
    fi
    
    # Check for placeholder values
    local has_errors=false
    
    if grep -q "your_discord_bot_token_here\|your_discord_public_key_here\|your_discord_application_id_here" "$DEV_VARS_FILE"; then
        echo -e "${RED}✗ Found placeholder values in .dev.vars${NC}"
        has_errors=true
    fi
    
    # Check required variables exist
    local required_vars=("DISCORD_TOKEN" "DISCORD_APPLICATION_ID" "DISCORD_PUBLIC_KEY")
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" "$DEV_VARS_FILE"; then
            echo -e "${RED}✗ Missing required variable: $var${NC}"
            has_errors=true
        fi
    done
    
    if [[ "$has_errors" == true ]]; then
        echo ""
        echo -e "${YELLOW}Please update .dev.vars with actual values${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ .dev.vars validation passed${NC}"
    echo ""
    echo -e "${BLUE}Test with: make dev${NC}"
}

setup_prod() {
    echo -e "${BLUE}Setting up production secrets...${NC}"
    echo ""
    echo -e "${YELLOW}This will interactively set secrets in Cloudflare Workers${NC}"
    echo "Make sure you have wrangler CLI installed and authenticated"
    echo ""
    
    # Check wrangler authentication
    if ! wrangler whoami >/dev/null 2>&1; then
        echo -e "${RED}Error: Wrangler not authenticated${NC}"
        echo "Run: wrangler login"
        exit 1
    fi
    
    echo "Current Wrangler account:"
    wrangler whoami
    echo ""
    
    read -p "Continue with production secrets setup? (y/N): " confirm
    if [[ $confirm != [yY] ]]; then
        echo "Cancelled"
        return
    fi
    
    echo ""
    echo -e "${BLUE}Setting Discord secrets for production...${NC}"
    echo "Get these from: https://discord.com/developers/applications"
    wrangler secret put DISCORD_TOKEN --env production
    wrangler secret put DISCORD_APPLICATION_ID --env production
    wrangler secret put DISCORD_PUBLIC_KEY --env production
    
    echo ""
    echo -e "${BLUE}Setting production database URL...${NC}"
    echo "Enter production database connection string:"
    wrangler secret put DATABASE_URL --env production
    
    echo ""
    echo -e "${BLUE}Setting Google Sheets API key (optional)...${NC}"
    read -p "Set Google Sheets API key now? (y/N): " setup_sheets
    if [[ $setup_sheets == [yY] ]]; then
        wrangler secret put GOOGLE_SHEETS_API_KEY --env production
    fi
    
    echo ""
    echo -e "${GREEN}✓ Production secrets configured${NC}"
    echo ""
    echo -e "${BLUE}Verify with: $0 list-prod${NC}"
    echo -e "${BLUE}Test deployment with: npm run deploy${NC}"
}

list_prod() {
    echo -e "${BLUE}Production secrets:${NC}"
    wrangler secret list --env production
    
    echo ""
    echo -e "${BLUE}Production worker status:${NC}"
    wrangler list --env production || echo "No workers deployed yet"
}

backup_secrets() {
    echo -e "${BLUE}Creating encrypted backup of production secrets...${NC}"
    
    local backup_dir="$PROJECT_ROOT/backups"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$backup_dir/secrets_$timestamp.enc"
    
    mkdir -p "$backup_dir"
    
    # Create backup data
    local backup_data="# Beluga Discord Bot Secrets Backup - $timestamp"$'\n'
    backup_data+="# Production secrets list:"$'\n'
    backup_data+=$(wrangler secret list 2>/dev/null || echo "Failed to fetch secrets")
    
    # Encrypt backup (requires OpenSSL)
    echo "$backup_data" | openssl enc -aes-256-cbc -salt -out "$backup_file"
    
    echo -e "${GREEN}✓ Encrypted backup created: $backup_file${NC}"
    echo ""
    echo -e "${YELLOW}Store the encryption password securely!${NC}"
}

# Main script logic
case "${1:-help}" in
    setup-dev)
        setup_dev
        ;;
    validate-dev)
        validate_dev
        ;;
    setup-prod)
        setup_prod
        ;;
    list-prod)
        list_prod
        ;;
    backup-secrets)
        backup_secrets
        ;;
    help|*)
        show_help
        ;;
esac