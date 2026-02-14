# Deployment Security Checklist

This checklist ensures that the Gemini API integration is properly secured and no sensitive information is exposed to the client.

## 🤖 Automated Verification

Many of these checks are now automated through the deployment verification test suite:

```bash
# Run all automated checks
npm run test:deploy

# Security scans only (no server required)
npm run test:security

# Functional tests only (requires running server)
npm run test:functional
```

The automated tests cover:
- ✅ Environment variable validation
- ✅ Build artifact security scanning  
- ✅ Source code security audit
- ✅ API endpoint functional testing
- ✅ CORS header verification
- ✅ Rate limiting validation

**Run `npm run test:deploy` before every deployment to ensure all checks pass.**

---

## Pre-Deployment Verification

### 1. Environment Variables
**✨ Automated:** Run `npm run test:security` to verify
- [ ] `GEMINI_API_KEY` is set in Vercel project settings (not in code)
- [ ] `ALLOWED_ORIGIN` is configured (if restricting CORS)
- [ ] `APP_ENV` is set appropriately (production/staging/development)
- [ ] `RATE_LIMIT_PER_MIN` is configured (default 30 is acceptable for MVP)
- [ ] `.env.example` is committed but `.env` is in `.gitignore`

### 2. Source Code Security Audit
**✨ Automated:** Run `npm run test:security` to verify
- [ ] No hardcoded API keys in any source files
- [ ] `vite.config.ts` does NOT inject any secrets via `define`
- [ ] All Gemini API calls are made from `/api` directory only
- [ ] Client-side code (`AIClient.ts`, `NarrationManager.ts`) uses `fetch('/api/*')`

### 3. Build Artifact Inspection
**✨ Automated:** Run `npm run test:security` after `npm run build`

The automated tests check for:
- No API keys (pattern: `AIza...`) in `dist/` files
- No `process.env` references in built code
- No direct `generativelanguage.googleapis.com` URLs

Manual verification (if needed):
```bash
# Search for API key substring in built files
grep -r "AIza" dist/ || echo "✓ No API keys found"

# Verify no process.env.API_KEY references
grep -r "process.env.API_KEY" dist/ || echo "✓ No env references found"

# Check that API calls go to /api routes
grep -r "generativelanguage.googleapis.com" dist/ && echo "✗ Direct API calls found!" || echo "✓ No direct API calls"
```

### 4. Network Traffic Verification
**✨ Automated:** Run `npm run test:functional` to verify CORS headers

Manual verification in browser DevTools Network tab:
- [ ] All AI-related requests go to `/api/story`, `/api/image`, `/api/tts`
- [ ] NO requests to `generativelanguage.googleapis.com` from browser
- [ ] All `/api/*` requests receive proper CORS headers
- [ ] 429 responses are handled gracefully (rate limiting works)

### 5. Functional Testing
**✨ Automated:** Run `npm run test:functional` to verify

The automated tests validate:
- [ ] Story generation works (POST `/api/story`)
- [ ] Avatar generation works (POST `/api/image` with kind: 'avatar')
- [ ] Scene generation works (POST `/api/image` with kind: 'scene')
- [ ] Text-to-speech narration works (POST `/api/tts`)
- [ ] Health check returns 200 OK (POST `/api/health`)

Manual verification still needed for:
- [ ] Offline mode still works with cached stories
- [ ] Error messages are user-friendly (no stack traces exposed)

### 6. Rate Limiting Verification
**✨ Automated:** Run `npm run test:deploy` (note: this test is slow)

Test rate limiting:
```bash
# Send 35 rapid requests (should get 429 after 30)
for i in {1..35}; do
  curl -X POST https://your-domain.vercel.app/api/health &
done
```
- [ ] After ~30 requests, responses return 429 Too Many Requests
- [ ] Rate limit resets after 60 seconds

### 7. Error Handling
Test error scenarios:
- [ ] Missing API key (unset `GEMINI_API_KEY`) shows backend health error
- [ ] Invalid API key returns user-friendly error
- [ ] Network failures are caught and displayed properly
- [ ] Malformed requests return 400 Bad Request

## Post-Deployment Monitoring

### Week 1 Checklist
- [ ] Monitor Vercel function logs for errors
- [ ] Check rate limiting effectiveness (false positives?)
- [ ] Verify no 401/403 errors (API key issues)
- [ ] Monitor function execution time (cold starts OK?)
- [ ] Review user error reports (UX issues?)

### Security Incidents Response
If an API key is compromised:
1. Immediately rotate the key in Google Cloud Console
2. Update `GEMINI_API_KEY` in Vercel project settings
3. Redeploy the application
4. Monitor usage for suspicious activity
5. Review how the key was exposed and update this checklist

## Maintenance

### Monthly
- [ ] Review API usage and costs
- [ ] Check for Gemini API updates or deprecations
- [ ] Verify rate limiting is still appropriate for traffic
- [ ] Test backup/disaster recovery procedures

### Quarterly
- [ ] Audit all API endpoints for security
- [ ] Review and update error messages
- [ ] Test with latest `@google/genai` SDK version
- [ ] Performance optimization review

---

## Acceptance Criteria Verification

Before marking deployment as complete:
- ✅ No Gemini API key appears in built client assets
- ✅ AI features still work (story, images, narration)
- ✅ Deployed browser network requests target /api/* only
- ✅ Vercel build succeeds with Vite preset
- ✅ Offline mode continues to work with cached content
- ✅ Health check prevents user confusion when backend misconfigured
- ✅ Rate limiting protects against abuse
- ✅ CORS properly configured
- ✅ All existing tests pass (if any)
