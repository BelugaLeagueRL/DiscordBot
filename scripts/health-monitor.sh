#!/bin/bash

# Health monitoring script for production deployment
# Run this as a cron job every 5 minutes: */5 * * * *

WORKER_URL="${WORKER_URL:-https://beluga-discord-bot.your-subdomain.workers.dev}"
LOG_FILE="/tmp/beluga-health-monitor.log"
ALERT_THRESHOLD=3  # Number of consecutive failures before alert

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_with_timestamp() {
    echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] $1" | tee -a "$LOG_FILE"
}

send_alert() {
    local message="$1"
    log_with_timestamp "🚨 ALERT: $message"
    
    # Send Slack notification if webhook configured
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 Beluga Bot Health Alert: $message\"}" \
            "$SLACK_WEBHOOK_URL" 2>/dev/null
    fi
    
    # Send email if configured
    if [ ! -z "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "Beluga Bot Health Alert" "$ALERT_EMAIL" 2>/dev/null
    fi
}

check_health() {
    local start_time=$(date +%s%3N)
    
    # HTTP health check
    if response=$(curl -f -s --max-time 10 "$WORKER_URL" 2>&1); then
        local end_time=$(date +%s%3N)
        local response_time=$((end_time - start_time))
        
        # Parse JSON response
        if echo "$response" | jq -e '.status == "healthy"' > /dev/null 2>&1; then
            log_with_timestamp "✅ Health check passed (${response_time}ms)"
            
            # Check for performance degradation
            if [ "$response_time" -gt 5000 ]; then
                send_alert "Slow response time: ${response_time}ms (threshold: 5000ms)"
            elif [ "$response_time" -gt 2000 ]; then
                log_with_timestamp "⚠️  Slow response time: ${response_time}ms"
            fi
            
            return 0
        else
            log_with_timestamp "❌ Health check failed: unhealthy status"
            return 1
        fi
    else
        log_with_timestamp "❌ Health check failed: $response"
        return 1
    fi
}

check_wrangler_status() {
    # Check if wrangler is authenticated
    if ! npx wrangler whoami > /dev/null 2>&1; then
        log_with_timestamp "⚠️  Wrangler not authenticated"
        return 1
    fi
    
    # Check deployment status
    if deployment_status=$(npx wrangler deployments status --env production 2>&1); then
        log_with_timestamp "✅ Wrangler status check passed"
        return 0
    else
        log_with_timestamp "❌ Wrangler status check failed: $deployment_status"
        return 1
    fi
}

# Track consecutive failures
FAILURE_COUNT_FILE="/tmp/beluga-health-failures"

# Perform health checks
log_with_timestamp "Starting health monitoring check..."

http_healthy=false
wrangler_healthy=false

if check_health; then
    http_healthy=true
fi

if check_wrangler_status; then
    wrangler_healthy=true
fi

# Overall health assessment
if $http_healthy && $wrangler_healthy; then
    # Reset failure count on success
    echo "0" > "$FAILURE_COUNT_FILE"
    log_with_timestamp "✅ All health checks passed"
elif $http_healthy || $wrangler_healthy; then
    # Partial failure
    failure_count=$(cat "$FAILURE_COUNT_FILE" 2>/dev/null || echo "0")
    failure_count=$((failure_count + 1))
    echo "$failure_count" > "$FAILURE_COUNT_FILE"
    
    log_with_timestamp "⚠️  Partial health check failure (count: $failure_count)"
    
    if [ "$failure_count" -ge $ALERT_THRESHOLD ]; then
        send_alert "Partial health failures detected ($failure_count consecutive)"
    fi
else
    # Complete failure
    failure_count=$(cat "$FAILURE_COUNT_FILE" 2>/dev/null || echo "0")
    failure_count=$((failure_count + 1))
    echo "$failure_count" > "$FAILURE_COUNT_FILE"
    
    log_with_timestamp "❌ Complete health check failure (count: $failure_count)"
    
    if [ "$failure_count" -ge $ALERT_THRESHOLD ]; then
        send_alert "CRITICAL: Complete health check failure ($failure_count consecutive) - Consider emergency rollback"
    fi
fi

log_with_timestamp "Health monitoring check completed"