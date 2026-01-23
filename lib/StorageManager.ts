
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { StoryFull } from '../types';

const DB_NAME = 'BedtimeChroniclesDB';
const STORE_NAME_STORIES = 'stories';
const STORE_NAME_AUDIO = 'audio';
const DB_VERSION = 3; // Incremented for new audio store

export interface CachedStory {
  id: string;
  timestamp: number;
  story: StoryFull;
  avatar?: string;
  // Map of partIndex to base64 image string
  scenes?: Record<number, string>;
  feedback?: {
      rating: number;
      text: string;
      timestamp: number;
  };
}

/**
 * StorageManager
 * Handles persistence of AI-generated content to IndexedDB for offline reading.
 */
class StorageManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME_STORIES)) {
          db.createObjectStore(STORE_NAME_STORIES, { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains(STORE_NAME_AUDIO)) {
            // Simple key-value store for audio buffers (key: text_hash+voice, value: ArrayBuffer)
            db.createObjectStore(STORE_NAME_AUDIO);
        }
      };
    });
  }

  // --- Stories ---

  async saveStory(story: StoryFull, avatar?: string): Promise<string> {
    await this.init();
    const id = crypto.randomUUID();
    const entry: CachedStory = {
      id,
      timestamp: Date.now(),
      story,
      avatar,
      scenes: {}
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME_STORIES], 'readwrite');
      const store = transaction.objectStore(STORE_NAME_STORIES);
      const request = store.add(entry);
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async saveStoryScene(id: string, partIndex: number, image: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME_STORIES], 'readwrite');
      const store = transaction.objectStore(STORE_NAME_STORIES);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const data = getReq.result as CachedStory;
        if (data) {
          if (!data.scenes) data.scenes = {};
          data.scenes[partIndex] = image;
          
          const putReq = store.put(data);
          putReq.onsuccess = () => resolve();
          putReq.onerror = () => reject(putReq.error);
        } else {
          reject(new Error("Story not found for scene update"));
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async updateFeedback(id: string, rating: number, text: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME_STORIES], 'readwrite');
        const store = transaction.objectStore(STORE_NAME_STORIES);
        
        const getReq = store.get(id);
        getReq.onsuccess = () => {
            const data = getReq.result as CachedStory;
            if (data) {
                data.feedback = { rating, text, timestamp: Date.now() };
                const putReq = store.put(data);
                putReq.onsuccess = () => resolve();
                putReq.onerror = () => reject(putReq.error);
            } else {
                reject(new Error("Story not found"));
            }
        };
        getReq.onerror = () => reject(getReq.error);
    });
  }

  async getAllStories(): Promise<CachedStory[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME_STORIES], 'readonly');
      const store = transaction.objectStore(STORE_NAME_STORIES);
      const request = store.getAll();
      request.onsuccess = () => {
        // Sort by newest first
        const results = (request.result as CachedStory[]).sort((a, b) => b.timestamp - a.timestamp);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteStory(id: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME_STORIES], 'readwrite');
      const store = transaction.objectStore(STORE_NAME_STORIES);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- Audio ---

  async saveAudio(key: string, data: ArrayBuffer): Promise<void> {
      await this.init();
      return new Promise((resolve, reject) => {
          const transaction = this.db!.transaction([STORE_NAME_AUDIO], 'readwrite');
          const store = transaction.objectStore(STORE_NAME_AUDIO);
          const request = store.put(data, key);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
      });
  }

  async getAudio(key: string): Promise<ArrayBuffer | undefined> {
      await this.init();
      return new Promise((resolve, reject) => {
          const transaction = this.db!.transaction([STORE_NAME_AUDIO], 'readonly');
          const store = transaction.objectStore(STORE_NAME_AUDIO);
          const request = store.get(key);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
      });
  }
}

export const storageManager = new StorageManager();
