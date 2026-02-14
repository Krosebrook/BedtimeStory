/**
 * Security Scanner for Deployment Verification
 * Scans build artifacts and source code for security issues
 * Maps to DEPLOY_CHECKLIST.md sections 2-3
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { TestTracker, formatSection } from './test-helpers.js';

/**
 * Patterns to search for in build artifacts
 */
const SECURITY_PATTERNS = {
  apiKey: /AIza[0-9A-Za-z-_]{35}/g,
  envReference: /process\.env\.(API_KEY|GEMINI_API_KEY)/g,
  directApiCall: /generativelanguage\.googleapis\.com/g,
  commonSecrets: /(api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"]+['"]/gi,
};

/**
 * Recursively scan directory for files
 */
function* walkDirectory(dir, extensions = []) {
  try {
    const files = readdirSync(dir);
    for (const file of files) {
      const filePath = join(dir, file);
      try {
        const stat = statSync(filePath);
        
        if (stat.isDirectory()) {
          yield* walkDirectory(filePath, extensions);
        } else if (extensions.length === 0 || extensions.some(ext => file.endsWith(ext))) {
          yield filePath;
        }
      } catch (e) {
        // Skip files we can't stat
      }
    }
  } catch (e) {
    // Skip directories we can't read
  }
}

/**
 * Scan a file for security patterns
 */
function scanFile(filePath, patterns) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const findings = [];

    for (const [name, pattern] of Object.entries(patterns)) {
      const matches = content.match(pattern);
      if (matches) {
        findings.push({ pattern: name, matches: matches.length, file: filePath });
      }
    }

    return findings;
  } catch (error) {
    return [];
  }
}

/**
 * Run security scans on build artifacts
 * DEPLOY_CHECKLIST.md: Section 3 - Build Artifact Inspection
 */
export async function scanBuildArtifacts(distDir = 'dist') {
  const tracker = new TestTracker();
  formatSection('🔍 Build Artifact Security Scan');

  // Check if dist directory exists
  if (!existsSync(distDir)) {
    tracker.recordTest(
      'Build directory exists',
      false,
      `${distDir}/ not found. Run 'npm run build' first.`
    );
    return tracker;
  }

  tracker.recordTest('Build directory exists', true, `Found ${distDir}/`);

  // Scan for API keys
  const apiKeyFindings = [];
  const envRefFindings = [];
  const directApiFindings = [];

  for (const filePath of walkDirectory(distDir, ['.js', '.html', '.json'])) {
    const fileFindings = scanFile(filePath, SECURITY_PATTERNS);
    
    for (const finding of fileFindings) {
      if (finding.pattern === 'apiKey') {
        apiKeyFindings.push(finding);
      } else if (finding.pattern === 'envReference') {
        envRefFindings.push(finding);
      } else if (finding.pattern === 'directApiCall') {
        directApiFindings.push(finding);
      }
    }
  }

  // Report findings
  tracker.recordTest(
    'No API keys in build',
    apiKeyFindings.length === 0,
    apiKeyFindings.length > 0 
      ? `Found ${apiKeyFindings.length} API key(s)`
      : 'Clean'
  );

  tracker.recordTest(
    'No process.env references',
    envRefFindings.length === 0,
    envRefFindings.length > 0
      ? `Found ${envRefFindings.length} env reference(s)`
      : 'Clean'
  );

  tracker.recordTest(
    'No direct Gemini API calls',
    directApiFindings.length === 0,
    directApiFindings.length > 0
      ? `Found ${directApiFindings.length} direct API call(s)`
      : 'Clean'
  );

  return tracker;
}

/**
 * Scan source code for security issues
 * DEPLOY_CHECKLIST.md: Section 2 - Source Code Security Audit
 */
export async function scanSourceCode() {
  const tracker = new TestTracker();
  formatSection('🔍 Source Code Security Scan');

  // Check API files use requireEnv
  const apiFiles = ['api/story.ts', 'api/image.ts', 'api/tts.ts'];
  let allValid = true;

  for (const file of apiFiles) {
    if (!existsSync(file)) {
      tracker.recordTest(`API file exists: ${file}`, false, 'File not found');
      allValid = false;
      continue;
    }

    const content = readFileSync(file, 'utf-8');
    const usesRequireEnv = content.includes('requireEnv');
    
    tracker.recordTest(
      `${file} uses requireEnv()`,
      usesRequireEnv,
      usesRequireEnv ? 'Properly validated' : 'Missing requireEnv() call'
    );
    
    if (!usesRequireEnv) {
      allValid = false;
    }
  }

  // Check vite.config.ts doesn't inject secrets
  if (existsSync('vite.config.ts')) {
    const viteConfig = readFileSync('vite.config.ts', 'utf-8');
    const hasSecretInjection = /define.*process\.env\.(API_KEY|GEMINI_API_KEY)/s.test(viteConfig);

    tracker.recordTest(
      'vite.config.ts does not inject secrets',
      !hasSecretInjection,
      hasSecretInjection ? 'Found secret injection in define config' : 'Clean'
    );
  }

  // Check for hardcoded API keys in source
  const sourceFindings = [];
  for (const filePath of walkDirectory('.', ['.ts', '.tsx', '.js'])) {
    // Skip node_modules, dist, tests
    if (filePath.includes('node_modules') || filePath.includes('dist') || filePath.includes('tests')) continue;
    
    const findings = scanFile(filePath, { apiKey: SECURITY_PATTERNS.apiKey });
    if (findings.length > 0 && findings[0].matches) {
      sourceFindings.push(findings[0]);
    }
  }

  tracker.recordTest(
    'No hardcoded API keys in source',
    sourceFindings.length === 0,
    sourceFindings.length > 0 ? `Found keys in ${sourceFindings.length} file(s)` : 'Clean'
  );

  return tracker;
}

/**
 * Run all security scans
 */
export async function runSecurityScans() {
  const buildTracker = await scanBuildArtifacts();
  const sourceTracker = await scanSourceCode();

  // Combine results
  const combined = new TestTracker();
  combined.passed = buildTracker.passed + sourceTracker.passed;
  combined.failed = buildTracker.failed + sourceTracker.failed;
  combined.warnings = buildTracker.warnings + sourceTracker.warnings;

  return combined;
}
