# Changelog

All notable changes to the Infinity Heroes: Bedtime Chronicles project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Automated Deployment Verification Test Suite** - Comprehensive testing infrastructure for deployment readiness
  - `npm run test:deploy` - Full deployment verification covering security, functionality, and performance
  - `npm run test:security` - Fast security-only scans (build artifacts, source code, env vars)
  - `npm run test:functional` - API endpoint validation (health, story, image, TTS)
  - `npm run test:deploy:fast` - Quick verification skipping slow rate-limit tests
- Security scanners that detect:
  - API key leaks in build artifacts (`dist/` directory)
  - Environment variable exposure in client code
  - Direct Gemini API calls bypassing serverless functions
  - Hardcoded secrets in source code
  - Improper use of `requireEnv()` in API routes
- Functional tests validating:
  - All API endpoints return correct responses
  - CORS headers are properly configured
  - Rate limiting triggers at configured threshold
  - Error responses are secure (no stack trace exposure)
- Comprehensive test documentation in `tests/README.md`
- CI/CD integration examples for GitHub Actions
- Test result tracking with color-coded output and exit codes

### Changed
- Updated `README.md` with testing and deployment verification section
- Updated `DEPLOY_CHECKLIST.md` to reference automated tests for each manual step
- Enhanced `package.json` with four new test scripts

### Security
- Automated detection of API key patterns (`AIza...`) in all build artifacts
- Validation that `vite.config.ts` doesn't inject secrets via `define` option
- Verification that all API routes use `requireEnv()` for environment variables

## [1.0.0] - 2026-02-13

### Added
- Server-side Gemini API integration via Vercel serverless functions
- Secure API key management (keys never exposed to client)
- Rate limiting (30 requests/min per IP by default)
- CORS configuration with environment variable control
- Health check endpoint (`/api/health`)
- Comprehensive API documentation

### Changed
- Refactored `AIClient.ts` to use `/api/*` endpoints instead of direct SDK calls
- Updated `NarrationManager.ts` to call `/api/tts` for audio generation
- Replaced API key dialog with backend health check system

### Removed
- Client-side API key injection from `vite.config.ts`
- Direct browser connections to `generativelanguage.googleapis.com`
- `useApiKey.ts` hook (replaced with `useBackendHealth.ts`)
- `ApiKeyDialog.tsx` component (replaced with `BackendHealthError.tsx`)

### Security
- Eliminated API key exposure in client-side code
- Added Content Security Policy (CSP) headers via `vercel.json`
- Implemented per-IP rate limiting to prevent abuse
- Environment variable validation in all API routes

---

## Initial Release - 2026-01-16

### Added
- Interactive AI-driven bedtime story application for children aged 7-9
- Three creative modes: Classic Adventure, Mad Libs, Sleep Mode
- Voice selector with 7 AI narrator personalities
- Procedural ambient soundscapes (Rain, Forest, Cosmic Hum)
- Offline-first architecture with IndexedDB persistence
- Memory Jar for saving and sharing stories
- Service Worker for PWA capabilities
- Child-safe UI with high-contrast comic aesthetic

[Unreleased]: https://github.com/Krosebrook/BedtimeStory/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Krosebrook/BedtimeStory/releases/tag/v1.0.0
