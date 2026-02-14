#!/usr/bin/env node
/**
 * Deployment Verification Test Suite
 * Automates all checks from DEPLOY_CHECKLIST.md
 * 
 * Usage:
 *   node tests/deploy-verification.js [options]
 *   
 * Options:
 *   --security-only    Run only security scans (no server required)
 *   --functional-only  Run only functional tests (requires server)
 *   --url=<url>        Base URL for functional tests (default: http://localhost:3000)
 *   --skip-rate-limit  Skip slow rate limiting tests
 */

import { TestTracker, formatSection, formatWarning, maskSecret } from './test-helpers.js';
import { runSecurityScans } from './security-scan.js';

const args = process.argv.slice(2);
const options = {
  securityOnly: args.includes('--security-only'),
  functionalOnly: args.includes('--functional-only'),
  skipRateLimit: args.includes('--skip-rate-limit'),
  baseUrl: args.find(arg => arg.startsWith('--url='))?.split('=')[1] || 'http://localhost:3000',
};

/**
 * Test environment variable configuration
 * DEPLOY_CHECKLIST.md: Section 1 - Environment Variables
 */
async function testEnvironmentVariables() {
  const tracker = new TestTracker();
  formatSection('⚙️  Environment Variables');

  const requiredVars = ['GEMINI_API_KEY'];
  const optionalVars = ['ALLOWED_ORIGIN', 'APP_ENV', 'RATE_LIMIT_PER_MIN'];

  // Check required variables
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      tracker.recordTest(
        `${varName} is set`,
        true,
        `Value: ${maskSecret(value)}`
      );
    } else {
      tracker.recordWarning(
        `${varName} not set - functional tests may fail`
      );
    }
  }

  // Check optional variables (as warnings)
  for (const varName of optionalVars) {
    const value = process.env[varName];
    if (!value) {
      tracker.recordWarning(
        `${varName} not set (using default)`
      );
    } else {
      tracker.recordTest(
        `${varName} is set`,
        true,
        `Value: ${value}`
      );
    }
  }

  // Check .env.example exists
  const { existsSync } = await import('fs');
  tracker.recordTest(
    '.env.example exists',
    existsSync('.env.example'),
    existsSync('.env.example') ? 'Template available' : 'Missing template'
  );

  return tracker;
}

/**
 * Test API endpoints functionality
 * DEPLOY_CHECKLIST.md: Section 5 - Functional Testing
 */
