/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import {
  requireEnv,
  handleCORS,
  errorResponse,
  getClientIP,
  checkRateLimit,
} from './_utils';

interface StoryState {
  heroName?: string;
  heroPower?: string;
  setting?: string;
  sidekick?: string;
  problem?: string;
  mode: 'classic' | 'madlibs' | 'sleep';
  madlibs: { [key: string]: string };
  sleepConfig: {
    texture?: string;
    sound?: string;
    scent?: string;
    theme?: string;
  };
  storyLength: 'short' | 'medium' | 'long' | 'eternal';
}

/**
 * Story generation endpoint.
 * POST /api/story
 * Body: StoryState-like JSON input
 * Returns: StoryFull JSON object
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
    const input: StoryState = req.body;

    if (!input || !input.mode) {
      return errorResponse(res, 400, 'Invalid input: missing required fields');
    }

    const ai = new GoogleGenAI({ apiKey });

    // 1. Define Output Schema
    const storySchema: Schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        parts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              choices: { type: Type.ARRAY, items: { type: Type.STRING } },
              partIndex: { type: Type.INTEGER },
            },
            required: ['text', 'partIndex'],
          },
        },
        vocabWord: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            definition: { type: Type.STRING },
          },
          required: ['word', 'definition'],
        },
        joke: { type: Type.STRING },
        lesson: { type: Type.STRING },
        tomorrowHook: { type: Type.STRING },
        rewardBadge: {
          type: Type.OBJECT,
          properties: {
            emoji: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
          },
          required: ['emoji', 'title', 'description'],
        },
      },
      required: [
        'title',
        'parts',
        'vocabWord',
        'joke',
        'lesson',
        'tomorrowHook',
        'rewardBadge',
      ],
    };

    // 2. Construct Length & Pacing Instructions
    let lengthConfig = '';
    if (input.mode === 'sleep') {
      const multiplier =
        input.storyLength === 'short'
          ? 0.7
          : input.storyLength === 'long'
          ? 1.5
          : input.storyLength === 'eternal'
          ? 2
          : 1;
      const partsCount = Math.floor(15 * multiplier);
      const wordCountMin = Math.floor(4000 * multiplier);
      const wordCountMax = Math.floor(6000 * multiplier);

      lengthConfig = `
        - LENGTH: ULTIMATE SLUMBER EDITION. 
        - WORD COUNT: ${wordCountMin}-${wordCountMax} words total.
        - PARTS: Exactly ${partsCount} distinct parts.
        - PACING: Hypnotically slow. Extensive descriptions.
        - INTERACTIVITY: NONE. The 'choices' array MUST be empty for all parts.
        `;
    } else {
      const settings = {
        short: 'approx 400 words, 3-4 parts',
        medium: 'approx 1200 words, 5-7 parts',
        long: 'approx 2500 words, 8-10 parts',
        eternal: 'approx 4500 words, 15-18 parts',
      };
      const setting =
        settings[input.storyLength as keyof typeof settings] || settings.medium;
      lengthConfig = `
        - LENGTH: ${setting}.
        - INTERACTIVITY: Provide 3 meaningful, distinct choices at the end of each part (except the final part).
        `;
    }

    // 3. Construct System Instruction
    let systemInstruction = '';
    if (input.mode === 'sleep') {
      systemInstruction = `You are a master Sleep Hypnotist and Storyteller. 
        Your goal is to induce deep sleep through a very long, boringly pleasant, and sensory-rich narrative.
        
        RULES:
        1. ZERO CONFLICT. No monsters, no scares, no sudden noises, no tension.
        2. TONE: Dreamy, lyrical, slow, and repetitive. Focus on warmth, softness, and safety.
        3. VOCABULARY: Soothing, rhythmic, sibilant sounds.
        ${lengthConfig}`;
    } else if (input.mode === 'classic') {
      systemInstruction = `You are a best-selling Children's Book Author (genre: Fantasy/Adventure).
        Your goal is to write an exciting, empowering story for kids aged 7-9.
        
        RULES:
        1. HEROIC TONE: Inspiring, brave, and wondrous.
        2. STRUCTURE: A clear beginning, middle, and end.
        3. VOCABULARY: Engaging but accessible, with one 'vocabWord' to learn.
        ${lengthConfig}`;
    } else {
      systemInstruction = `You are a Mad Libs Generator and Comedian.
        Your goal is to create a hilarious, chaotic, and nonsensical story using provided keywords.
        
        RULES:
        1. TONE: Silly, unexpected, high-energy.
        2. CONTENT: Maximum usage of the provided random words in funny contexts.
        ${lengthConfig}`;
    }

    // 4. Construct User Prompt
    let userPrompt = '';
    if (input.mode === 'sleep') {
      const { texture, sound, scent, theme } = input.sleepConfig;
      userPrompt = `
        Generate a sleep story with these parameters:
        HERO: ${input.heroName || 'The Dreamer'}.
        THEME: ${theme}.
        SENSORY ANCHORS: "${texture || 'softness'}", "${sound || 'quietness'}", "${
        scent || 'sweetness'
      }".
        `;
    } else if (input.mode === 'classic') {
      userPrompt = `
        Generate an adventure story:
        HERO: ${input.heroName || 'The Hero'}.
        POWER: ${input.heroPower || 'boundless imagination'}.
        SETTING: ${input.setting || 'a mysterious land'}.
        SIDEKICK: ${input.sidekick || 'none'}.
        PROBLEM: ${input.problem || 'a mystery to solve'}.
        `;
    } else {
      userPrompt = `
        Generate a Mad Libs story using these words:
        ${Object.entries(input.madlibs)
          .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
          .join('\n')}
        `;
    }

    // 5. Execute API Call with retry logic
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: [{ parts: [{ text: userPrompt }] }],
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: storySchema,
          },
        });

        // Robust JSON extraction
        let jsonStr = result.text || '{}';

        // Clean potential markdown blocks
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.replace(/^```json\n/, '').replace(/\n```$/, '');
        } else if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/^```\n/, '').replace(/\n```$/, '');
        }

        const parsed = JSON.parse(jsonStr);

        // Validation
        if (
          !parsed.parts ||
          !Array.isArray(parsed.parts) ||
          parsed.parts.length === 0
        ) {
          throw new Error(
            "Invalid story structure: 'parts' array is missing or empty."
          );
        }

        return res.status(200).json(parsed);
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

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, attempt))
          );
        }
      }
    }

    // If all retries failed
    console.error('Story generation failed after retries:', lastError);
    return errorResponse(
      res,
      500,
      lastError?.message || 'Story generation failed'
    );
  } catch (error: any) {
    console.error('Story API error:', error);
    return errorResponse(res, 500, error?.message || 'Internal server error');
  }
}
