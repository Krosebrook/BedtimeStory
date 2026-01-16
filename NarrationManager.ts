
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Modality } from "@google/genai";

export class NarrationManager {
  private audioCtx: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private isPaused: boolean = false;
  private startTime: number = 0;
  private pausedAt: number = 0;
  private currentBuffer: AudioBuffer | null = null;
  private audioCache = new Map<string, AudioBuffer>();

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

  private decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private async decodeAudioData(data: Uint8Array): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = this.audioCtx!.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  }

  async fetchNarration(text: string): Promise<void> {
    this.init();
    
    // Check local memory cache (Production optimization: LRU/Redis equivalent)
    if (this.audioCache.has(text)) {
      this.currentBuffer = this.audioCache.get(text)!;
      this.play();
      return;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Read this story part warmly: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const bytes = this.decodeBase64(base64Audio);
        const buffer = await this.decodeAudioData(bytes);
        this.currentBuffer = buffer;
        this.audioCache.set(text, buffer);
        this.play();
      }
    } catch (error) {
      console.error("TTS failed", error);
    }
  }

  play() {
    if (!this.currentBuffer || !this.audioCtx) return;
    this.stop();

    this.source = this.audioCtx.createBufferSource();
    this.source.buffer = this.currentBuffer;
    this.source.connect(this.gainNode!);
    
    const offset = this.isPaused ? this.pausedAt : 0;
    this.source.start(0, offset);
    this.startTime = this.audioCtx.currentTime - offset;
    this.isPaused = false;

    this.source.onended = () => {
        if (!this.isPaused) {
            this.currentBuffer = null;
        }
    };
  }

  pause() {
    if (!this.source || !this.audioCtx || this.isPaused) return;
    this.pausedAt = this.audioCtx.currentTime - this.startTime;
    this.source.stop();
    this.isPaused = true;
  }

  stop() {
    if (this.source) {
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
    return Math.max(0, this.audioCtx.currentTime - this.startTime);
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
