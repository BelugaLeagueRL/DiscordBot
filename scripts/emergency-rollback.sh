#!/bin/bash
set -e

# Emergency Rollback Script for Beluga Discord Bot
# Usage: ./scripts/emergency-rollback.sh [reason]

REASON="${1:-Emergency rollback - no reason specified}"
ENVIRONMENT="${2:-production}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Header
echo "=================================================================="
echo "🚨 EMERGENCY ROLLBACK PROCEDURE"
echo "=================================================================="
log_info "Environment: $ENVIRONMENT"
log_info "Reason: $REASON"
log_info "Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""

# Step 1: Authentication check
log_info "Step 1: Checking Wrangler authentication..."
if ! npx wrangler whoami > /dev/null 2>&1; then
    log_error "Wrangler not authenticated. Run: npx wrangler login"
    exit 1
fi
log_success "Wrangler authenticated"

# Step 2: Get current deployment status
log_info "Step 2: Getting current deployment status..."
CURRENT_VERSION=$(npx wrangler deployments status --env "$ENVIRONMENT" 2>/dev/null | grep "Version ID:" | cut -d: -f2 | tr -d ' ' || echo "unknown")
log_info "Current version: $CURRENT_VERSION"

# Step 3: Get previous version for rollback
log_info "Step 3: Identifying rollback target..."
DEPLOYMENTS_OUTPUT=$(npx wrangler deployments list --env "$ENVIRONMENT" 2>/dev/null)

if [ $? -ne 0 ]; then
    log_error "Failed to get deployment list"
    exit 1
fi

# Parse deployment list (skip header, get second deployment)
PREVIOUS_VERSION=$(echo "$DEPLOYMENTS_OUTPUT" | sed -n '3p' | cut -d'|' -f1 | tr -d ' ')

if [ -z "$PREVIOUS_VERSION" ] || [ "$PREVIOUS_VERSION" = "" ]; then
    log_error "No previous version found for rollback"
    log_info "Available deployments:"
    echo "$DEPLOYMENTS_OUTPUT"
    exit 1
fi

log_success "Rollback target identified: $PREVIOUS_VERSION"

# Step 4: Confirmation prompt (can be skipped with --yes flag)
if [[ "$*" != *"--yes"* ]]; then
    echo ""
    log_warning "ROLLBACK CONFIRMATION REQUIRED"
    echo "Current:  $CURRENT_VERSION"
    echo "Rollback: $PREVIOUS_VERSION"
    echo "Reason:   $REASON"
    echo ""
    read -p "Continue with rollback? (yes/no): " confirmation
    
    if [ "$confirmation" != "yes" ]; then
        log_info "Rollback cancelled by user"
        exit 0
    fi
fi

# Step 5: Execute rollback
log_info "Step 5: Executing rollback..."
echo ""
log_warning "INITIATING ROLLBACK - DO NOT INTERRUPT"

if npx wrangler rollback "$PREVIOUS_VERSION" --env "$ENVIRONMENT" --message "$REASON" --yes; then
    log_success "Rollback command completed"
else
    log_error "Rollback command failed"
    exit 1
fi

# Step 6: Wait for propagation
log_info "Step 6: Waiting for deployment propagation..."
sleep 30

# Step 7: Verify rollback success
log_info "Step 7: Verifying rollback success..."
NEW_VERSION=$(npx wrangler deployments status --env "$ENVIRONMENT" 2>/dev/null | grep "Version ID:" | cut -d: -f2 | tr -d ' ' || echo "unknown")

if [ "$NEW_VERSION" = "$PREVIOUS_VERSION" ]; then
    log_success "Rollback verified - now running version: $NEW_VERSION"
else
    log_error "Rollback verification failed"
    log_error "Expected: $PREVIOUS_VERSION, Got: $NEW_VERSION"
    exit 1
fi

# Step 8: Health validation
log_info "Step 8: Running health validation..."

# Wrangler-based validation
log_info "Running Wrangler validation..."
if npm run test:wrangler > /dev/null 2>&1; then
    log_success "Wrangler validation passed"
else
    log_warning "Wrangler validation failed (may need manual investigation)"
fi

# HTTP-based validation (if URL provided)
WORKER_URL="${WORKER_URL:-https://beluga-discord-bot.your-subdomain.workers.dev}"
log_info "Running HTTP validation on $WORKER_URL..."

if curl -f -s --max-time 10 "$WORKER_URL" > /dev/null; then
    log_success "HTTP health check passed"
else
    log_warning "HTTP health check failed (check worker URL configuration)"
fi

# Step 9: Summary and next steps
echo ""
echo "=================================================================="
echo "🎯 ROLLBACK SUMMARY"
echo "=================================================================="
log_success "Rollback completed successfully"
echo "Previous version: $CURRENT_VERSION"
echo "Current version:  $NEW_VERSION"
echo "Reason:          $REASON"
echo "Completed at:    $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""

log_info "RECOMMENDED NEXT STEPS:"
echo "1. Monitor application for 30 minutes"
echo "2. Test Discord integration manually (/register command)"
echo "3. Document incident and root cause"
echo "4. Plan fix for original issue"
echo "5. Update monitoring to prevent recurrence"
echo ""

log_info "MONITORING COMMANDS:"
echo "npx wrangler tail --env $ENVIRONMENT --format json"
echo "npx wrangler deployments status --env $ENVIRONMENT"
echo "npm run test:wrangler"
echo "npm run test:production $WORKER_URL"
echo ""

# Optional: Send notification (if webhook configured)
if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
    log_info "Sending Slack notification..."
    curl -X POST -H 'Content-type: application/json' \
        --data "{
            \"text\": \"🟢 ROLLBACK COMPLETED\",
            \"attachments\": [
                {
                    \"color\": \"good\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                        {\"title\": \"Previous Version\", \"value\": \"$CURRENT_VERSION\", \"short\": true},
                        {\"title\": \"Current Version\", \"value\": \"$NEW_VERSION\", \"short\": true},
                        {\"title\": \"Reason\", \"value\": \"$REASON\", \"short\": false}
                    ]
                }
            ]
        }" \
        "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 && log_success "Slack notification sent"
fi

log_success "Emergency rollback procedure completed successfully"
echo "=================================================================="