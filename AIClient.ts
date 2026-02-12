
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Type } from "@google/genai";
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
    
    // 1. Construct Length & Pacing Instructions
    let lengthInstructions = "";
    if (input.mode === 'sleep') {
        const multiplier = input.storyLength === 'short' ? 0.7 : (input.storyLength === 'long' ? 1.5 : (input.storyLength === 'eternal' ? 2 : 1));
        const partsCount = Math.floor(15 * multiplier);
        const wordCountMin = Math.floor(4000 * multiplier);
        const wordCountMax = Math.floor(6000 * multiplier);
        
        lengthInstructions = `
        LENGTH: ULTIMATE SLUMBER EDITION. 
        WORD COUNT: Total story word count MUST be between ${wordCountMin} and ${wordCountMax} words.
        STRUCTURE: Divide the story into ${partsCount} distinct, very long parts to ensure a deep, sustained journey to sleep.
        PACING: Hypnotically slow. Use extensive descriptions of environments, sensations, and peaceful transitions. 
        VOCABULARY: Rich, evocative, and rhythmic, but avoid harsh sounds.
        `;
    } else {
        switch (input.storyLength) {
            case 'short':
                lengthInstructions = "LENGTH: approx 400 words. 3-4 parts. Fast-paced, simple vocabulary, focused narrative.";
                break;
            case 'long':
                lengthInstructions = "LENGTH: approx 2500 words. 8-10 parts. Advanced vocabulary, deep world-building, sub-plots, and rich detailed descriptions.";
                break;
            case 'eternal':
                lengthInstructions = "LENGTH: Maximum complexity. approx 4500 words. 15-18 parts. Epic scale, sophisticated vocabulary, extensive dialogue, and atmospheric world-building.";
                break;
            case 'medium':
            default:
                lengthInstructions = "LENGTH: approx 1200 words. 5-7 parts. Balanced pacing, moderate vocabulary complexity.";
                break;
        }
    }

    // 2. Construct Mode-Specific Prompts
    let prompt = "";
    if (input.mode === 'sleep') {
        const { texture, sound, scent, theme } = input.sleepConfig;
        prompt = `
        TASK: Create a MASTERPIECE of soothing bedtime storytelling.
        HERO: ${input.heroName || 'The Dreamer'}.
        THEME: ${theme}.
        SENSORY ANCHORS TO WEAVE IN: "${texture || 'softness'}", "${sound || 'quietness'}", "${scent || 'sweetness'}".
        
        SLEEP HYPNOSIS RULES:
        1. ZERO CONFLICT. The hero is exploring, resting, or observing beautiful, quiet things. No monsters, no scares, no tension.
        2. TONE: Dreamy, lyrical, and incredibly calm. Focus on the physical sensations of comfort (warmth, softness, floating).
        3. ${lengthInstructions}
        4. NO CHOICES. This is a linear journey to sleep. The 'choices' array in JSON should be empty for all parts.
        `;
    } else if (input.mode === 'classic') {
      prompt = `
        TASK: Write an epic adventure story for children.
        HERO: ${input.heroName || 'The Hero'}. 
        POWER: ${input.heroPower || 'boundless imagination'}. 
        SETTING: ${input.setting || 'a mysterious land'}. 
        SIDEKICK: ${input.sidekick || 'none'}. 
        PROBLEM: ${input.problem || 'a mystery to solve'}.
        
        ${lengthInstructions}
        STYLE: Heroic children's literature (like Percy Jackson or Harry Potter). 
        INTERACTIVITY: Provide 3 meaningful, distinct choices at the end of each part except the last one.
      `;
    } else {
      prompt = `
        TASK: Write a whimsical, chaotic Mad Libs style story.
        KEYWORDS TO USE: ${Object.values(input.madlibs).join(', ')}.
        
        ${lengthInstructions}
        STYLE: Silly, unexpected, high energy, and humorous. 
        INTERACTIVITY: Provide 3 funny choices for the hero at the end of parts.
      `;
    }

    prompt += `
      OUTPUT FORMAT: JSON ONLY. Do not include markdown code blocks or preamble.
      
      SCHEMA details:
      - parts: An array of objects. Each object must have:
        - text: The story segment text (string).
        - choices: Array of strings (options for the user). Empty for the final part or sleep mode.
        - partIndex: Integer (0-based index).
      - vocabWord: { word: string, definition: string } (A complex word used in the story).
      - joke: A child-friendly joke related to the story theme.
      - lesson: The moral of the story.
      - tomorrowHook: A teaser for a future adventure.
      - rewardBadge: { emoji: string, title: string, description: string }.
      
      IMPORTANT: The 'parts' array size must strictly match the requested length instructions.
    `;

    // 3. Execute with Retry Logic
    return this.retry(async () => {
        try {
            const result = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                responseSchema: {
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
                }
            }
            });

            // Robust JSON extraction
            let jsonStr = result.text || "{}";
            // Find the first '{' and last '}' to handle potential preamble/postamble
            const startIdx = jsonStr.indexOf('{');
            const endIdx = jsonStr.lastIndexOf('}');
            if (startIdx !== -1 && endIdx !== -1) {
                jsonStr = jsonStr.substring(startIdx, endIdx + 1);
            }

            const parsed = JSON.parse(jsonStr);

            // Basic Validation
            if (!parsed.parts || !Array.isArray(parsed.parts) || parsed.parts.length === 0) {
                throw new Error("Invalid story structure generated: 'parts' array is missing or empty.");
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
    try {
        return await this.retry(async () => {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
            });
            const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
            return part?.inlineData ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : null;
        }, 2, 1000);
    } catch (e) {
        console.error("Avatar Gen Error", e);
        return null;
    }
  }

  static async generateSceneIllustration(context: string, heroDescription: string): Promise<string | null> {
    const ai = this.getAI();
    const prompt = `Vibrant children's storybook scene: ${context.substring(0, 400)}. Featuring: ${heroDescription}. Whimsical, magical atmosphere.`;
    try {
         return await this.retry(async () => {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
            });
            const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
            return part?.inlineData ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : null;
         }, 2, 1000);
    } catch (e) {
        console.error("Scene Gen Error", e);
        return null;
    }
  }
}