async function testFunctionalEndpoints(baseUrl) {
  const tracker = new TestTracker();
  formatSection(`🧪 Functional API Tests (${baseUrl})`);

  // Test 1: Health Check
  try {
    const response = await fetch(`${baseUrl}/api/health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    
    tracker.recordTest(
      'Health check endpoint',
      response.ok && data.status === 'ok',
      response.ok ? `Status: ${data.status}` : `HTTP ${response.status}`
    );
  } catch (error) {
    tracker.recordTest(
      'Health check endpoint',
      false,
      `Error: ${error.message}`
    );
  }

  // Test 2: Story generation (basic payload)
  try {
    const response = await fetch(`${baseUrl}/api/story`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'classic',
        heroName: 'TestHero',
        heroPower: 'Testing',
        setting: 'TestLand',
        problem: 'Testing',
        storyLength: 'short',
        madlibs: {},
        sleepConfig: {},
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      tracker.recordTest(
        'Story generation endpoint',
        Array.isArray(data.parts) && data.parts.length > 0,
        `Generated ${data.parts?.length || 0} story parts`
      );
    } else {
      const error = await response.json().catch(() => ({ error: 'Unknown' }));
      tracker.recordTest(
        'Story generation endpoint',
        false,
        `HTTP ${response.status}: ${error.error}`
      );
    }
  } catch (error) {
    tracker.recordTest(
      'Story generation endpoint',
      false,
      `Error: ${error.message}`
    );
  }

  // Test 3: Image generation
  try {
    const response = await fetch(`${baseUrl}/api/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'avatar',
        heroName: 'TestHero',
        heroPower: 'Testing',
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      tracker.recordTest(
        'Image generation endpoint',
        data.base64 && data.mimeType,
        `Generated ${data.mimeType}`
      );
    } else {
      const error = await response.json().catch(() => ({ error: 'Unknown' }));
      tracker.recordTest(
        'Image generation endpoint',
        false,
        `HTTP ${response.status}: ${error.error}`
      );
    }
  } catch (error) {
    tracker.recordTest(
      'Image generation endpoint',
      false,
      `Error: ${error.message}`
    );
  }

  // Test 4: TTS endpoint
  try {
    const response = await fetch(`${baseUrl}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Test narration.',
        voiceName: 'Kore',
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      tracker.recordTest(
        'TTS generation endpoint',
        data.base64 && data.sampleRate === 24000,
        `Generated PCM audio at ${data.sampleRate}Hz`
      );
    } else {
      const error = await response.json().catch(() => ({ error: 'Unknown' }));
      tracker.recordTest(
        'TTS generation endpoint',
        false,
        `HTTP ${response.status}: ${error.error}`
      );
    }
  } catch (error) {
    tracker.recordTest(
      'TTS generation endpoint',
      false,
      `Error: ${error.message}`
    );
  }

  return tracker;
}

/**
 * Test CORS headers
 * DEPLOY_CHECKLIST.md: Section 4 - Network Traffic Verification
 */
async function testCorsHeaders(baseUrl) {
  const tracker = new TestTracker();
  formatSection('🌐 CORS Headers Verification');

  try {
    const response = await fetch(`${baseUrl}/api/health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const corsHeader = response.headers.get('Access-Control-Allow-Origin');
    const methodsHeader = response.headers.get('Access-Control-Allow-Methods');
    const headersHeader = response.headers.get('Access-Control-Allow-Headers');

    tracker.recordTest(
      'CORS Allow-Origin header present',
      corsHeader !== null,
      corsHeader ? `Value: ${corsHeader}` : 'Missing'
    );

    tracker.recordTest(
      'CORS Allow-Methods header present',
      methodsHeader !== null,
      methodsHeader ? `Value: ${methodsHeader}` : 'Missing'
    );

    tracker.recordTest(
      'CORS Allow-Headers header present',
      headersHeader !== null,
      headersHeader ? `Value: ${headersHeader}` : 'Missing'
    );
  } catch (error) {
    tracker.recordTest(
      'CORS headers verification',
      false,
      `Error: ${error.message}`
    );
  }

  return tracker;
}

/**
 * Test rate limiting
 * DEPLOY_CHECKLIST.md: Section 6 - Rate Limiting Verification
 */
async function testRateLimiting(baseUrl) {
  const tracker = new TestTracker();
  formatSection('🚦 Rate Limiting Verification');

  const rateLimit = parseInt(process.env.RATE_LIMIT_PER_MIN || '30', 10);
  
  formatWarning(`This test will make ${rateLimit + 5} requests to verify rate limiting`);
  formatWarning(`Test may take 30+ seconds to complete`);

  try {
    let successCount = 0;
    let rateLimitedCount = 0;

    // Make requests slightly above the limit
    for (let i = 0; i < rateLimit + 5; i++) {
      const response = await fetch(`${baseUrl}/api/health`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 429) {
        rateLimitedCount++;
      } else if (response.ok) {
        successCount++;
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    tracker.recordTest(
      'Rate limiting triggers correctly',
      rateLimitedCount > 0,
      `${successCount} succeeded, ${rateLimitedCount} rate-limited`
    );

    tracker.recordTest(
      'Rate limit threshold reasonable',
      successCount >= rateLimit - 5,
      `Limit configured at ${rateLimit}/min`
    );
  } catch (error) {
    tracker.recordTest(
      'Rate limiting test',
      false,
      `Error: ${error.message}`
    );
  }

  return tracker;
}

/**
 * Main test runner
 */
async function main() {
  console.log('\n🚀 Deployment Verification Test Suite');
  console.log(`📅 ${new Date().toISOString()}\n`);

  const allTrackers = [];

  // Environment checks (always run)
  const envTracker = await testEnvironmentVariables();
  allTrackers.push(envTracker);

  // Security scans (skip if functional-only)
  if (!options.functionalOnly) {
    const securityTracker = await runSecurityScans();
    allTrackers.push(securityTracker);
  }

  // Functional tests (skip if security-only)
  if (!options.securityOnly) {
    formatWarning(`Testing against: ${options.baseUrl}`);
    formatWarning('Ensure server is running (npm run dev) or provide deployed URL with --url=https://...\n');

    const functionalTracker = await testFunctionalEndpoints(options.baseUrl);
    allTrackers.push(functionalTracker);

    const corsTracker = await testCorsHeaders(options.baseUrl);
    allTrackers.push(corsTracker);

    // Rate limiting test (slow, optional)
    if (!options.skipRateLimit) {
      const rateLimitTracker = await testRateLimiting(options.baseUrl);
      allTrackers.push(rateLimitTracker);
    } else {
      formatWarning('Skipping rate limiting tests (use without --skip-rate-limit to run)\n');
    }
  }

  // Combined summary
  const combined = new TestTracker();
  for (const tracker of allTrackers) {
    combined.passed += tracker.passed;
    combined.failed += tracker.failed;
    combined.warnings += tracker.warnings;
  }

  const success = combined.printSummary();
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
