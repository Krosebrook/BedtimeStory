/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Modality } from '@google/genai';
import {
  requireEnv,
  handleCORS,
  errorResponse,
  getClientIP,
  checkRateLimit,
} from './_utils';

interface TTSRequest {
  text: string;
  voiceName?: string;
}

/**
 * Text-to-speech endpoint.
 * POST /api/tts
 * Body: { text: string, voiceName?: string }
 * Returns: { base64: string, sampleRate: 24000, channels: 1, mimeType: 'audio/pcm' }
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
    const input: TTSRequest = req.body;

    if (!input || !input.text) {
      return errorResponse(res, 400, 'Invalid input: missing text field');
    }

    const ai = new GoogleGenAI({ apiKey });
    const voiceName = input.voiceName || 'Kore';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: input.text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Audio) {
        throw new Error('No audio data received from API');
      }

      return res.status(200).json({
        base64: base64Audio,
        sampleRate: 24000,
        channels: 1,
        mimeType: 'audio/pcm',
      });
    } catch (error: any) {
      console.error('TTS generation failed:', error);
      return errorResponse(
        res,
        500,
        error?.message || 'Text-to-speech generation failed'
      );
    }
  } catch (error: any) {
    console.error('TTS API error:', error);
    return errorResponse(res, 500, error?.message || 'Internal server error');
  }
}
