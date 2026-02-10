
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

  static async streamStory(input: StoryState): Promise<StoryFull> {
    const ai = this.getAI();
    
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

    let prompt = "";
    if (input.mode === 'sleep') {
        const { texture, sound, scent, theme } = input.sleepConfig;
        prompt = `
        Create a MASTERPIECE of soothing bedtime storytelling.
        HERO: ${input.heroName}.
        THEME: ${theme}.
        SENSORY ANCHORS TO WEAVE IN: "${texture || 'softness'}", "${sound || 'quietness'}", "${scent || 'sweetness'}".
        
        SLEEP HYPNOSIS RULES:
        1. ZERO CONFLICT. The hero is exploring, resting, or observing beautiful, quiet things.
        2. Tone: Dreamy, lyrical, and incredibly calm. Focus on the physical sensations of comfort.
        3. ${lengthInstructions}
        4. NO CHOICES. This is a linear journey to sleep.
        `;
    } else if (input.mode === 'classic') {
      prompt = `
        Epic adventure for ${input.heroName}. Power: ${input.heroPower}. 
        Setting: ${input.setting}. Sidekick: ${input.sidekick || 'none'}. Problem: ${input.problem || 'a mystery'}.
        ${lengthInstructions}
        Style: Heroic children's literature. Provide 3 meaningful choices at the end of each part except the last one.
      `;
    } else {
      prompt = `
        Whimsical Mad Libs Story. Keywords: ${Object.values(input.madlibs).join(', ')}.
        ${lengthInstructions}
        Style: Silly, unexpected, and high energy. Provide 3 choices for the hero.
      `;
    }

    prompt += `
      OUTPUT FORMAT: JSON ONLY. 
      SCHEMA: title (string), parts (array of {text (string, long segments), choices (array of string or empty), partIndex (integer)}), vocabWord {word, definition}, joke, lesson, tomorrowHook, rewardBadge {emoji, title, description}.
      IMPORTANT: The 'parts' array size must match the requested length instructions.
    `;

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

    return JSON.parse(result.text) as StoryFull;
  }

  static async generateAvatar(heroName: string, heroPower: string): Promise<string | null> {
    const ai = this.getAI();
    const prompt = `A professional children's book illustration portrait of ${heroName} who has the power of ${heroPower}. High-contrast, friendly, vibrant style. Close-up on the hero's face.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return part?.inlineData ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : null;
  }

  static async generateSceneIllustration(context: string, heroDescription: string): Promise<string | null> {
    const ai = this.getAI();
    const prompt = `Vibrant children's storybook scene: ${context.substring(0, 400)}. Featuring: ${heroDescription}. Whimsical, magical atmosphere.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return part?.inlineData ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : null;
  }
}
