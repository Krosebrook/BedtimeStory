
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
            lengthInstructions = `
            LENGTH: Short & Punchy. 
            WORD COUNT: Aim for approx 300 words total across all parts.
            PACING: Fast and active.
            COMPLEXITY: Simple, direct narrative focusing on a single magical moment or lesson.
            `;
            break;
        case 'long':
            lengthInstructions = `
            LENGTH: Epic Saga. 
            WORD COUNT: Aim for approx 1500-2000 words total. 
            PACING: Deliberate and rich. Take time to describe sounds, textures, and internal character thoughts.
            COMPLEXITY: High. Intricate world-building and character growth.
            `;
            break;
        case 'medium':
        default:
            lengthInstructions = `
            LENGTH: Standard Storybook. 
            WORD COUNT: Aim for approx 800 words total.
            PACING: Balanced.
            COMPLEXITY: Moderate. Room for imagination while keeping the plot clear.
            `;
            break;
    }

    let sequelInstructions = "";
    if (input.sequelContext) {
        sequelInstructions = `
        SEQUEL MODE ACTIVE:
        This story is a direct sequel to a previous adventure titled "${input.sequelContext.lastTitle}".
        
        Previous Context/Cliffhanger: "${input.sequelContext.lastHook}".
        Previous Lesson: "${input.sequelContext.lastLesson || ''}".
        
        Requirements:
        1. Acknowledge the events of the previous story briefly in the intro.
        2. Maintain strict character continuity for ${input.heroName}.
        3. Present a NEW adventure/conflict (do not retell the old one).
        `;
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
        ${sequelInstructions}
        
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
        ${sequelInstructions}
        STRICT ARCHITECTURE: 3 parts. 
        IMPORTANT: Provide exactly 3 or 4 distinct choices at the end of Part 1 and Part 2.
        
        CHOICE GUIDELINES (Ensure variety): 
        - Choices must represent distinct paths (e.g., Brave Action, Clever Trick, Kind Word, or Wild Idea).
        - They should feel like they genuinely impact the narrative direction.
        
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
        4. Provide exactly 3 or 4 distinct choices at the end of Part 1 and 2.
      `;
    }

    prompt += `
      OUTPUT: Valid JSON matching this schema:
      title (string), 
      parts (array of {text, choices, partIndex}), 
      vocabWord ({word, definition}), 
      joke (string), 
      lesson (string), 
      tomorrowHook (string),
      rewardBadge ({emoji, title, description}).
      No markdown backticks.
      IMPORTANT: For sleep mode, 'choices' array must be empty or null.
      rewardBadge should be a fun achievement based on the story content (e.g. "Golden Feather").
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
                properties: {
                    emoji: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING }
                },
                required: ["emoji", "title", "description"]
            }
          },
          required: ["title", "parts", "vocabWord", "joke", "lesson", "tomorrowHook", "rewardBadge"]
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

  /**
   * Generates a scene illustration for a story part.
   * 
   * @param context - Text description of the scene.
   * @param heroDescription - visual cues for the hero to maintain consistency.
   * @returns Base64 string of the image or null.
   */
  static async generateSceneIllustration(context: string, heroDescription: string): Promise<string | null> {
    const ai = this.getAI();
    const prompt = `
      Children's book illustration.
      Scene Action: ${context.substring(0, 400)}...
      Character: ${heroDescription}.
      Style: Whimsical, soft colors, storybook, 1K resolution.
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return part?.inlineData ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : null;
  }
}
