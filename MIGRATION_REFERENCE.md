# Migration Quick Reference

## What Changed?

### Before (Client-Side)
```typescript
// vite.config.ts
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}

// AIClient.ts
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const result = await ai.models.generateContent(...);
```

### After (Server-Side)
```typescript
// vite.config.ts
// No API key injection!

// AIClient.ts
const response = await fetch('/api/story', {
  method: 'POST',
  body: JSON.stringify(input)
});
const data = await response.json();
```

## File Changes

### New Files
- `api/_utils.ts` - Shared utilities for API routes
- `api/health.ts` - Health check endpoint
- `api/story.ts` - Story generation endpoint
- `api/image.ts` - Image generation endpoint
- `api/tts.ts` - Text-to-speech endpoint
- `useBackendHealth.ts` - Health check hook
- `BackendHealthError.tsx` - Error UI component
- `.env.example` - Environment template
- `DEPLOY_CHECKLIST.md` - Security checklist
- `API_SETUP.md` - Setup guide
- `smoke-test.js` - API testing script

### Modified Files
- `vite.config.ts` - Removed API key injection
- `AIClient.ts` - Calls `/api/*` endpoints via fetch
- `NarrationManager.ts` - Calls `/api/tts` endpoint
- `App.tsx` - Uses health check instead of API key dialog
- `hooks/useStoryEngine.ts` - Uses health check
- `GEMINI_INTEGRATION.md` - Updated with server-side info
- `vercel.json` - Updated CSP headers
- `package.json` - Added @vercel/node dependency
- `.gitignore` - Exclude env and backup files

### Removed Files
- `useApiKey.ts` - Replaced by useBackendHealth.ts
- `ApiKeyDialog.tsx` - Replaced by BackendHealthError.tsx

## Environment Variables

### Required
```env
GEMINI_API_KEY=your_key_here
```

### Optional
```env
ALLOWED_ORIGIN=*
APP_ENV=development
RATE_LIMIT_PER_MIN=30
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | POST | Health check |
| `/api/story` | POST | Story generation |
| `/api/image` | POST | Avatar/scene images |
| `/api/tts` | POST | Text-to-speech |

## Development Workflow

1. **Setup**: Copy `.env.example` to `.env` and add API key
2. **Develop**: Run `npm run dev`
3. **Test**: Run `npm run test:smoke` (requires dev server)
4. **Build**: Run `npm run build`
5. **Verify**: Check for secrets with grep commands
6. **Deploy**: Push to Vercel, configure env vars

## Security Checklist

- [ ] API key set in Vercel (not in code)
- [ ] Build artifacts contain no secrets
- [ ] CSP headers updated
- [ ] Rate limiting configured
- [ ] CORS configured for production domain
- [ ] Health check returns 200 OK
- [ ] Browser network tab shows only `/api/*` calls

## Testing Commands

```bash
# Build and verify
npm run build
grep -r "AIza\|process.env.API_KEY" dist/ || echo "✓ Clean"

# Smoke test (local)
npm run test:smoke

# Smoke test (production)
node smoke-test.js https://your-app.vercel.app
```

## Rollback Plan

If issues arise:
1. Revert to previous commit: `git revert HEAD`
2. Redeploy: `git push origin main`
3. Verify old behavior restored
4. Investigate issues before re-attempting

## Support

- **Logs**: Check Vercel function logs
- **API Usage**: https://console.cloud.google.com/apis/dashboard
- **Docs**: See API_SETUP.md and DEPLOY_CHECKLIST.md
- **Issues**: Check GitHub issues or create new one
