# Production Rollback Procedures

This document outlines comprehensive rollback procedures for the Beluga Discord Bot production deployment.

## Quick Rollback Commands

### Emergency Rollback (1-2 minutes)
```bash
# 1. Get current deployment list
npx wrangler deployments list --env production

# 2. Rollback to previous version
npx wrangler rollback [previous-version-id] --env production --message "Emergency rollback"

# 3. Verify rollback success
npx wrangler deployments status --env production
npm run test:wrangler
```

### Automated Rollback Validation
```bash
# Script: scripts/emergency-rollback.sh
#!/bin/bash
set -e

REASON="${1:-Emergency rollback}"
echo "🚨 Initiating emergency rollback: $REASON"

# Get previous version
PREVIOUS_VERSION=$(npx wrangler deployments list --env production | sed -n '3p' | cut -d'|' -f1 | tr -d ' ')

if [ -z "$PREVIOUS_VERSION" ]; then
  echo "❌ No previous version found for rollback"
  exit 1
fi

echo "🔄 Rolling back to version: $PREVIOUS_VERSION"

# Execute rollback
npx wrangler rollback "$PREVIOUS_VERSION" --env production --message "$REASON" --yes

# Validate rollback
echo "✅ Rollback completed. Validating..."
sleep 30
npm run test:wrangler && npm run test:production
```

## Rollback Scenarios and Procedures

### 1. Health Check Failures

**Triggers:**
- Health endpoint returns 503 status
- Health check reports "unhealthy" status
- Missing or invalid secrets detected

**Procedure:**
```bash
# Step 1: Immediate assessment
curl -f https://your-worker.workers.dev || echo "Health check failed"

# Step 2: Check logs for root cause
npx wrangler tail --env production --status error --format json | head -20

# Step 3: Quick fix attempt (if obvious)
# - Check secrets: npx wrangler secret list --env production
# - Fix missing secrets if identified

# Step 4: Rollback if fix not immediate
npx wrangler rollback [previous-version] --env production --message "Health check failure"

# Step 5: Post-rollback validation
npm run test:wrangler
npm run test:production
```

### 2. Discord Integration Failures

**Triggers:**
- Discord commands not responding
- Invalid signature errors
- Discord API authentication failures

**Procedure:**
```bash
# Step 1: Test Discord API connectivity
curl -H "Authorization: Bot $DISCORD_TOKEN" \
  https://discord.com/api/v10/applications/@me

# Step 2: Check Discord-specific logs
npx wrangler tail --env production --search "Discord" --format json

# Step 3: Validate Discord secrets
npx wrangler secret list --env production | grep DISCORD

# Step 4: If secrets/config issue, rollback immediately
npx wrangler rollback [previous-version] --env production \
  --message "Discord integration failure"

# Step 5: Verify Discord functionality post-rollback
# Test /register command in Discord
```

### 3. Performance Degradation

**Triggers:**
- Response times > 5000ms consistently
- High error rates (>5%)
- Memory/CPU limit exceeded errors

**Procedure:**
```bash
# Step 1: Monitor performance metrics
npx wrangler tail --env production --format json | \
  jq 'select(.eventTimestamp) | .eventTimestamp, .outcome'

# Step 2: Check for resource issues
npx wrangler tail --env production --search "memory\|timeout\|limit"

# Step 3: Performance test current deployment
time curl https://your-worker.workers.dev

# Step 4: Compare with previous deployment performance
# If degradation >50%, initiate rollback
npx wrangler rollback [previous-version] --env production \
  --message "Performance degradation detected"

# Step 5: Performance validation post-rollback
npm run test:production
```

### 4. Security Incidents

**Triggers:**
- Unauthorized access attempts
- Rate limiting failures
- Invalid request patterns

**Procedure:**
```bash
# Step 1: Immediate security assessment
npx wrangler tail --env production --search "unauthorized\|violation\|attack"

# Step 2: Check security headers and validation
curl -I https://your-worker.workers.dev

# Step 3: If active security threat, immediate rollback
npx wrangler rollback [previous-version] --env production \
  --message "Security incident - immediate rollback"

# Step 4: Security validation post-rollback
npm run test:production  # Includes security header validation

# Step 5: Incident documentation
# Document in incident log with timestamp and details
```

## Rollback Decision Matrix

| Severity | Trigger | Response Time | Action |
|----------|---------|---------------|--------|
| **Critical** | Health check down, Discord completely broken | < 2 minutes | Immediate rollback |
| **High** | >50% performance degradation, security incident | < 5 minutes | Quick assessment → rollback |
| **Medium** | Intermittent errors, >5% error rate | < 15 minutes | Investigation → rollback if needed |
| **Low** | Minor issues, <2% error rate | < 1 hour | Monitor → rollback if escalates |

## Pre-Rollback Checklist

### ✅ Assessment Phase (30-60 seconds)
- [ ] Confirm issue severity and impact
- [ ] Check if issue affects all users or subset
- [ ] Verify issue is deployment-related (not external)
- [ ] Check if quick fix is obvious and safe

### ✅ Rollback Decision (30 seconds)
- [ ] Previous deployment version identified
- [ ] Rollback reason documented
- [ ] Stakeholders notified (if time permits)
- [ ] Rollback command prepared

### ✅ Execution Phase (1-2 minutes)
- [ ] Execute rollback command
- [ ] Monitor rollback completion
- [ ] Verify deployment status
- [ ] Run validation tests

