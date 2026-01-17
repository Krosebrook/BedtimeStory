
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Modality } from "@google/genai";
import { storageManager } from "./lib/StorageManager";

/**
 * Singleton class managing Text-to-Speech generation and playback.
 * Handles Web Audio API context, buffer management, and playback rate control.
 */
export class NarrationManager {
  private audioCtx: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  
  // Playback State
  private isPaused: boolean = false;
  /** Timestamp when playback started (adjusted for pauses/speed changes). */
  private startTime: number = 0;
  /** Offset in seconds where playback was paused. */
  private pausedAt: number = 0;
  
  // Data
  private currentBuffer: AudioBuffer | null = null;
  /** In-memory cache for fast switching within session. */
  private memoryCache = new Map<string, AudioBuffer>();
  private playbackRate: number = 1.0;
  
  /** Callback triggered when audio finishes playing naturally. */
  public onEnded: (() => void) | null = null;

  /**
   * Initializes the AudioContext. Must be called after user interaction.
   */
  private init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Sets the playback speed.
   */
  setRate(rate: number) {
    if (this.playbackRate === rate) return;

    if (this.source && !this.isPaused && this.audioCtx) {
        const now = this.audioCtx.currentTime;
        const currentAudioTime = (now - this.startTime) * this.playbackRate;
        this.startTime = now - (currentAudioTime / rate);
        this.source.playbackRate.value = rate;
    }

    this.playbackRate = rate;
  }

  getRate(): number {
    return this.playbackRate;
  }

  /**
   * Helper to decode Base64 string to Uint8Array.
   */
  private decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Helper to decode raw PCM/Audio data into an AudioBuffer.
   */
  private async decodeAudioData(data: ArrayBuffer): Promise<AudioBuffer> {
    // Note: If using raw PCM from Gemini, we construct it manually. 
    // If saving/loading ArrayBuffer from IDB, it is the same raw bytes.
    // The previous implementation assumed Gemini output was Int16 PCM at 24kHz.
    
    // We clone the buffer because creating a typed array might detach it if we aren't careful, 
    // or if we need to reuse the source buffer.
    const dataInt16 = new Int16Array(data.slice(0));
    
    // Ensure Context exists
    if (!this.audioCtx) this.init();
    
    const buffer = this.audioCtx!.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    // Convert Int16 PCM to Float32 [-1.0, 1.0]
    for (let i = 0; i < dataInt16.length; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  }

  /**
   * Fetches TTS audio from Gemini API or retrieves from persistent cache.
   * Automatically starts playback upon success.
   * 
   * @param text - The text to narrate.
   * @param voiceName - The specific voice capability to use.
   */
  async fetchNarration(text: string, voiceName: string = 'Kore'): Promise<void> {
    this.init();
    
    // Create a cache key that includes the voice
    const cacheKey = `${voiceName}:${text.substring(0, 50)}_${text.length}`; // Simplified hash key
    
    // 1. Check in-memory cache
    if (this.memoryCache.has(cacheKey)) {
      this.currentBuffer = this.memoryCache.get(cacheKey)!;
      this.play();
      return;
    }

    // 2. Check offline storage (IndexedDB)
    try {
        const cachedAudio = await storageManager.getAudio(cacheKey);
        if (cachedAudio) {
            console.log("Playing from offline cache");
            const buffer = await this.decodeAudioData(cachedAudio);
            this.memoryCache.set(cacheKey, buffer);
            this.currentBuffer = buffer;
            this.play();
            return;
        }
    } catch (e) {
        console.warn("Offline audio cache miss/error", e);
    }

    // 3. Fetch from API
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const bytes = this.decodeBase64(base64Audio);
        
        // Save to offline storage asynchronously
        storageManager.saveAudio(cacheKey, bytes.buffer).catch(err => console.error("Failed to save audio", err));
        
        const buffer = await this.decodeAudioData(bytes.buffer);
        this.memoryCache.set(cacheKey, buffer);
        this.currentBuffer = buffer;
        this.play();
      }
    } catch (error) {
      console.error("TTS failed", error);
    }
  }

  /**
   * Starts playback of the current buffer.
   */
  play() {
    if (!this.currentBuffer || !this.audioCtx) return;
    this.stop(); // Stop any existing source

    this.source = this.audioCtx.createBufferSource();
    this.source.buffer = this.currentBuffer;
    this.source.playbackRate.value = this.playbackRate;
    this.source.connect(this.gainNode!);
    
    const offset = this.isPaused ? this.pausedAt : 0;
    this.source.start(0, offset);
    
    this.startTime = this.audioCtx.currentTime - (offset / this.playbackRate);
    this.isPaused = false;

    this.source.onended = () => {
        if (!this.isPaused) {
            if (this.onEnded) this.onEnded();
        }
    };
  }

  pause() {
    if (!this.source || !this.audioCtx || this.isPaused) return;
    this.pausedAt = (this.audioCtx.currentTime - this.startTime) * this.playbackRate;
    this.source.stop();
    this.isPaused = true;
  }

  stop() {
    if (this.source) {
      this.source.onended = null;
      this.source.stop();
      this.source = null;
    }
    this.isPaused = false;
    this.pausedAt = 0;
    this.startTime = 0;
  }

  getCurrentTime(): number {
    if (!this.audioCtx || !this.startTime) return 0;
    if (this.isPaused) return this.pausedAt;
    return Math.max(0, (this.audioCtx.currentTime - this.startTime) * this.playbackRate);
  }

  getDuration(): number {
    return this.currentBuffer?.duration || 0;
  }

  get state() {
      return {
          isPlaying: !!this.source && !this.isPaused,
          isPaused: this.isPaused,
          hasBuffer: !!this.currentBuffer,
          currentTime: this.getCurrentTime(),
          duration: this.getDuration()
      };
  }
}

export const narrationManager = new NarrationManager();
