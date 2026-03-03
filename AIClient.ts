
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { StoryState, StoryFull, StoryPart, StoryOutline } from "./types";

export class AIClient {
  private static getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private static async retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (retries <= 0) throw error;
      if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
          throw error;
      }
      await new Promise(res => setTimeout(res, delay));
      return this.retry(fn, retries - 1, delay * 2);
    }
  }

  /**
   * Stage 1: Generate the Story Blueprint (The Outline).
   * This is fast and ensures 30-minute coherence.
   */
  static async generateOutline(input: StoryState): Promise<StoryOutline> {
    const ai = this.getAI();
    const outlineSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        chapterOutlines: { type: Type.ARRAY, items: { type: Type.STRING } },
        totalExpectedParts: { type: Type.INTEGER },
        vocabWord: {
          type: Type.OBJECT,
          properties: { word: { type: Type.STRING }, definition: { type: Type.STRING } },
          required: ["word", "definition"]
        },
        rewardBadge: {
          type: Type.OBJECT,
          properties: { emoji: { type: Type.STRING }, title: { type: Type.STRING }, description: { type: Type.STRING } },
          required: ["emoji", "title", "description"]
        }
      },
      required: ["title", "chapterOutlines", "totalExpectedParts", "vocabWord", "rewardBadge"]
    };

    const multiplier = input.storyLength === 'epic' ? 1.8 : (input.storyLength === 'eternal' ? 2.5 : 1);
    const partsCount = Math.floor(12 * multiplier);

    const systemInstruction = `You are a Lead Showrunner for a children's streaming network.
    Create a detailed ${partsCount}-chapter plot outline for a story about ${input.heroName || 'a hero'}.
    The outline must ensure a perfect narrative arc that spans 30 minutes of reading time.
    MODE: ${input.mode.toUpperCase()}. 
    ${input.mode === 'sleep' ? 'Conflict-free and hypnotic.' : 'Heroic and exciting.'}`;

    return this.retry(async () => {
      const result = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: [{ parts: [{ text: "Generate the blueprint." }] }],
        config: { 
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: outlineSchema,
        }
      });
      return JSON.parse(result.text) as StoryOutline;
    });
  }

  /**
   * Stage 2: Expand specific chapters based on the blueprint.
   * This allows us to generate thousands of words without hitting individual request limits.
   */
  static async expandChapters(outline: StoryOutline, startIdx: number, endIdx: number, input: StoryState): Promise<StoryPart[]> {
    const ai = this.getAI();
    const expansionSchema: Schema = {
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
    };

    const chaptersToGenerate = outline.chapterOutlines.slice(startIdx, endIdx + 1);
    const systemInstruction = `Expand the following chapters into high-quality, long-form narrative text. 
    Each chapter must be approximately 400-600 words long to achieve the 30-minute goal.
    STORY TITLE: ${outline.title}.
    MODE: ${input.mode}.
    CONSISTENCY: Maintain the hero's voice and setting details.
    CHAPTER OUTLINES: ${chaptersToGenerate.join(' | ')}`;

    return this.retry(async () => {
      const result = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: [{ parts: [{ text: `Expand chapters ${startIdx} to ${endIdx}.` }] }],
        config: { 
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: expansionSchema,
        }
      });
      const parts = JSON.parse(result.text) as StoryPart[];
      return parts.map(p => ({ ...p, isGenerated: true }));
    });
  }

  /**
   * Generates the finishing touches (Joke, Lesson, Hook).
   */
  static async generateFinale(outline: StoryOutline, input: StoryState): Promise<{ joke: string, lesson: string, tomorrowHook: string }> {
    const ai = this.getAI();
    return this.retry(async () => {
      const result = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: [{ parts: [{ text: `Based on the story "${outline.title}", provide a funny joke, a moral lesson, and a cliffhanger hook for tomorrow.` }] }],
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
                joke: { type: Type.STRING },
                lesson: { type: Type.STRING },
                tomorrowHook: { type: Type.STRING }
            },
            required: ["joke", "lesson", "tomorrowHook"]
          }
        }
      });
      return JSON.parse(result.text);
    });
  }

  // Added generateSceneIllustration for visual feedback
  static async generateSceneIllustration(text: string, heroName: string): Promise<string | null> {
    const ai = this.getAI();
    const prompt = `A storybook illustration for children: ${text}. Featuring hero ${heroName}. Soft pastels, magical atmosphere.`;
    return await this.retry(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "16:9", imageSize: "1K" } }
        });
        const part = response.candidates[0].content.parts.find(p => p.inlineData);
        return part ? `data:image/png;base64,${part.inlineData.data}` : null;
    });
  }

  // Added streamStory for legacy/simple usage
  static async streamStory(input: StoryState): Promise<StoryFull> {
    const outline = await this.generateOutline(input);
    const parts = await this.expandChapters(outline, 0, outline.totalExpectedParts - 1, input);
    const finale = await this.generateFinale(outline, input);
    return {
      title: outline.title,
      parts,
      vocabWord: outline.vocabWord,
      rewardBadge: outline.rewardBadge,
      joke: finale.joke,
      lesson: finale.lesson,
      tomorrowHook: finale.tomorrowHook,
      isComplete: true
    };
  }

  static async generateAvatar(heroName: string, heroPower: string): Promise<string | null> {
    const ai = this.getAI();
    const prompt = `A high-quality 3D Disney-Pixar style 4K portrait of ${heroName} with ${heroPower}. Centered composition.`;
    return await this.retry(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
        });
        const part = response.candidates[0].content.parts.find(p => p.inlineData);
        return part ? `data:image/png;base64,${part.inlineData.data}` : null;
    });
  }
}
