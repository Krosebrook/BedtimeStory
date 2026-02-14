/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import {
  requireEnv,
  handleCORS,
  errorResponse,
  getClientIP,
  checkRateLimit,
} from './_utils';

interface ImageRequest {
  kind: 'avatar' | 'scene';
  heroName?: string;
  heroPower?: string;
  context?: string;
  heroDescription?: string;
}

/**
 * Image generation endpoint for avatars and scenes.
 * POST /api/image
 * Body: { kind, heroName?, heroPower?, context?, heroDescription? }
 * Returns: { mimeType: string, base64: string }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCORS(req, res)) return;

  if (req.method !== 'POST') {
    return errorResponse(res, 405, 'Method not allowed');
  }

  // Rate limiting
  const clientIP = getClientIP(req);
  if (!checkRateLimit(clientIP)) {
    return errorResponse(res, 429, 'Too many requests. Please try again later.');
  }

  try {
    const apiKey = requireEnv('GEMINI_API_KEY');
    const input: ImageRequest = req.body;

    if (!input || !input.kind) {
      return errorResponse(res, 400, 'Invalid input: missing kind field');
    }

    const ai = new GoogleGenAI({ apiKey });

    // Construct prompt based on image kind
    let prompt = '';
    if (input.kind === 'avatar') {
      if (!input.heroName) {
        return errorResponse(res, 400, 'Missing heroName for avatar generation');
      }
      prompt = `A professional children's book illustration portrait of ${input.heroName} who has the power of ${
        input.heroPower || 'imagination'
      }. High-contrast, friendly, vibrant style. Close-up on the hero's face.`;
    } else if (input.kind === 'scene') {
      if (!input.context) {
        return errorResponse(res, 400, 'Missing context for scene generation');
      }
      prompt = `Vibrant children's storybook scene: ${input.context.substring(
        0,
        400
      )}. Featuring: ${input.heroDescription || 'a hero'}. Whimsical, magical atmosphere.`;
    } else {
      return errorResponse(res, 400, 'Invalid kind: must be avatar or scene');
    }

    // Execute API call with retry logic
    const maxRetries = 2;
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: prompt }] },
        });

        const part = response.candidates?.[0]?.content?.parts.find(
          (p: any) => p.inlineData
        );

        if (!part?.inlineData) {
          throw new Error('No image data received from API');
        }

        return res.status(200).json({
          mimeType: part.inlineData.mimeType,
          base64: part.inlineData.data,
        });
      } catch (error: any) {
        lastError = error;

        // Don't retry on 4xx client errors (except 429)
        if (
          error.response?.status >= 400 &&
          error.response?.status < 500 &&
          error.response?.status !== 429
        ) {
          break;
        }

        // Wait before retry
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    // If all retries failed
    console.error('Image generation failed after retries:', lastError);
    return errorResponse(
      res,
      500,
      lastError?.message || 'Image generation failed'
    );
  } catch (error: any) {
    console.error('Image API error:', error);
    return errorResponse(res, 500, error?.message || 'Internal server error');
  }
}
