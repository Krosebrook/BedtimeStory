# Deployment Verification Test Suite

Comprehensive automated testing for deployment readiness, security validation, and functional verification of the Bedtime Story application.

## Quick Start

```bash
# Install dependencies
npm install

# Build the application (required for security scans)
npm run build

# Run full deployment verification
npm run test:deploy

# Or run specific test suites
npm run test:security      # Security scans only (no server needed)
npm run test:functional    # API tests only (requires server)
npm run test:deploy:fast   # Skip slow rate-limiting tests
```

## Test Suites

### 1. Security Scanner

**Command:** `npm run test:security`  
**Duration:** ~2-5 seconds  
**Requirements:** None (doesn't require running server)

**What it checks:**
- ✅ **Build Artifacts**: Scans `dist/` directory for leaked secrets
  - API key patterns (`AIza...`)
  - Environment variable references (`process.env.API_KEY`)
  - Direct API calls (`generativelanguage.googleapis.com`)
- ✅ **Source Code**: Validates secure coding practices
  - API routes use `requireEnv()` for secrets
  - `vite.config.ts` doesn't inject secrets via `define`
  - No hardcoded API keys in source files
- ✅ **Environment Variables**: Validates `.env.example` exists

**Example output:**
```
============================================================
🔍 Build Artifact Security Scan
============================================================

✅ Build directory exists Found dist/
✅ No API keys in build Clean
✅ No process.env references Clean
✅ No direct Gemini API calls Clean
```

### 2. Functional API Tests

**Command:** `npm run test:functional`  
**Duration:** ~10-15 seconds (depends on API latency)  
**Requirements:** Server running (`npm run dev`) OR deployed URL

**What it checks:**
- ✅ **Health Check**: `/api/health` returns 200 OK
- ✅ **Story Generation**: `/api/story` returns valid story structure
- ✅ **Image Generation**: `/api/image` returns base64 image data
- ✅ **TTS Generation**: `/api/tts` returns PCM audio at 24kHz
- ✅ **CORS Headers**: All endpoints return proper CORS headers

**Testing against deployed URL:**
```bash
npm run test:functional -- --url=https://your-app.vercel.app
```

**Example output:**
```
============================================================
🧪 Functional API Tests (http://localhost:3000)
============================================================

✅ Health check endpoint Status: ok
✅ Story generation endpoint Generated 12 story parts
✅ Image generation endpoint Generated image/png
✅ TTS generation endpoint Generated PCM audio at 24000Hz
```

### 3. Rate Limiting Verification

**Command:** `npm run test:deploy` (included by default)  
**Duration:** ~30-60 seconds  
**Requirements:** Server running

**What it checks:**
- ✅ Rate limiting triggers after threshold (default 30 req/min)
- ✅ API returns 429 status when limit exceeded
- ✅ Limit configuration is reasonable

**Skip this test:**
```bash
npm run test:deploy:fast
# or
npm run test:deploy -- --skip-rate-limit
```

**Example output:**
```
============================================================
🚦 Rate Limiting Verification
============================================================

⚠️  This test will make 35 requests to verify rate limiting
⚠️  Test may take 30+ seconds to complete

✅ Rate limiting triggers correctly 30 succeeded, 5 rate-limited
✅ Rate limit threshold reasonable Limit configured at 30/min
```

### 4. Full Deployment Verification

**Command:** `npm run test:deploy`  
**Duration:** ~45-75 seconds  
**Requirements:** Built application + server running

Runs all test suites in sequence:
1. Environment variable validation
2. Build artifact security scan
3. Source code security scan
4. Functional API tests
5. CORS header verification
6. Rate limiting tests

## Test Options

All tests support command-line options:

```bash
# Test against specific URL
npm run test:deploy -- --url=https://your-app.vercel.app

# Run only security checks
npm run test:deploy -- --security-only

# Run only functional checks
npm run test:deploy -- --functional-only

# Skip slow rate-limiting tests
npm run test:deploy -- --skip-rate-limit
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deployment Verification

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Run security scans
        run: npm run test:security
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
      
      # Optional: Add functional tests if you have a test deployment
      # - name: Run functional tests
      #   run: npm run test:functional -- --url=${{ secrets.TEST_URL }}
```

### Pre-Deploy Hook

Add to your deployment workflow:

```bash
#!/bin/bash
set -e

echo "Building application..."
npm run build

echo "Running security scans..."
npm run test:security

echo "Deploying to production..."
vercel --prod
```

## Interpreting Results

### Exit Codes
- **0**: All tests passed (may have warnings)
- **1**: One or more tests failed (deployment should be blocked)

### Test Status Indicators
- ✅ **Passed**: Test succeeded
- ❌ **Failed**: Test failed (fix required)
- ⚠️  **Warning**: Advisory notice (review before deploying)

### Common Warnings

**"GEMINI_API_KEY not set"**
- Expected in local development without `.env` file
- Must be set in Vercel environment variables for production

**"ALLOWED_ORIGIN not set (using default)"**
- Defaults to `*` (allow all origins)
- Should be restricted to your domain in production

**"APP_ENV not set"**
- Defaults to development mode
- Should be set to `production` in production environment

## Troubleshooting

### "Build directory not found"
```
❌ Build directory exists dist/ not found. Run 'npm run build' first.
```
**Solution:** Run `npm run build` before running tests

### "Error: ECONNREFUSED"
```
❌ Health check endpoint Error: fetch failed
```
**Solution:** Start dev server with `npm run dev` or provide deployed URL with `--url`

### "Rate limiting not triggering"
```
❌ Rate limiting triggers correctly 35 succeeded, 0 rate-limited
```
**Solution:** Check `RATE_LIMIT_PER_MIN` environment variable is set correctly

### Tests timeout
**Solution:** 
- Check network connectivity
- Verify API keys are valid
- Check Gemini API quota/rate limits

## Adding New Tests

### Test Structure

```javascript
import { TestTracker, formatSection } from './test-helpers.js';

export async function myTestSuite() {
  const tracker = new TestTracker();
  formatSection('🔍 My Test Suite');

  // Record test results
  tracker.recordTest(
    'Test name',
    condition === true,  // Pass/fail condition
    'Details or error message'
  );

  // Record warnings (don't count as failures)
  tracker.recordWarning('Advisory message');

  return tracker;
}
```

### Integration

Add to `tests/deploy-verification.js`:

```javascript
import { myTestSuite } from './my-test-suite.js';

// In main() function:
const myTracker = await myTestSuite();
allTrackers.push(myTracker);
```

## Best Practices

### Pre-Deployment Workflow

1. **Develop**: Make code changes
2. **Build**: `npm run build`
3. **Test**: `npm run test:security` (fast feedback)
4. **Verify**: `npm run test:deploy` (comprehensive check)
5. **Deploy**: Push to production if all tests pass

### Continuous Verification

```bash
# Run security checks on every build
npm run build && npm run test:security

# Run full verification before git push
git add . && npm run test:deploy && git push
```

### Production Deployment

```bash
# Before deploying
npm run build
npm run test:security

# Deploy
vercel --prod

# Verify deployed version
npm run test:functional -- --url=https://your-app.vercel.app
```

## References

- [DEPLOY_CHECKLIST.md](../DEPLOY_CHECKLIST.md) - Manual deployment checklist
- [API_SETUP.md](../API_SETUP.md) - API configuration guide
- [GEMINI_INTEGRATION.md](../GEMINI_INTEGRATION.md) - Gemini API details

## Support

If tests fail unexpectedly:
1. Check Vercel function logs
2. Verify environment variables are set
3. Review recent code changes
4. Check Gemini API status and quotas
5. Open GitHub issue with test output
