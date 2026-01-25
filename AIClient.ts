
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
        // Bedtime mode is now roughly 6x longer than medium classic mode.
        lengthInstructions = `
        LENGTH: Extended Slumber Edition (6x Normal Length). 
        WORD COUNT: Aim for approx 4500-5000 words total.
        STRUCTURE: Divide the story into 10-12 distinct parts to create a long, immersive journey.
        PACING: Extremely slow. Use repetitive patterns and long, flowy descriptions to induce sleep.
        `;
    } else {
        switch (input.storyLength) {
            case 'short':
                lengthInstructions = "LENGTH: approx 300 words. 3 parts.";
                break;
            case 'long':
                lengthInstructions = "LENGTH: approx 1500 words. 5-6 parts.";
                break;
            case 'medium':
            default:
                lengthInstructions = "LENGTH: approx 800 words. 3-4 parts.";
                break;
        }
    }

    let prompt = "";
    if (input.mode === 'sleep') {
        const { subMode, texture, sound, scent, theme } = input.sleepConfig;
        prompt = `
        Create an IMMERSIVE and EXTENDED soothing bedtime story.
        HERO: ${input.heroName}.
        MODE: ${subMode}. THEME: ${theme}.
        SENSORY ANCHORS: "${texture}", "${sound}", "${scent}".
        
        SLEEP RULES:
        1. NO CONFLICT. Focus on gentle exploration (e.g., drifting on a cloud, walking through a field of whispering grass).
        2. Tone: Hypnotic, repetitive, and peaceful.
        3. ${lengthInstructions}
        4. NO CHOICES. 
        `;
    } else if (input.mode === 'classic') {
      prompt = `
        Adventure story for ${input.heroName}. Power: ${input.heroPower}. 
        Setting: ${input.setting}. Sidekick: ${input.sidekick}. Problem: ${input.problem}.
        ${lengthInstructions}
        Provide 3 choices at the end of each part except the last.
      `;
    } else {
      prompt = `
        Mad Libs Story. Keywords: ${Object.values(input.madlibs).join(', ')}.
        ${lengthInstructions}
        Funny and whimsical tone. Provide choices.
      `;
    }

    prompt += `
      OUTPUT: Valid JSON. title, parts(array of {text, choices, partIndex}), vocabWord{word, definition}, joke, lesson, tomorrowHook, rewardBadge{emoji, title, description}.
      IMPORTANT: For sleep mode, parts array MUST have 10-12 items.
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
    const prompt = `Whimsical storybook portrait of ${heroName} with ${heroPower}. Square, high quality.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return part?.inlineData ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : null;
  }

  static async generateSceneIllustration(context: string, heroDescription: string): Promise<string | null> {
    const ai = this.getAI();
    const prompt = `Children's book scene: ${context.substring(0, 300)}. Hero: ${heroDescription}. Whimsical style.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return part?.inlineData ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : null;
  }
}
