# Production Deployment Runbook

This runbook provides step-by-step procedures for deploying the Beluga Discord Bot to production and managing its lifecycle.

## Quick Reference

| Task | Command | Time |
|------|---------|------|
| Deploy | `npm run deploy` | 2-3 min |
| Validate | `npm run test:wrangler && npm run test:production` | 1-2 min |
| Rollback | `./scripts/emergency-rollback.sh "reason"` | 1-2 min |
| Monitor | `npx wrangler tail --env production --format json` | Real-time |

## Pre-Deployment Checklist

### 🔧 Development Environment Setup
- [ ] **Code Review**: All changes reviewed and approved
- [ ] **Quality Gates**: All tests passing (`npm run quality-check`)
- [ ] **Coverage**: Test coverage ≥ 90% (`npm run test:coverage`)
- [ ] **Linting**: No linting errors (`npm run lint`)
- [ ] **Type Safety**: No TypeScript errors (`npm run typecheck`)

### 🔐 Authentication and Secrets
- [ ] **Cloudflare Auth**: `npx wrangler whoami` confirms authentication
- [ ] **API Token**: `CLOUDFLARE_API_TOKEN` configured in CI/CD
- [ ] **Discord Secrets**: All required secrets configured
  ```bash
  npx wrangler secret list --env production
  # Required: DISCORD_TOKEN, DISCORD_PUBLIC_KEY, DISCORD_APPLICATION_ID
  ```

### 🧪 Staging Validation
- [ ] **Staging Deploy**: Test deployment on staging environment
- [ ] **Integration Tests**: `npm run test:integration` passes
- [ ] **Manual Testing**: `/register` command tested in staging Discord

### 📋 Pre-Flight Verification
- [ ] **Current Status**: Production is healthy (`npm run test:wrangler`)
- [ ] **Rollback Plan**: Previous deployment identified for potential rollback
- [ ] **Monitoring Ready**: Alert channels configured and monitored
- [ ] **Team Notification**: Deployment communicated to team

## Deployment Procedure

### Step 1: Pre-Deployment Validation (5 minutes)
```bash
echo "🔍 Pre-deployment validation..."

# Verify authentication
npx wrangler whoami

# Check current production status
npx wrangler deployments status --env production
npm run test:wrangler

# Run comprehensive tests
npm run quality-check
npm run test:integration

# Document current state for rollback
CURRENT_VERSION=$(npx wrangler deployments status --env production | grep "Version ID" | cut -d: -f2 | tr -d ' ')
echo "Current production version: $CURRENT_VERSION"
```

### Step 2: Deploy to Production (2-3 minutes)
```bash
echo "🚀 Deploying to production..."

# Deploy via npm script (triggers wrangler deploy --env production)
npm run deploy

# Or deploy directly with wrangler
# npx wrangler deploy --env production

echo "✅ Deployment completed"
```

### Step 3: Post-Deployment Validation (3-5 minutes)
```bash
echo "🔍 Post-deployment validation..."

# Wait for deployment propagation
sleep 30

# Comprehensive validation
npm run test:wrangler
npm run test:production

# Verify new deployment
NEW_VERSION=$(npx wrangler deployments status --env production | grep "Version ID" | cut -d: -f2 | tr -d ' ')
echo "New production version: $NEW_VERSION"

# Check deployment history
npx wrangler deployments list --env production | head -5
```

### Step 4: Functional Validation (5-10 minutes)
```bash
echo "🧪 Functional validation..."

# Test Discord integration manually
# 1. Open Discord client
# 2. Navigate to test server
# 3. Run /register command with valid URL
# 4. Verify successful response
# 5. Check logs for proper logging

# Monitor logs for normal operation
npx wrangler tail --env production --format json | head -20

echo "✅ Functional validation completed"
```

### Step 5: Monitoring Setup (2 minutes)
```bash
echo "📊 Setting up monitoring..."

# Start log monitoring (in separate terminal)
npx wrangler tail --env production --format json &

# Set up performance monitoring
watch -n 300 'npm run test:production' &

echo "✅ Monitoring active"
```

## Automated Deployment (GitHub Actions)

### Trigger Deployment
```bash
# Push to main branch triggers automatic deployment
git checkout main
git pull origin main
git merge feature-branch
git push origin main
```

### Monitor GitHub Actions
1. Navigate to repository → Actions tab
2. Monitor deployment workflow progress
3. Check for validation failures
4. Review deployment logs

### GitHub Actions Workflow Steps
1. **Quality Gates**: Lint, test, typecheck
2. **Deploy**: `wrangler deploy --env production`
3. **Wrangler Validation**: Native Cloudflare monitoring
4. **HTTP Validation**: External endpoint testing
5. **Notification**: Success/failure alerts

## Monitoring and Alerting

### Real-time Monitoring Commands
```bash
# Live log streaming
npx wrangler tail --env production --format json

# Error monitoring
npx wrangler tail --env production --status error

# Performance monitoring
npx wrangler tail --env production --format json | jq '.eventTimestamp, .outcome'

# Discord-specific monitoring
npx wrangler tail --env production --search "register\|Discord"
```

### Health Check Monitoring
```bash
# Continuous health monitoring
while true; do
  if ! npm run test:production > /dev/null 2>&1; then
    echo "🚨 Health check failed at $(date)"
    # Trigger alert/rollback procedures
  fi
  sleep 300  # Check every 5 minutes
done
```

### Performance Baselines
- **Response Time**: < 1000ms (target), < 2000ms (acceptable)
- **Error Rate**: < 2% (target), < 5% (acceptable)
- **Availability**: > 99.9% (target)
- **Memory Usage**: < 128MB peak