### ✅ Post-Rollback Validation (2-5 minutes)
- [ ] Health check passes
- [ ] Discord integration working
- [ ] Performance restored
- [ ] Security headers present
- [ ] Logs show normal operation

## Post-Rollback Procedures

### 1. Immediate Validation (First 5 minutes)
```bash
# Comprehensive validation suite
echo "🔍 Post-rollback validation starting..."

# Health check
npm run test:wrangler
npm run test:production

# Discord integration test
echo "Testing Discord integration..."
# Test /register command in Discord client

# Performance baseline
echo "Performance check..."
time curl https://your-worker.workers.dev

echo "✅ Post-rollback validation completed"
```

### 2. Monitoring Phase (First 30 minutes)
```bash
# Monitor for stability
npx wrangler tail --env production --format json | \
  while read line; do
    echo "$line" | jq 'select(.outcome == "exception") | "ERROR: " + .logs[0].message[0]'
  done
```

### 3. Incident Documentation
```markdown
## Incident Report: [YYYY-MM-DD-HH-MM]

### Summary
- **Incident**: [Brief description]
- **Severity**: [Critical/High/Medium/Low]
- **Start Time**: [ISO timestamp]
- **Resolution Time**: [ISO timestamp]
- **Total Downtime**: [Duration]

### Timeline
- [Time]: Issue detected
- [Time]: Rollback initiated
- [Time]: Rollback completed
- [Time]: Validation passed

### Root Cause
[Description of what caused the issue]

### Resolution
- Rollback to version: [version-id]
- Reason: [rollback message]

### Post-Mortem Actions
- [ ] Fix identified issue
- [ ] Add monitoring for this scenario
- [ ] Update deployment procedures
- [ ] Test fix in staging
```

## Rollback Testing Procedures

### Monthly Rollback Drills
```bash
# Scheduled rollback test (staging environment)
# 1. Deploy test version
npx wrangler deploy --env staging

# 2. Practice rollback
npx wrangler rollback [previous-version] --env staging --message "Rollback drill"

# 3. Validate rollback works
npm run test:wrangler
npm run test:production https://staging-worker.workers.dev

# 4. Document drill results
```

### Rollback Automation Testing
```bash
# Test automated rollback scripts
chmod +x scripts/emergency-rollback.sh
./scripts/emergency-rollback.sh "Automated rollback test"
```

## Communication Procedures

### Internal Team Notification
```bash
# Slack notification template
curl -X POST -H 'Content-type: application/json' \
  --data '{
    "text": "🚨 PRODUCTION ROLLBACK INITIATED",
    "attachments": [
      {
        "color": "danger",
        "fields": [
          {"title": "Reason", "value": "'$ROLLBACK_REASON'", "short": true},
          {"title": "Version", "value": "'$PREVIOUS_VERSION'", "short": true},
          {"title": "Status", "value": "In Progress", "short": true}
        ]
      }
    ]
  }' \
  $SLACK_WEBHOOK_URL
```

### User Communication
```markdown
# Discord Server Announcement Template
🤖 **Bot Maintenance Notice**

We're currently resolving a technical issue with the Beluga bot. 
- The `/register` command may be temporarily unavailable
- We're working to restore full functionality quickly
- Expected resolution: [timeframe]

Thank you for your patience! 🙏
```

### External Status Page
```bash
# Update status page (if applicable)
curl -X POST "https://api.statuspage.io/v1/pages/PAGE_ID/incidents" \
  -H "Authorization: OAuth $STATUSPAGE_TOKEN" \
  -d '{
    "incident": {
      "name": "Discord Bot Service Disruption",
      "status": "investigating",
      "impact_override": "minor",
      "message": "We are investigating reports of Discord bot connectivity issues."
    }
  }'
```

## Prevention and Monitoring

### Pre-Deployment Validation
```bash
# Always run before production deployment
npm run quality-check
npm run test:coverage
npm run test:integration

# Staging deployment test
npx wrangler deploy --env staging
sleep 30
npm run test:production https://staging-worker.workers.dev
```

### Continuous Monitoring Setup
```bash
# Health check monitoring (every 5 minutes)
crontab -e
*/5 * * * * /path/to/scripts/health-monitor.sh

# Performance monitoring 
crontab -e
*/10 * * * * /path/to/scripts/performance-monitor.sh

# Error rate monitoring
crontab -e
*/1 * * * * /path/to/scripts/error-rate-monitor.sh
```

### Alert Thresholds
- **Critical**: Health check down, 100% error rate
- **High**: >50% error rate, >5000ms avg response time
- **Medium**: >10% error rate, >2000ms avg response time
- **Low**: >2% error rate, >1000ms avg response time

## Recovery Planning

### Rollback Scenarios Coverage
1. ✅ **Deployment failures** - Automated rollback in CI/CD
2. ✅ **Health check failures** - Immediate manual rollback
3. ✅ **Performance degradation** - Monitored rollback
4. ✅ **Security incidents** - Emergency rollback
5. ✅ **Discord integration** - Service-specific rollback
6. ✅ **Secret/config issues** - Configuration rollback

### Business Continuity
- **RTO (Recovery Time Objective)**: < 5 minutes
- **RPO (Recovery Point Objective)**: Previous deployment (0 data loss)
- **Availability Target**: 99.9% (8.76 hours downtime/year)

This comprehensive rollback procedure ensures rapid recovery from any production issues while maintaining service reliability and user experience.