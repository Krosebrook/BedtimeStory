# Server-Side API Setup Guide

This guide explains how to set up and deploy the Bedtime Story app with server-side Gemini API integration.

## Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:
```env
GEMINI_API_KEY=your_api_key_here
APP_ENV=development
RATE_LIMIT_PER_MIN=30
```

### 3. Run Development Server
```bash
npm run dev
```

The app will start at `http://localhost:3000`. The `/api` endpoints will be served by Vite's dev server.

## Vercel Deployment

### 1. Connect Repository
- Go to [Vercel Dashboard](https://vercel.com/dashboard)
- Click "Import Project"
- Select your GitHub repository

### 2. Configure Environment Variables
In Vercel project settings, add:
- `GEMINI_API_KEY`: Your Google AI API key (from https://aistudio.google.com/apikey)
- `ALLOWED_ORIGIN`: Your domain (e.g., `https://your-app.vercel.app`) or `*` for testing
- `APP_ENV`: `production`
- `RATE_LIMIT_PER_MIN`: `30` (or adjust as needed)

### 3. Deploy
```bash
git push origin main
```

Vercel will automatically build and deploy. The `/api` directory will be deployed as serverless functions.

## Testing

### Smoke Test (Local)
```bash
# Start dev server first
npm run dev

# In another terminal
node smoke-test.js http://localhost:3000
```

### Smoke Test (Production)
```bash
node smoke-test.js https://your-app.vercel.app
```

### Security Verification
After building:
```bash
npm run build

# Check for API keys in build
grep -r "AIza\|process.env.API_KEY" dist/ || echo "✓ Clean"

# Check for direct API calls
grep -r "generativelanguage.googleapis.com" dist/ && echo "✗ Found!" || echo "✓ Clean"
```

## API Endpoints

All endpoints support CORS and rate limiting.

### POST `/api/health`
Check backend health and configuration.

**Response:**
```json
{
  "status": "ok",
  "environment": "production"
}
```

### POST `/api/story`
Generate a story based on input parameters.

**Request:**
```json
{
  "mode": "classic",
  "heroName": "Hero",
  "heroPower": "Super Speed",
  "storyLength": "medium",
  "madlibs": {},
  "sleepConfig": {}
}
```

**Response:** StoryFull object with parts, vocab word, joke, etc.

### POST `/api/image`
Generate avatar or scene illustration.

**Request (Avatar):**
```json
{
  "kind": "avatar",
  "heroName": "Hero",
  "heroPower": "Super Speed"
}
```

**Request (Scene):**
```json
{
  "kind": "scene",
  "context": "A hero standing on a mountain...",
  "heroDescription": "Hero with Super Speed"
}
```

**Response:**
```json
{
  "mimeType": "image/png",
  "base64": "iVBORw0KG..."
}
```

### POST `/api/tts`
Generate text-to-speech audio.

**Request:**
```json
{
  "text": "Once upon a time...",
  "voiceName": "Kore"
}
```

**Response:**
```json
{
  "base64": "...",
  "sampleRate": 24000,
  "channels": 1,
  "mimeType": "audio/pcm"
}
```

## Troubleshooting

### "Story engine is currently unavailable"
- Check that `GEMINI_API_KEY` is set in Vercel environment variables
- Verify the API key is valid at https://aistudio.google.com/apikey
- Check Vercel function logs for errors

### Rate Limiting Issues
- Adjust `RATE_LIMIT_PER_MIN` environment variable
- For testing, set to a higher value like `100`
- For production, tune based on traffic patterns

### CORS Errors
- Set `ALLOWED_ORIGIN` to your domain
- For multiple domains, you'll need to modify `api/_utils.ts` to check an array
- For development, `*` is acceptable

### Build Errors
- Ensure all dependencies are installed: `npm install`
- Check that TypeScript types are compatible
- Verify Node.js version (v18+ recommended)

## Security Best Practices

1. **Never commit `.env` files** - use `.env.example` as template
2. **Rotate API keys quarterly** - update in Vercel settings
3. **Monitor function logs** - check for suspicious activity
4. **Set CORS appropriately** - restrict to your domain in production
5. **Review rate limits** - adjust based on legitimate usage patterns

## Monitoring

Monitor your Gemini API usage at:
- https://console.cloud.google.com/apis/dashboard
- Check for unexpected spikes in requests
- Review error rates and types
- Set up billing alerts

## Resources

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Deploy Checklist](./DEPLOY_CHECKLIST.md)
- [Gemini Integration Details](./GEMINI_INTEGRATION.md)