### Alert Thresholds
| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Response Time | > 2000ms | > 5000ms | Investigate/Rollback |
| Error Rate | > 5% | > 25% | Immediate rollback |
| Health Check | 1 failure | 3 consecutive | Emergency rollback |
| Memory Usage | > 100MB | > 128MB | Monitor/Optimize |

## Incident Response

### Severity Levels
- **P0 (Critical)**: Service completely down, immediate rollback
- **P1 (High)**: Major functionality broken, rollback within 15 minutes  
- **P2 (Medium)**: Minor issues, investigate and fix within 1 hour
- **P3 (Low)**: Performance degradation, monitor and optimize

### Incident Response Procedures

#### P0: Critical Incident
```bash
# Immediate actions (< 2 minutes)
echo "🚨 P0 INCIDENT - INITIATING EMERGENCY ROLLBACK"

# Execute emergency rollback
./scripts/emergency-rollback.sh "P0 incident - service down"

# Verify rollback success
npm run test:wrangler
npm run test:production

# Notify team
echo "P0 incident - rollback completed" | slack-notify
```

#### P1: High Severity
```bash
# Quick assessment (< 5 minutes)
echo "⚠️ P1 INCIDENT - ASSESSING SITUATION"

# Check specific issue
npx wrangler tail --env production --status error | head -10

# If not quickly fixable, rollback
if [ "$FIX_AVAILABLE" != "yes" ]; then
  ./scripts/emergency-rollback.sh "P1 incident - major functionality broken"
fi
```

#### P2/P3: Lower Severity
```bash
# Investigation phase (< 30 minutes)
echo "📋 P2/P3 INCIDENT - INVESTIGATING"

# Analyze logs and metrics
npx wrangler tail --env production --format json | analyze-logs.sh

# Monitor for escalation
# Fix in next deployment cycle if not critical
```

## Rollback Procedures

### When to Rollback
- Health checks failing consistently
- Error rate > 25%
- Critical functionality broken
- Security vulnerability detected
- Performance degradation > 50%

### Emergency Rollback
```bash
# Automated emergency rollback
./scripts/emergency-rollback.sh "Brief reason for rollback"

# Manual rollback steps
npx wrangler deployments list --env production
npx wrangler rollback [previous-version-id] --env production --message "Rollback reason"
```

### Post-Rollback Actions
1. **Validate Rollback**: Confirm service restoration
2. **Monitor Stability**: Watch for 30 minutes minimum
3. **Document Incident**: Record timeline and root cause
4. **Plan Fix**: Address underlying issue
5. **Test Fix**: Thoroughly test before re-deployment

## Maintenance Procedures

### Weekly Maintenance
- [ ] Review deployment history and performance trends
- [ ] Check for security updates in dependencies
- [ ] Validate backup and rollback procedures
- [ ] Review monitoring and alerting effectiveness

### Monthly Maintenance
- [ ] Conduct rollback drill on staging
- [ ] Review and update documentation
- [ ] Analyze incident reports and improve procedures
- [ ] Performance optimization review

### Quarterly Maintenance
- [ ] Security audit and penetration testing
- [ ] Disaster recovery testing
- [ ] Documentation comprehensive review
- [ ] Team training on procedures

## Troubleshooting Guide

### Common Issues and Solutions

#### Deployment Fails
```bash
# Check authentication
npx wrangler whoami

# Verify wrangler.toml configuration
cat wrangler.toml

# Check for syntax errors
npm run typecheck
npm run lint
```

#### Health Checks Fail
```bash
# Check secrets configuration
npx wrangler secret list --env production

# Test individual components
curl -v https://your-worker.workers.dev

# Check logs for errors
npx wrangler tail --env production --status error
```

#### Discord Integration Issues
```bash
# Verify Discord API connectivity
curl -H "Authorization: Bot $DISCORD_TOKEN" \
  https://discord.com/api/v10/applications/@me

# Check Discord-specific logs
npx wrangler tail --env production --search "Discord"

# Validate Discord secrets format
echo $DISCORD_PUBLIC_KEY | wc -c  # Should be 64 characters
```

#### Performance Issues
```bash
# Monitor resource usage
npx wrangler tail --env production --format json | \
  jq 'select(.eventTimestamp) | .eventTimestamp, .outcome'

# Check for memory/timeout issues
npx wrangler tail --env production --search "memory\|timeout"

# Performance testing
time curl https://your-worker.workers.dev
```

## Security Considerations

### Deployment Security
- ✅ All secrets stored securely in Wrangler
- ✅ No secrets in code or configuration files
- ✅ API tokens with minimal required permissions
- ✅ Audit trail for all deployments

### Runtime Security
- ✅ Input validation on all endpoints
- ✅ Rate limiting implemented
- ✅ Security headers configured
- ✅ Error messages don't expose internals

### Monitoring Security
- ✅ Log sensitive data filtering
- ✅ Access controls on monitoring tools
- ✅ Alert on suspicious activity patterns
- ✅ Regular security vulnerability scans

## Communication Procedures

### Team Notifications
```bash
# Deployment announcement
echo "🚀 Production deployment starting - $(date)" | team-notify

# Completion notification
echo "✅ Production deployment completed successfully - $(date)" | team-notify

# Issue notification
echo "⚠️ Production issue detected - investigating - $(date)" | team-notify
```

### User Communications
- **Planned Maintenance**: 24-48 hours advance notice
- **Emergency Maintenance**: Immediate notification
- **Service Restoration**: Confirmation when resolved

### External Notifications
- Status page updates (if applicable)
- Social media announcements (if major)
- Customer support team briefing

This runbook ensures reliable, secure, and monitored production deployments with clear procedures for incident response and maintenance.