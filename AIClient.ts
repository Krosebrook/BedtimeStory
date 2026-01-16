
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Type } from "@google/genai";
import { StoryState, StoryFull } from "./types";

/**
 * AIClient
 * 
 * Handles all direct communication with Google Gemini models.
 * Uses gemini-3-pro-preview for complex reasoning/storytelling
 * and gemini-2.5-flash-image for high-performance creative visuals.
 */
export class AIClient {
  private static getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  /**
   * Generates a branching interactive story with educational components.
   * Forces a strict 3-part structure with 3 choices per transition.
   */
  static async streamStory(input: StoryState): Promise<StoryFull> {
    const ai = this.getAI();
    const prompt = `
      Create a warm, imaginative bedtime story for a child aged 6-10.
      
      HERO: ${input.heroName}
      SUPERPOWER: ${input.heroPower}
      WORLD: ${input.setting}
      COMPANION: ${input.sidekick}
      CONFLICT: ${input.problem}

      STRICT ARCHITECTURE RULES:
      1. Structure exactly 3 segments: [Introduction/Inciting Incident], [The Choice & The Journey], [The Climax & Cozy Resolution].
      2. Decision Points: At the end of Part 1 and Part 2, provide exactly 3 distinct, whimsical choices for the hero.
      3. Tone: "Storybook Magic" - warm, descriptive, and gentle.
      4. Educational: Include one "Vocabulary Mastery" word that fits the context naturally.
      5. Closure: End with a moral lesson and a cliffhanger hook for "tomorrow night".

      OUTPUT: Valid JSON matching the schema provided. No markdown backticks.
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
              properties: { 
                word: { type: Type.STRING }, 
                definition: { type: Type.STRING } 
              },
              required: ["word", "definition"]
            },
            joke: { type: Type.STRING },
            lesson: { type: Type.STRING },
            tomorrowHook: { type: Type.STRING }
          },
          required: ["title", "parts", "vocabWord", "joke", "lesson", "tomorrowHook"]
        }
      }
    });

    const text = result.text;
    if (!text) throw new Error("AI returned empty content");
    return JSON.parse(text) as StoryFull;
  }

  /**
   * Generates a 1K storybook-style hero portrait.
   */
  static async generateAvatar(heroName: string, heroPower: string): Promise<string | null> {
    const ai = this.getAI();
    const prompt = `Whimsical, friendly storybook illustration of a child hero named ${heroName} who has the superpower of ${heroPower}. Soft cinematic lighting, watercolor and ink style, high quality 1K resolution. No text in image.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
    });

    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (part?.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    return null;
  }
}
