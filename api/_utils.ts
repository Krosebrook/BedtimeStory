/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * In-memory rate limiting store. For production, consider Redis.
 * Structure: Map<IP, { count: number, resetAt: number }>
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Validates and retrieves a required environment variable.
 * @throws Error if the variable is not set
 */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Returns the allowed CORS origin from environment or default.
 */
export function getAllowedOrigin(): string {
  return process.env.ALLOWED_ORIGIN || '*';
}

/**
 * Returns the rate limit per minute from environment or default.
 */
export function getRateLimit(): number {
  const limit = process.env.RATE_LIMIT_PER_MIN;
  return limit ? parseInt(limit, 10) : 30;
}

/**
 * Extracts client IP from request headers.
 * Checks x-forwarded-for, x-real-ip, and falls back to connection.
 */
export function getClientIP(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  const realIP = req.headers['x-real-ip'];
  if (typeof realIP === 'string') {
    return realIP;
  }
  return 'unknown';
}

/**
 * Checks if the client IP has exceeded the rate limit.
 * @returns true if within limit, false if exceeded
 */
export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = getRateLimit();
  const windowMs = 60 * 1000; // 1 minute window

  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetAt) {
    // New window
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Sets CORS headers on the response and handles OPTIONS preflight.
 * @returns true if this was an OPTIONS request (should end early)
 */
export function handleCORS(req: VercelRequest, res: VercelResponse): boolean {
  const origin = getAllowedOrigin();
  
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  
  return false;
}

/**
 * Sends a standardized error response.
 */
export function errorResponse(
  res: VercelResponse,
  status: number,
  message: string
): void {
  res.status(status).json({ error: message, status: 'error' });
}
