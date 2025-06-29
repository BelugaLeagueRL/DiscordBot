#!/bin/bash

# Performance monitoring script for production deployment
# Run this as a cron job every 10 minutes: */10 * * * *

WORKER_URL="${WORKER_URL:-https://beluga-discord-bot.your-subdomain.workers.dev}"
LOG_FILE="/tmp/beluga-performance-monitor.log"
METRICS_FILE="/tmp/beluga-performance-metrics.json"

# Performance thresholds (in milliseconds)
RESPONSE_TIME_WARNING=2000
RESPONSE_TIME_CRITICAL=5000

log_with_timestamp() {
    echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] $1" | tee -a "$LOG_FILE"
}

send_performance_alert() {
    local message="$1"
    log_with_timestamp "🚨 PERFORMANCE ALERT: $message"
    
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"⚡ Beluga Bot Performance Alert: $message\"}" \
            "$SLACK_WEBHOOK_URL" 2>/dev/null
    fi
}

measure_response_time() {
    local url="$1"
    local start_time=$(date +%s%3N)
    
    if curl -f -s --max-time 10 "$url" > /dev/null 2>&1; then
        local end_time=$(date +%s%3N)
        local response_time=$((end_time - start_time))
        echo "$response_time"
        return 0
    else
        echo "-1"
        return 1
    fi
}

perform_load_test() {
    log_with_timestamp "Starting performance load test..."
    
    local total_requests=10
    local successful_requests=0
    local total_response_time=0
    local max_response_time=0
    local min_response_time=999999
    
    for i in $(seq 1 $total_requests); do
        response_time=$(measure_response_time "$WORKER_URL")
        
        if [ "$response_time" -ne -1 ]; then
            successful_requests=$((successful_requests + 1))
            total_response_time=$((total_response_time + response_time))
            
            if [ "$response_time" -gt "$max_response_time" ]; then
                max_response_time=$response_time
            fi
            
            if [ "$response_time" -lt "$min_response_time" ]; then
                min_response_time=$response_time
            fi
        fi
        
        # Small delay between requests
        sleep 0.5
    done
    
    if [ "$successful_requests" -gt 0 ]; then
        local avg_response_time=$((total_response_time / successful_requests))
        local success_rate=$((successful_requests * 100 / total_requests))
        
        # Save metrics to file
        cat > "$METRICS_FILE" << EOF
{
    "timestamp": "$(date -u '+%Y-%m-%d %H:%M:%S UTC')",
    "total_requests": $total_requests,
    "successful_requests": $successful_requests,
    "success_rate": $success_rate,
    "avg_response_time": $avg_response_time,
    "min_response_time": $min_response_time,
    "max_response_time": $max_response_time
}
EOF
        
        log_with_timestamp "Performance metrics: avg=${avg_response_time}ms, min=${min_response_time}ms, max=${max_response_time}ms, success=${success_rate}%"
        
        # Check thresholds
        if [ "$avg_response_time" -gt "$RESPONSE_TIME_CRITICAL" ]; then
            send_performance_alert "CRITICAL: Average response time ${avg_response_time}ms (threshold: ${RESPONSE_TIME_CRITICAL}ms)"
        elif [ "$avg_response_time" -gt "$RESPONSE_TIME_WARNING" ]; then
            send_performance_alert "WARNING: Average response time ${avg_response_time}ms (threshold: ${RESPONSE_TIME_WARNING}ms)"
        fi
        
        if [ "$success_rate" -lt 95 ]; then
            send_performance_alert "CRITICAL: Success rate ${success_rate}% (threshold: 95%)"
        elif [ "$success_rate" -lt 98 ]; then
            send_performance_alert "WARNING: Success rate ${success_rate}% (threshold: 98%)"
        fi
        
        return 0
    else
        log_with_timestamp "❌ All performance test requests failed"
        send_performance_alert "CRITICAL: All performance test requests failed"
        return 1
    fi
}

check_error_rate() {
    log_with_timestamp "Checking error rate from logs..."
    
    # Use wrangler to get recent logs and analyze error rate
    if npx wrangler whoami > /dev/null 2>&1; then
        # Get logs from last 5 minutes and count errors
        timeout 30s npx wrangler tail --env production --format json 2>/dev/null | \
        head -50 | \
        jq -r 'select(.outcome) | .outcome' | \
        awk '
        BEGIN { total=0; errors=0 }
        { total++ }
        /exception|error/ { errors++ }
        END { 
            if (total > 0) {
                error_rate = (errors * 100) / total
                printf "%.2f\n", error_rate
            } else {
                print "0"
            }
        }' > /tmp/error_rate.tmp
        
        if [ -s /tmp/error_rate.tmp ]; then
            error_rate=$(cat /tmp/error_rate.tmp)
            log_with_timestamp "Current error rate: ${error_rate}%"
            
            # Check error rate thresholds
            if [ "$(echo "$error_rate > 10" | bc -l)" -eq 1 ]; then
                send_performance_alert "CRITICAL: Error rate ${error_rate}% (threshold: 10%)"
            elif [ "$(echo "$error_rate > 5" | bc -l)" -eq 1 ]; then
                send_performance_alert "WARNING: Error rate ${error_rate}% (threshold: 5%)"
            fi
        else
            log_with_timestamp "Unable to calculate error rate from logs"
        fi
    else
        log_with_timestamp "⚠️  Wrangler not authenticated - skipping error rate check"
    fi
}

generate_performance_report() {
    if [ -f "$METRICS_FILE" ]; then
        log_with_timestamp "📊 Performance Report:"
        cat "$METRICS_FILE" | jq -r '
        "  Timestamp: " + .timestamp,
        "  Success Rate: " + (.success_rate | tostring) + "%",
        "  Avg Response: " + (.avg_response_time | tostring) + "ms",
        "  Min Response: " + (.min_response_time | tostring) + "ms", 
        "  Max Response: " + (.max_response_time | tostring) + "ms"
        ' | while read line; do
            log_with_timestamp "$line"
        done
    fi
}

# Main execution
log_with_timestamp "Starting performance monitoring..."

# Perform load test
if perform_load_test; then
    log_with_timestamp "✅ Performance load test completed"
else
    log_with_timestamp "❌ Performance load test failed"
fi

# Check error rates
check_error_rate

# Generate report
generate_performance_report

log_with_timestamp "Performance monitoring completed"

# Cleanup old metrics files (keep last 24 hours)
find /tmp -name "beluga-performance-metrics-*.json" -mtime +1 -delete 2>/dev/null || true