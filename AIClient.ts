
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Type } from "@google/genai";
import { StoryState, StoryFull, StoryLength } from "./types";

/**
 * Service class for interacting with the Google Gemini API.
 * Handles story generation (streaming/JSON) and avatar image generation.
 */
export class AIClient {
  private static getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  /**
   * Generates a complete structured story based on user input.
   * Uses `gemini-3-pro-preview` with `responseSchema` to ensure strict JSON output.
   * 
   * @param input - The user's story configuration (mode, characters, madlibs).
   * @returns A Promise resolving to a strongly-typed `StoryFull` object.
   */
  static async streamStory(input: StoryState): Promise<StoryFull> {
    const ai = this.getAI();
    
    let lengthInstructions = "";
    switch (input.storyLength) {
        case 'short':
            lengthInstructions = "Length: Short and concise (approx 300 words total). Keep the plot simple.";
            break;
        case 'long':
            lengthInstructions = "Length: Epic and detailed (approx 1200 words total). Focus on rich descriptions and character development.";
            break;
        case 'medium':
        default:
            lengthInstructions = "Length: Standard storybook length (approx 600-800 words total).";
            break;
    }

    let prompt = "";
    // Construct prompt based on mode
    if (input.mode === 'sleep') {
        const { subMode, texture, sound, scent, theme } = input.sleepConfig;
        
        let sleepContext = "";
        const userSetting = input.setting ? `SETTING: ${input.setting}` : "SETTING: Create a soft, dreamy cloud or nature environment.";

        if (subMode === 'child-friendly') {
            sleepContext = `
            MODE: Child Friendly / Simple.
            THEME: ${theme}.
            Requirements: Use very simple vocabulary. Focus purely on the visual beauty of the ${theme}.
            `;
        } else if (subMode === 'parent-madlib') {
            sleepContext = `
            MODE: Guided Sensory (Parent's Touch).
            ${userSetting}
            CRITICAL INSTRUCTIONS: You MUST weave the following sensory details into the narrative to ground the child:
            - A Gentle Sound: "${sound}"
            - A Soft Texture: "${texture}"
            - A Comforting Scent: "${scent}"
            `;
        } else {
            // Automatic
            sleepContext = `
            MODE: Automatic.
            ${userSetting}
            Requirements: Create a completely original, surprising yet soothing environment.
            `;
        }

        prompt = `
        Create a VERY soothing, linear bedtime story designed to help a child fall asleep.
        HERO: ${input.heroName}.
        ${sleepContext}
        
        GENERAL SLEEP RULES:
        1. No conflicts, no scares, just gentle exploration and relaxation.
        2. Tone: Extremely calm, whisper-soft, repetitive, and hypnotic.
        3. Structure: 3 parts that flow seamlessly into each other.
        4. NO CHOICES. The child should just listen.
        5. ${lengthInstructions}
        `;
    } else if (input.mode === 'classic') {
      prompt = `
        Create a warm, imaginative bedtime story for a child aged 6-10.
        HERO: ${input.heroName}, POWER: ${input.heroPower}, WORLD: ${input.setting}, COMPANION: ${input.sidekick}, CONFLICT: ${input.problem}
        STRICT ARCHITECTURE: 3 parts. 
        IMPORTANT: Provide exactly 3 or 4 distinct choices at the end of Part 1 and Part 2.
        
        CHOICE GUIDELINES (Ensure variety): 
        - Choices must represent distinct paths (e.g., Brave Action, Clever Trick, Kind Word, or Wild Idea).
        - They should feel like they genuinely impact the narrative direction.
        - Encourage branching possibilities.
        
        Tone: "Storybook Magic".
        ${lengthInstructions}
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
        1. ${lengthInstructions}
        2. Divide the story into 3 chunky parts. 
        3. The tone should be hilarious yet cozy.
        4. Use the Silly Word frequently as a magic incantation or the name of a legendary item.
        5. The climax must involve the ${food} in a surprising way.
        6. Provide exactly 3 or 4 distinct choices at the end of Part 1 and 2. Make them silly, specific, and absurd!
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
      IMPORTANT: For sleep mode, 'choices' array must be empty or null.
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

  /**
   * Generates a square character avatar using `gemini-2.5-flash-image`.
   * 
   * @param heroName - Name of the character.
   * @param heroPower - Visual description or power.
   * @returns Base64 string of the image or null.
   */
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
