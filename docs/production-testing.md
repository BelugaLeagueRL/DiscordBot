# Production Testing Guide

This guide outlines how to validate production deployments with real secrets and environments.

## Testing Levels

### 1. Unit Tests (Automated)
- **What**: Individual function testing with mocks
- **When**: Every commit, pre-commit hooks
- **Coverage**: Business logic, error handling, edge cases
- **Limitations**: No real secrets, no real runtime environment

### 2. Integration Tests (Automated)  
- **What**: Component interaction testing with real secrets (if available)
- **When**: CI/CD pipeline
- **Coverage**: Secret validation, health checks with real environment variables
- **Location**: `src/__tests__/integration/production-validation.test.ts`

### 3. Production Validation (Automated)
- **What**: Live deployment testing with comprehensive checks
- **When**: After successful deployment
- **Coverage**: Real Worker environment, real secrets, real network calls
- **Script**: `scripts/test-production-deployment.js`

### 4. Manual Production Testing (Manual)
- **What**: End-to-end Discord integration testing
- **When**: Before major releases, after infrastructure changes
- **Coverage**: Real Discord interactions, user workflows

## Automated Production Validation

The production validation script (`scripts/test-production-deployment.js`) performs:

### Health Check Validation
```bash
# Tests GET / endpoint
✅ Returns 200 status
✅ Returns JSON with status: "healthy"
✅ Includes timestamp and checks
✅ Real secret validation status
```

### Security Header Validation
```bash
# Tests security headers presence
✅ X-Content-Type-Options: nosniff
✅ X-Frame-Options: DENY
✅ X-XSS-Protection: 1; mode=block
✅ Referrer-Policy: strict-origin-when-cross-origin
✅ Content-Security-Policy: [policy]
✅ Strict-Transport-Security: [settings]
```

### CORS Configuration Validation
```bash
# Tests OPTIONS preflight requests
✅ Returns 200 status
✅ Includes Access-Control-Allow-Origin
✅ Includes Access-Control-Allow-Methods
✅ Includes Access-Control-Allow-Headers
```

### Performance Validation
```bash
# Tests response times
✅ Response time < 1000ms (good)
⚠️  Response time 1000-5000ms (moderate)
❌ Response time > 5000ms (poor)
```

### Discord Integration Testing
```bash
# Tests Discord signature verification
✅ Rejects invalid signatures (security working)
✅ Processes valid Discord PING interactions
⚠️  Skipped if no DISCORD_PUBLIC_KEY provided
```

## Running Production Validation

### Automated (GitHub Actions)
Production validation runs automatically after successful deployment:

```yaml
- name: Production Validation
  run: node scripts/test-production-deployment.js
  env:
    DISCORD_TOKEN: ${{ secrets.DISCORD_TOKEN }}
    DISCORD_PUBLIC_KEY: ${{ secrets.DISCORD_PUBLIC_KEY }}
    DISCORD_APPLICATION_ID: ${{ secrets.DISCORD_APPLICATION_ID }}
```

### Manual Testing

#### 1. Set up Environment Variables
```bash
# Required for real secret validation
export DISCORD_TOKEN="your_real_discord_token"
export DISCORD_PUBLIC_KEY="your_real_discord_public_key"  
export DISCORD_APPLICATION_ID="your_real_discord_app_id"
```

#### 2. Run Integration Tests
```bash
# Test with real secrets
npm run test src/__tests__/integration/production-validation.test.ts
```

#### 3. Run Production Validation Script
```bash
# Test deployed Worker
node scripts/test-production-deployment.js https://your-worker.workers.dev

# Output example:
🔍 Testing health check endpoint...
✅ Health check passed
🔍 Testing CORS headers...
✅ CORS configuration valid
🔍 Testing security headers...
✅ Security headers present
🔍 Testing Discord PING interaction...
⚠️  Discord signature verification failed (expected with test signature)
🔍 Testing performance and response times...
✅ Good response time: 234ms

📊 Production Validation Results:
✅ healthCheck: PASSED
✅ cors: PASSED  
✅ security: PASSED
✅ discord: PASSED
✅ performance: PASSED

📈 Summary: 5/5 tests passed
🎉 Production deployment validation PASSED!
```

