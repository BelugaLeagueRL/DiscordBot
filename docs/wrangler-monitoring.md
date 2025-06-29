# Wrangler-Based Production Monitoring

This guide covers using Wrangler's native monitoring capabilities for comprehensive production validation and ongoing monitoring.

## Why Use Wrangler for Monitoring?

Wrangler provides direct access to Cloudflare's infrastructure monitoring:

- **Native Integration**: Direct access to Cloudflare Workers metrics
- **Real-time Logs**: Live log streaming with filtering capabilities  
- **Deployment Management**: Built-in deployment status and rollback
- **Secret Management**: Secure validation of production secrets
- **No External Dependencies**: Uses Cloudflare's native monitoring infrastructure

## Available Wrangler Monitoring Commands

### 1. Deployment Status
```bash
# Check current production deployment status
npx wrangler deployments status --env production

# List recent deployments
npx wrangler deployments list --env production
```

### 2. Real-time Log Monitoring
```bash
# Tail logs in real-time
npx wrangler tail --env production

# Tail with JSON formatting for analysis
npx wrangler tail --env production --format json

# Filter logs by status
npx wrangler tail --env production --status error
npx wrangler tail --env production --status ok

# Filter by specific search terms
npx wrangler tail --env production --search "register"
npx wrangler tail --env production --search "ERROR"

# Filter by HTTP method
npx wrangler tail --env production --method POST
```

### 3. Rollback Management
```bash
# Rollback to previous version
npx wrangler rollback [version-id] --env production

# Rollback with reason
npx wrangler rollback [version-id] --env production --message "Health check failed"
```

### 4. Secret Management
```bash
# List configured secrets
npx wrangler secret list --env production

# Add or update secrets
npx wrangler secret put DISCORD_TOKEN --env production
```

## Automated Wrangler Validation

The `scripts/wrangler-production-validation.js` script provides comprehensive validation:

### Authentication Check
```javascript
✅ Authenticated as: your-email@domain.com
```

### Deployment Status Validation
```javascript
📦 Version ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
📅 Deployed: 2025-06-29T15:30:00.000Z
🌍 Deployments: production (100%)
```

### Recent Deployments Analysis
```javascript
🔴 Current: a1b2c3d4-e5f6-7890-abcd-ef1234567890 (2025-06-29T15:30:00.000Z)
  2. b2c3d4e5-f6g7-8901-bcde-f23456789012 (2025-06-29T14:15:00.000Z)
  3. c3d4e5f6-g7h8-9012-cdef-345678901234 (2025-06-29T13:00:00.000Z)
```

### Secret Configuration Validation
```javascript
🔐 Configured secrets: DISCORD_TOKEN, DISCORD_PUBLIC_KEY, DISCORD_APPLICATION_ID
✅ All required secrets are configured
```

### Real-time Log Analysis
```javascript
📈 Requests: 15, Errors: 0
✅ Captured 32 log entries
```

### Rollback Capability Check
```javascript
📦 Rollback options: 5 previous deployments
✅ Multiple deployments available for rollback
```

## Production Monitoring Workflow

### 1. Automated Validation (GitHub Actions)
```yaml
- name: Wrangler Production Validation
  run: node scripts/wrangler-production-validation.js
  
- name: HTTP Production Validation  
  run: node scripts/test-production-deployment.js
```

### 2. Manual Monitoring Commands
```bash
# Quick health check
npm run test:wrangler

# HTTP endpoint validation
npm run test:production https://your-worker.workers.dev

# Real-time monitoring
npx wrangler tail --env production --format json

# Check deployment status
npx wrangler deployments status --env production
```

### 3. Continuous Monitoring Setup
```bash
# Monitor logs continuously
while true; do
  npx wrangler tail --env production --format json --status error | head -10
  sleep 60
done

# Check deployment status every 5 minutes
watch -n 300 'npx wrangler deployments status --env production'
```

## Alerting and Monitoring Integration

### Log-based Alerting
```bash
# Monitor for errors and send alerts
npx wrangler tail --env production --format json --status error | \
  while read line; do
    echo "🚨 Error detected: $line" | mail -s "Worker Error" admin@example.com
  done
```

