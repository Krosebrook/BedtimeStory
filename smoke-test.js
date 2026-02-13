#!/usr/bin/env node

/**
 * Smoke Test for Bedtime Story API Endpoints
 * Run with: node smoke-test.js [base-url]
 * 
 * Example:
 *   node smoke-test.js http://localhost:3000
 *   node smoke-test.js https://your-app.vercel.app
 */

const baseUrl = process.argv[2] || 'http://localhost:3000';

console.log('🧪 Starting Smoke Tests...');
console.log(`📍 Base URL: ${baseUrl}\n`);

let passedTests = 0;
let failedTests = 0;

async function testEndpoint(name, url, options, validator) {
  try {
    console.log(`Testing: ${name}...`);
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      console.log(`❌ ${name} - HTTP ${response.status}: ${data.error || 'Unknown error'}`);
      failedTests++;
      return false;
    }

    if (validator && !validator(data)) {
      console.log(`❌ ${name} - Invalid response structure`);
      console.log('Response:', JSON.stringify(data, null, 2));
      failedTests++;
      return false;
    }

    console.log(`✅ ${name} - PASSED`);
    passedTests++;
    return true;
  } catch (error) {
    console.log(`❌ ${name} - ${error.message}`);
    failedTests++;
    return false;
  }
}

async function runTests() {
  // Test 1: Health Check
  await testEndpoint(
    'Health Check',
    `${baseUrl}/api/health`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    (data) => data.status === 'ok'
  );

  // Test 2: Story Generation (minimal payload)
  await testEndpoint(
    'Story Generation',
    `${baseUrl}/api/story`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'classic',
        heroName: 'Test Hero',
        heroPower: 'Testing',
        setting: 'Test Land',
        problem: 'Test Problem',
        storyLength: 'short',
        madlibs: {},
        sleepConfig: {},
      }),
    },
    (data) => Array.isArray(data.parts) && data.parts.length > 0
  );

  // Test 3: Image Generation (Avatar)
  await testEndpoint(
    'Image Generation (Avatar)',
    `${baseUrl}/api/image`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'avatar',
        heroName: 'Test Hero',
        heroPower: 'Testing',
      }),
    },
    (data) => data.base64 && data.mimeType
  );

  // Test 4: TTS Generation
  await testEndpoint(
    'TTS Generation',
    `${baseUrl}/api/tts`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'This is a test.',
        voiceName: 'Kore',
      }),
    },
    (data) => data.base64 && data.sampleRate === 24000
  );

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log('='.repeat(50));

  if (failedTests > 0) {
    console.log('\n⚠️  Some tests failed. Check the API configuration.');
    process.exit(1);
  } else {
    console.log('\n🎉 All smoke tests passed!');
    process.exit(0);
  }
}

runTests().catch((error) => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
