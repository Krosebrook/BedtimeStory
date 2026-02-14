/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { storageManager } from "./lib/StorageManager";

/**
 * Singleton class managing Text-to-Speech generation and playback.
 * Handles Web Audio API context, buffer management, and playback rate control.
 * Strictly adheres to raw PCM 24kHz Mono decoding for Gemini TTS output.
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
   * Helper to decode Base64 string to Uint8Array manually as per guidelines.
   */
  private decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Helper to decode raw PCM bytes into an AudioBuffer.
   * Gemini returns raw 16-bit PCM at 24000Hz.
   */
  private async decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number = 24000,
    numChannels: number = 1
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  /**
   * Fetches TTS audio from API endpoint or retrieves from persistent cache.
   * @param text The text to read.
   * @param voiceName The voice profile to use.
   * @param autoPlay If true, starts playback immediately after loading. If false, just caches.
   */
  async fetchNarration(text: string, voiceName: string = 'Kore', autoPlay: boolean = true): Promise<void> {
    this.init();
    
    // Create a cache key that includes the voice and text snippet
    const cacheKey = `v1:${voiceName}:${text.substring(0, 30)}_${text.length}`;
    
    // 1. Check in-memory cache
    if (this.memoryCache.has(cacheKey)) {
      this.currentBuffer = this.memoryCache.get(cacheKey)!;
      if (autoPlay) this.play();
      return;
    }

    // 2. Check persistent IndexedDB cache (Offline support)
    try {
        const cachedAudio = await storageManager.getAudio(cacheKey);
        if (cachedAudio) {
            const bytes = new Uint8Array(cachedAudio);
            const buffer = await this.decodeAudioData(bytes, this.audioCtx!);
            this.memoryCache.set(cacheKey, buffer);
            this.currentBuffer = buffer;
            if (autoPlay) this.play();
            return;
        }
    } catch (e) {
        console.warn("Offline audio cache miss", e);
    }

    // 3. Fetch from API endpoint
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceName }),
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`);
      }

      const data = await response.json();
      const bytes = this.decode(data.base64);
      
      // Persist for offline use
      storageManager.saveAudio(cacheKey, bytes.buffer).catch(err => console.error("Save audio failed", err));
      
      const buffer = await this.decodeAudioData(bytes, this.audioCtx!);
      this.memoryCache.set(cacheKey, buffer);
      this.currentBuffer = buffer;
      if (autoPlay) this.play();
    } catch (error) {
      console.error("TTS synthesis failed", error);
    }
  }

  /**
   * Starts or resumes playback of the current buffer.
   */
  play() {
    if (!this.currentBuffer || !this.audioCtx) return;
    this.stop(); // Clear any active source

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
            this.stop();
        }
    };
  }

  /**
   * Pauses the current narration, tracking the position for resume.
   */
  pause() {
    if (!this.source || !this.audioCtx || this.isPaused) return;
    this.pausedAt = (this.audioCtx.currentTime - this.startTime) * this.playbackRate;
    this.source.stop();
    this.isPaused = true;
  }

  /**
   * Completely stops narration and resets positions.
   */
  stop() {
    if (this.source) {
      this.source.onended = null;
      try { this.source.stop(); } catch (e) {}
      this.source = null;
    }
    if (!this.isPaused) {
        this.pausedAt = 0;
        this.startTime = 0;
    }
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