### Deployment Monitoring
```bash
# Monitor deployment changes
LAST_VERSION=$(npx wrangler deployments status --env production | grep "Version ID" | cut -d: -f2)
while true; do
  CURRENT_VERSION=$(npx wrangler deployments status --env production | grep "Version ID" | cut -d: -f2)
  if [ "$CURRENT_VERSION" != "$LAST_VERSION" ]; then
    echo "🚀 New deployment detected: $CURRENT_VERSION"
    # Run validation
    npm run test:wrangler
    LAST_VERSION=$CURRENT_VERSION
  fi
  sleep 300 # Check every 5 minutes
done
```

### Health Check Monitoring
```bash
# Automated health check with Wrangler validation
#!/bin/bash
health_check() {
  # Run Wrangler validation
  if npm run test:wrangler > /dev/null 2>&1; then
    echo "✅ Wrangler validation passed"
    return 0
  else
    echo "❌ Wrangler validation failed"
    return 1
  fi
}

# Monitor continuously
while true; do
  if ! health_check; then
    echo "🚨 Production health check failed!"
    # Send alert, trigger rollback, etc.
  fi
  sleep 300
done
```

## Troubleshooting with Wrangler

### Common Issues and Solutions

#### Authentication Issues
```bash
# Problem: "Not authenticated"
npx wrangler whoami
# Solution: Re-authenticate
npx wrangler login
```

#### Deployment Issues
```bash
# Check deployment status
npx wrangler deployments status --env production

# View recent deployments
npx wrangler deployments list --env production

# Rollback if needed
npx wrangler rollback [previous-version-id] --env production
```

#### Secret Issues
```bash
# List secrets to verify configuration
npx wrangler secret list --env production

# Update missing or incorrect secrets
npx wrangler secret put DISCORD_TOKEN --env production
```

#### Performance Issues
```bash
# Monitor logs for performance patterns
npx wrangler tail --env production --format json | jq '.eventTimestamp, .outcome'

# Look for specific error patterns
npx wrangler tail --env production --search "timeout"
npx wrangler tail --env production --search "memory"
```

#### Error Investigation
```bash
# Filter error logs
npx wrangler tail --env production --status error --format json

# Search for specific error types
npx wrangler tail --env production --search "Discord"
npx wrangler tail --env production --search "validation"

# Monitor specific endpoints
npx wrangler tail --env production --method POST
```

## Best Practices

### 1. Monitoring Strategy
- **Automated**: Use both Wrangler and HTTP validation in CI/CD
- **Real-time**: Set up continuous log monitoring for errors
- **Periodic**: Schedule regular deployment status checks
- **Alerting**: Configure notifications for failures

### 2. Log Management
```bash
# Use structured logging for better analysis
npx wrangler tail --env production --format json | jq '.'

# Filter and analyze specific patterns
npx wrangler tail --env production --format json | \
  jq 'select(.outcome == "exception") | .logs'
```

### 3. Deployment Safety
```bash
# Always check status before rollback
npx wrangler deployments status --env production

# Document rollback reasons
npx wrangler rollback [version] --env production \
  --message "Rollback due to health check failure"
```

### 4. Secret Security
```bash
# Regularly audit configured secrets
npx wrangler secret list --env production

# Rotate secrets periodically
npx wrangler secret put DISCORD_TOKEN --env production
```

## Integration with External Monitoring

### Datadog Integration
```bash
# Send Wrangler metrics to Datadog
npx wrangler tail --env production --format json | \
  while read line; do
    echo "$line" | curl -X POST "https://http-intake.logs.datadoghq.com/v1/input/$DD_API_KEY" \
      -H "Content-Type: application/json" \
      -d @-
  done
```

### Prometheus/Grafana
```bash
# Export metrics for Prometheus
npx wrangler tail --env production --format json | \
  node scripts/export-prometheus-metrics.js
```

### Slack Notifications
```bash
# Send alerts to Slack
alert_slack() {
  local message="$1"
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"🚨 Worker Alert: $message\"}" \
    $SLACK_WEBHOOK_URL
}

# Monitor for errors
npx wrangler tail --env production --status error | \
  while read line; do
    alert_slack "Error detected in production Worker: $line"
  done
```

This comprehensive Wrangler-based monitoring approach provides deep visibility into your Cloudflare Workers deployment with native tooling integration.