## Manual Discord Integration Testing

For complete end-to-end testing, test real Discord interactions:

### 1. Register Discord Commands
```bash
# Register commands with real Discord API
npm run register
```

### 2. Test in Discord Client
1. Open Discord and navigate to a server where the bot is installed
2. Type `/register` in a channel
3. Provide a valid Rocket League tracker URL
4. Verify the bot responds correctly
5. Check Cloudflare Workers Logs for proper logging

### 3. Test Error Scenarios
1. Use `/register` with invalid URL
2. Verify proper error handling and user feedback
3. Check logs for proper error logging

### 4. Test Performance
1. Run multiple `/register` commands rapidly
2. Verify no rate limiting issues
3. Check response times in Discord
4. Monitor Cloudflare Workers metrics

## Production Secret Management

### Required Secrets in Production
```bash
# Cloudflare Workers (wrangler secret put)
DISCORD_TOKEN="Bot [token]"
DISCORD_PUBLIC_KEY="[64-char-hex-string]"
DISCORD_APPLICATION_ID="[17-19-digit-string]"
DATABASE_URL="[database-connection-string]"
GOOGLE_SHEETS_API_KEY="[api-key]" # Optional
ENVIRONMENT="production"
```

### GitHub Actions Secrets
```bash
# Repository secrets (Settings → Secrets and variables → Actions)
CLOUDFLARE_API_TOKEN="[cloudflare-api-token]"
CLOUDFLARE_ACCOUNT_ID="[cloudflare-account-id]"
DISCORD_TOKEN="[same-as-worker]"
DISCORD_PUBLIC_KEY="[same-as-worker]"
DISCORD_APPLICATION_ID="[same-as-worker]"
```

### Validating Secrets Format
The integration tests validate secret formats:

```typescript
// Discord public key: 64-character hex string
expect(publicKey).toMatch(/^[0-9a-fA-F]{64}$/);

// Discord application ID: 17-19 digit string  
expect(appId).toMatch(/^\d{17,19}$/);

// Discord token: JWT-like format
expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
```

## Monitoring Production Health

### Cloudflare Workers Dashboard
1. **Metrics**: Response times, error rates, request volume
2. **Logs**: Structured JSON logs with request tracing
3. **Analytics**: Geographic distribution, performance metrics

### Real-Time Health Monitoring
```bash
# Continuous health monitoring
while true; do
  curl -s https://your-worker.workers.dev | jq '.status'
  sleep 60
done
```

### Alerting Setup
Set up monitoring alerts for:
- Health check failures
- High error rates (>5%)
- Slow response times (>1000ms)
- Worker execution errors
- High memory usage

## Troubleshooting Production Issues

### Health Check Failures
```bash
# Check secret configuration
wrangler secret list

# Check deployment status  
wrangler deployments list

# Check logs
wrangler tail
```

### Discord Integration Issues
```bash
# Test Discord API connectivity
curl -H "Authorization: Bot $DISCORD_TOKEN" \
  https://discord.com/api/v10/applications/@me

# Verify application ID matches
echo $DISCORD_APPLICATION_ID
```

### Performance Issues
```bash
# Check Worker resource usage
wrangler metrics

# Monitor response times
node scripts/test-production-deployment.js
```

## Security Considerations

### Production Testing Security
1. **Never log real secrets** in test output
2. **Use test Discord servers** for integration testing
3. **Rotate secrets** if compromised during testing
4. **Monitor for unusual activity** after testing

### Test Data Security
1. **Use fake/test data** for user scenarios
2. **Don't test with real user Discord IDs**
3. **Clean up test data** after testing
4. **Use dedicated test Discord application** when possible