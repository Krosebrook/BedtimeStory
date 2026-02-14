/**
 * Test Helpers for Deployment Verification Suite
 * Provides utilities for colorized output, validators, and test execution
 */

// Color codes for terminal output
export const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

/**
 * Formats test output with emojis and colors
 */
export function formatTestResult(passed, testName, details = '') {
  const icon = passed ? '✅' : '❌';
  const color = passed ? colors.green : colors.red;
  const detailsStr = details ? ` ${colors.gray}${details}${colors.reset}` : '';
  console.log(`${color}${icon} ${testName}${colors.reset}${detailsStr}`);
}

/**
 * Formats section headers
 */
export function formatSection(title) {
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}${title}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

/**
 * Formats warnings
 */
export function formatWarning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

/**
 * Masks sensitive data for logging
 */
export function maskSecret(secret) {
  if (!secret || secret.length < 8) return '****';
  return `${secret.substring(0, 4)}...${secret.substring(secret.length - 4)}`;
}

/**
 * Async test runner with timeout
 */
export async function runWithTimeout(fn, timeoutMs = 10000) {
  return Promise.race([
    fn(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Test timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

/**
 * Validates URL format
 */
export function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

/**
 * Test suite result tracker
 */
export class TestTracker {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.warnings = 0;
    this.tests = [];
  }

  recordTest(name, passed, details = '', isWarning = false) {
    this.tests.push({ name, passed, details, isWarning });
    if (isWarning) {
      this.warnings++;
    } else if (passed) {
      this.passed++;
    } else {
      this.failed++;
    }
    formatTestResult(passed, name, details);
  }

  recordWarning(message) {
    this.warnings++;
    formatWarning(message);
  }

  printSummary() {
    console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.blue}TEST SUMMARY${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.green}✅ Passed: ${this.passed}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${this.failed}${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Warnings: ${this.warnings}${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);

    if (this.failed > 0) {
      console.log(`${colors.red}❌ Deployment verification FAILED${colors.reset}`);
      console.log(`${colors.gray}Fix the failures above and re-run tests${colors.reset}\n`);
      return false;
    } else if (this.warnings > 0) {
      console.log(`${colors.yellow}⚠️  Deployment verification PASSED with warnings${colors.reset}`);
      console.log(`${colors.gray}Review warnings before deploying to production${colors.reset}\n`);
      return true;
    } else {
      console.log(`${colors.green}✅ All deployment verification tests PASSED${colors.reset}\n`);
      return true;
    }
  }
}
