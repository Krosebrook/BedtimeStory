/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StoryState, StoryFull } from "./types";

export class AIClient {
  private static async retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (retries <= 0) throw error;
      
      // Don't retry on 400 client errors (like invalid API key), except 429 (Too Many Requests)
      if (error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
      }

      console.warn(`API Call failed, retrying in ${delay}ms...`, error);
      await new Promise(res => setTimeout(res, delay));
      return this.retry(fn, retries - 1, delay * 2);
    }
  }

  static async streamStory(input: StoryState): Promise<StoryFull> {
    return this.retry(async () => {
      const response = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const error = new Error(errorData.error || `HTTP ${response.status}`);
        (error as any).status = response.status;
        throw error;
      }

      const data = await response.json();
      
      // Validation
      if (!data.parts || !Array.isArray(data.parts) || data.parts.length === 0) {
        throw new Error("Invalid story structure: 'parts' array is missing or empty.");
      }

      return data as StoryFull;
    });
  }

  static async generateAvatar(heroName: string, heroPower: string): Promise<string | null> {
    return await this.retry(async () => {
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'avatar', heroName, heroPower }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const error = new Error(errorData.error || `HTTP ${response.status}`);
        (error as any).status = response.status;
        throw error;
      }

      const data = await response.json();
      
      if (!data.mimeType || !data.base64) {
        throw new Error("No image data received from API");
      }
      
      return `data:${data.mimeType};base64,${data.base64}`;
    }, 2, 1000);
  }

  static async generateSceneIllustration(context: string, heroDescription: string): Promise<string | null> {
    return await this.retry(async () => {
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'scene', context, heroDescription }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const error = new Error(errorData.error || `HTTP ${response.status}`);
        (error as any).status = response.status;
        throw error;
      }

      const data = await response.json();
      
      if (!data.mimeType || !data.base64) {
        throw new Error("No image data received from API");
      }
      
      return `data:${data.mimeType};base64,${data.base64}`;
     }, 2, 1000);
  }
}
