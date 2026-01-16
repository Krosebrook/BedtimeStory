
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
    
    let prompt = "";
    if (input.mode === 'classic') {
      prompt = `
        Create a warm, imaginative bedtime story for a child aged 6-10.
        HERO: ${input.heroName}, POWER: ${input.heroPower}, WORLD: ${input.setting}, COMPANION: ${input.sidekick}, CONFLICT: ${input.problem}
        STRICT ARCHITECTURE: 3 parts, 3 choices per transition. Tone: "Storybook Magic".
      `;
    } else {
      const { adjective, place, food, sillyWord, animal, feeling } = input.madlibs;
      prompt = `
        CREATE A "MAD LIBS" MASTERPIECE. 
        KEYWORDS: 
        - Adjective: ${adjective}
        - Place: ${place}
        - Favorite Food: ${food}
        - Silly Word: ${sillyWord}
        - Animal: ${animal}
        - Feeling: ${feeling}

        STORY REQUIREMENTS:
        1. This must be a LONG, epic journey (aim for a 5-10 minute reading duration, approx 1200 words total).
        2. Divide the story into 3 chunky parts. 
        3. The tone should be hilarious yet cozy.
        4. Use the Silly Word frequently as a magic incantation or the name of a legendary item.
        5. The climax must involve the ${food} in a surprising way.
        6. Provide exactly 3 choices at the end of Part 1 and 2.
      `;
    }

    prompt += `
      OUTPUT: Valid JSON matching this schema:
      title (string), 
      parts (array of {text, choices, partIndex}), 
      vocabWord ({word, definition}), 
      joke (string), 
      lesson (string), 
      tomorrowHook (string).
      No markdown backticks.
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

  static async generateAvatar(heroName: string, heroPower: string): Promise<string | null> {
    const ai = this.getAI();
    const prompt = `Whimsical portrait of ${heroName} with power of ${heroPower}. Storybook style, 1K resolution.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return part?.inlineData ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : null;
  }
}
