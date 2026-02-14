/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { requireEnv, handleCORS, errorResponse } from './_utils';

/**
 * Health check endpoint for backend status.
 * Verifies that required environment variables are set.
 * GET/POST /api/health
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCORS(req, res)) return;

  try {
    // Check if API key exists (without revealing it)
    requireEnv('GEMINI_API_KEY');
    
    const environment = process.env.APP_ENV || 'production';
    
    res.status(200).json({
      status: 'ok',
      environment,
    });
  } catch (error: any) {
    errorResponse(res, 503, error.message || 'Backend configuration incomplete');
  }
}
