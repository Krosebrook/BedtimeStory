
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { StoryFull } from '../types';

const DB_NAME = 'BedtimeChroniclesDB';
const STORE_NAME = 'stories';
const DB_VERSION = 1;

export interface CachedStory {
  id: string;
  timestamp: number;
  story: StoryFull;
  avatar?: string;
}

/**
 * StorageManager
 * Handles persistence of AI-generated content to IndexedDB for offline reading.
 */
class StorageManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  async saveStory(story: StoryFull, avatar?: string): Promise<string> {
    if (!this.db) await this.init();
    const id = crypto.randomUUID();
    const entry: CachedStory = {
      id,
      timestamp: Date.now(),
      story,
      avatar
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(entry);
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllStories(): Promise<CachedStory[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
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
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const storageManager = new StorageManager();
