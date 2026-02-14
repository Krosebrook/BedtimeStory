/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { StoryState, StoryFull } from "./types";

export class AIClient {
  private static getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private static async retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (retries <= 0) throw error;
      
      // Don't retry on 400 client errors (like invalid API key), except 429 (Too Many Requests)
      if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
          throw error;
      }

      console.warn(`API Call failed, retrying in ${delay}ms...`, error);
      await new Promise(res => setTimeout(res, delay));
      return this.retry(fn, retries - 1, delay * 2);
    }
  }

  static async streamStory(input: StoryState): Promise<StoryFull> {
    const ai = this.getAI();
    
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
              partIndex: { type: Type.INTEGER }
            },
            required: ["text", "partIndex"]
          }
        },
        vocabWord: {
          type: Type.OBJECT,
          properties: { word: { type: Type.STRING }, definition: { type: Type.STRING } },
          required: ["word", "definition"]
        },
        joke: { type: Type.STRING },
        lesson: { type: Type.STRING },
        tomorrowHook: { type: Type.STRING },
        rewardBadge: {
          type: Type.OBJECT,
          properties: { emoji: { type: Type.STRING }, title: { type: Type.STRING }, description: { type: Type.STRING } },
          required: ["emoji", "title", "description"]
        }
      },
      required: ["title", "parts", "vocabWord", "joke", "lesson", "tomorrowHook", "rewardBadge"]
    };

    // 2. Construct Length & Pacing Instructions (Variable)
    let lengthConfig = "";
    if (input.mode === 'sleep') {
        const multiplier = input.storyLength === 'short' ? 0.7 : (input.storyLength === 'long' ? 1.5 : (input.storyLength === 'eternal' ? 2 : 1));
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
            short: "approx 400 words, 3-4 parts",
            medium: "approx 1200 words, 5-7 parts",
            long: "approx 2500 words, 8-10 parts",
            eternal: "approx 4500 words, 15-18 parts"
        };
        const setting = settings[input.storyLength] || settings.medium;
        lengthConfig = `
        - LENGTH: ${setting}.
        - INTERACTIVITY: Provide 3 meaningful, distinct choices at the end of each part (except the final part).
        `;
    }

    // 3. Construct System Instruction (Role & Core Rules)
    let systemInstruction = "";
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
        3. PLOT TWIST: You MUST include at least one surprising but age-appropriate plot twist or unexpected event in the middle of the story to keep it engaging.
        4. CREATIVITY: Avoid generic tropes; introduce unique challenges or clever solutions.
        5. VOCABULARY: Engaging but accessible, with one 'vocabWord' to learn.
        ${lengthConfig}`;
    } else {
        systemInstruction = `You are a Mad Libs Generator and Comedian.
        Your goal is to create a hilarious, chaotic, and nonsensical story using provided keywords.
        
        RULES:
        1. TONE: Silly, unexpected, high-energy.
        2. CONTENT: Maximum usage of the provided random words in funny contexts.
        ${lengthConfig}`;
    }

    // 4. Construct User Prompt (Specific Inputs)
    let userPrompt = "";
    if (input.mode === 'sleep') {
        const { texture, sound, scent, theme } = input.sleepConfig;
        userPrompt = `
        Generate a sleep story with these parameters:
        HERO: ${input.heroName || 'The Dreamer'}.
        THEME: ${theme}.
        SENSORY ANCHORS: "${texture || 'softness'}", "${sound || 'quietness'}", "${scent || 'sweetness'}".
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
        ${Object.entries(input.madlibs).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join('\n')}
        `;
    }

    // 5. Execute API Call
    return this.retry(async () => {
        try {
            const result = await ai.models.generateContent({
                model: "gemini-3-pro-preview",
                contents: [{ parts: [{ text: userPrompt }] }],
                config: { 
                    systemInstruction: systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: storySchema,
                }
            });

            // Robust JSON extraction
            let jsonStr = result.text || "{}";
            
            // Clean potential markdown blocks just in case
            if (jsonStr.startsWith("```json")) {
                jsonStr = jsonStr.replace(/^```json\n/, "").replace(/\n```$/, "");
            } else if (jsonStr.startsWith("```")) {
                jsonStr = jsonStr.replace(/^```\n/, "").replace(/\n```$/, "");
            }

            const parsed = JSON.parse(jsonStr);

            // Validation
            if (!parsed.parts || !Array.isArray(parsed.parts) || parsed.parts.length === 0) {
                throw new Error("Invalid story structure: 'parts' array is missing or empty.");
            }

            return parsed as StoryFull;
        } catch (e) {
            console.error("AI Generation Internal Error", e);
            throw e;
        }
    });
  }

  static async generateAvatar(heroName: string, heroPower: string): Promise<string | null> {
    const ai = this.getAI();
    const prompt = `A professional children's book illustration portrait of ${heroName} who has the power of ${heroPower}. High-contrast, friendly, vibrant style. Close-up on the hero's face.`;
    // We rethrow errors to allow the UI to handle them (e.g., showing 404 dialog)
    return await this.retry(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
        });
        const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (!part?.inlineData) throw new Error("No image data received from API");
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }, 2, 1000);
  }

  static async generateSceneIllustration(context: string, heroDescription: string): Promise<string | null> {
    const ai = this.getAI();
    const prompt = `Vibrant children's storybook scene: ${context.substring(0, 400)}. Featuring: ${heroDescription}. Whimsical, magical atmosphere.`;
    // We rethrow errors to allow the UI to handle them
    return await this.retry(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
        });
        const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (!part?.inlineData) throw new Error("No image data received from API");
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
     }, 2, 1000);
  }
}