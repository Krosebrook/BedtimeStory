
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { AmbientTheme } from './types';

class SoundManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  
  // Ambient Sound Nodes
  private ambientGain: GainNode | null = null;
  private ambientSource: AudioBufferSourceNode | null = null;
  private secondarySource: AudioBufferSourceNode | null = null;
  private isAmbientPlaying: boolean = false;
  private activeLFOs: OscillatorNode[] = [];

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100 });
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.ambientGain && this.ctx) {
        this.ambientGain.gain.setTargetAtTime(muted ? 0 : 0.06, this.ctx.currentTime, 0.5);
    }
  }

  private createNoiseBuffer(type: 'white' | 'pink' | 'brown'): AudioBuffer {
      const bufferSize = 2 * this.ctx!.sampleRate;
      const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
      const output = buffer.getChannelData(0);

      if (type === 'white') {
          for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
      } else if (type === 'pink') {
          let b0, b1, b2, b3, b4, b5, b6;
          b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
          for (let i = 0; i < bufferSize; i++) {
              const white = Math.random() * 2 - 1;
              b0 = 0.99886 * b0 + white * 0.0555179;
              b1 = 0.99332 * b1 + white * 0.0750759;
              b2 = 0.96900 * b2 + white * 0.1538520;
              b3 = 0.86650 * b3 + white * 0.3104856;
              b4 = 0.55000 * b4 + white * 0.5329522;
              b5 = -0.7616 * b5 - white * 0.0168980;
              output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
              output[i] *= 0.11;
              b6 = white * 0.115926;
          }
      } else if (type === 'brown') {
          let lastOut = 0;
          for (let i = 0; i < bufferSize; i++) {
              const white = Math.random() * 2 - 1;
              output[i] = (lastOut + (0.02 * white)) / 1.02;
              lastOut = output[i];
              output[i] *= 3.5;
          }
      }
      return buffer;
  }

  playAmbient(mode: AmbientTheme) {
      this.init();
      if (this.muted || mode === 'auto') {
          this.stopAmbient();
          return;
      }

      if (this.isAmbientPlaying) {
          this.stopAmbient();
      }

      this.ambientGain = this.ctx!.createGain();
      this.ambientGain.gain.value = 0;
      this.ambientGain.connect(this.ctx!.destination);

      switch(mode) {
          case 'space': // Cosmic Hum
              this.setupCosmicHum();
              break;
          case 'rain': // Gentle Rain
              this.setupGentleRain();
              break;
          case 'forest': // Forest Night
              this.setupForestNight();
              break;
          case 'magic': // Ethereal
              this.setupEthereal();
              break;
          case 'ocean': // Midnight Ocean
              this.setupMidnightOcean();
              break;
          case 'crickets': // Summer Night
              this.setupSummerNight();
              break;
      }

      this.isAmbientPlaying = true;
      this.ambientGain.gain.linearRampToValueAtTime(0.06, this.ctx!.currentTime + 4);
  }

  private setupCosmicHum() {
      const buffer = this.createNoiseBuffer('brown');
      this.ambientSource = this.ctx!.createBufferSource();
      this.ambientSource.buffer = buffer;
      this.ambientSource.loop = true;

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 70;

      const lfo = this.ctx!.createOscillator();
      lfo.frequency.value = 0.02;
      const lfoGain = this.ctx!.createGain();
      lfoGain.gain.value = 40;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      this.activeLFOs.push(lfo);

      this.ambientSource.connect(filter);
      filter.connect(this.ambientGain!);
      this.ambientSource.start();
  }

  private setupGentleRain() {
      const rainBuffer = this.createNoiseBuffer('pink');
      this.ambientSource = this.ctx!.createBufferSource();
      this.ambientSource.buffer = rainBuffer;
      this.ambientSource.loop = true;

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2000;

      // Patter layer
      const patterBuffer = this.createNoiseBuffer('white');
      this.secondarySource = this.ctx!.createBufferSource();
      this.secondarySource.buffer = patterBuffer;
      this.secondarySource.loop = true;
      
      const patterFilter = this.ctx!.createBiquadFilter();
      patterFilter.type = 'bandpass';
      patterFilter.frequency.value = 2500;
      patterFilter.Q.value = 0.5;

      const patterGain = this.ctx!.createGain();
      const lfo = this.ctx!.createOscillator();
      lfo.frequency.value = 0.5;
      const lfoGain = this.ctx!.createGain();
      lfoGain.gain.value = 0.02;
      lfo.connect(lfoGain);
      lfoGain.connect(patterGain.gain);
      lfo.start();
      this.activeLFOs.push(lfo);

      this.ambientSource.connect(filter);
      filter.connect(this.ambientGain!);
      this.secondarySource.connect(patterFilter);
      patterFilter.connect(patterGain);
      patterGain.connect(this.ambientGain!);
      
      this.ambientSource.start();
      this.secondarySource.start();
  }

  private setupForestNight() {
      const windBuffer = this.createNoiseBuffer('pink');
      this.ambientSource = this.ctx!.createBufferSource();
      this.ambientSource.buffer = windBuffer;
      this.ambientSource.loop = true;

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1500;

      const lfo = this.ctx!.createOscillator();
      lfo.frequency.value = 0.1;
      const lfoGain = this.ctx!.createGain();
      lfoGain.gain.value = 800;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      this.activeLFOs.push(lfo);

      this.ambientSource.connect(filter);
      filter.connect(this.ambientGain!);
      this.ambientSource.start();
  }

  private setupMidnightOcean() {
      const buffer = this.createNoiseBuffer('brown');
      this.ambientSource = this.ctx!.createBufferSource();
      this.ambientSource.buffer = buffer;
      this.ambientSource.loop = true;

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;

      const surgeGain = this.ctx!.createGain();
      const lfo = this.ctx!.createOscillator();
      lfo.frequency.value = 0.12; // slow waves
      const lfoGain = this.ctx!.createGain();
      lfoGain.gain.value = 0.04;
      lfo.connect(lfoGain);
      lfoGain.connect(surgeGain.gain);
      lfo.start();
      this.activeLFOs.push(lfo);

      this.ambientSource.connect(filter);
      filter.connect(surgeGain);
      surgeGain.connect(this.ambientGain!);
      this.ambientSource.start();
  }

  private setupSummerNight() {
      const buffer = this.createNoiseBuffer('pink');
      this.ambientSource = this.ctx!.createBufferSource();
      this.ambientSource.buffer = buffer;
      this.ambientSource.loop = true;

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;

      this.ambientSource.connect(filter);
      filter.connect(this.ambientGain!);
      this.ambientSource.start();

      // Procedural Cricket Chirps
      const chirpOsc = this.ctx!.createOscillator();
      chirpOsc.type = 'sine';
      chirpOsc.frequency.value = 4500;
      
      const chirpGain = this.ctx!.createGain();
      chirpGain.gain.value = 0;

      const mod = this.ctx!.createOscillator();
      mod.type = 'square';
      mod.frequency.value = 25; // chirp rate
      const modGain = this.ctx!.createGain();
      modGain.gain.value = 0.01;
      mod.connect(modGain);
      modGain.connect(chirpGain.gain);
      mod.start();
      this.activeLFOs.push(mod);

      // Slower rhythm for the chirps
      const rhythm = this.ctx!.createOscillator();
      rhythm.type = 'sine';
      rhythm.frequency.value = 0.4;
      const rhythmGain = this.ctx!.createGain();
      rhythmGain.gain.value = 0.01;
      rhythm.connect(rhythmGain);
      rhythmGain.connect(chirpGain.gain);
      rhythm.start();
      this.activeLFOs.push(rhythm);

      chirpOsc.connect(chirpGain);
      chirpGain.connect(this.ambientGain!);
      chirpOsc.start();
  }

  private setupEthereal() {
      const buffer = this.createNoiseBuffer('white');
      this.ambientSource = this.ctx!.createBufferSource();
      this.ambientSource.buffer = buffer;
      this.ambientSource.loop = true;

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2000;
      filter.Q.value = 20;

      const lfo = this.ctx!.createOscillator();
      lfo.frequency.value = 0.15;
      const lfoGain = this.ctx!.createGain();
      lfoGain.gain.value = 1000;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      this.activeLFOs.push(lfo);

      this.ambientSource.connect(filter);
      filter.connect(this.ambientGain!);
      this.ambientSource.start();
  }

  stopAmbient() {
      if (this.ambientSource && this.ambientGain && this.ctx) {
          const now = this.ctx.currentTime;
          this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
          this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, now + 2);
          
          const sources = [this.ambientSource, this.secondarySource];
          const lfos = [...this.activeLFOs];
          this.activeLFOs = [];

          setTimeout(() => {
              sources.forEach(s => { if (s) try { s.stop(); } catch(e) {} });
              lfos.forEach(l => { if (l) try { l.stop(); } catch(e) {} });
          }, 2100);
          
          this.ambientSource = null;
          this.secondarySource = null;
          this.ambientGain = null;
          this.isAmbientPlaying = false;
      }
  }

  playChoice() {
    if (this.muted) return;
    this.init();
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx!.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, this.ctx!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    osc.start();
    osc.stop(this.ctx!.currentTime + 0.1);
  }

  playPageTurn() {
    if (this.muted) return;
    this.init();
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, this.ctx!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx!.currentTime + 0.3);
    gain.gain.setValueAtTime(0.1, this.ctx!.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx!.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    osc.start();
    osc.stop(this.ctx!.currentTime + 0.3);
  }

  playSparkle() {
    if (this.muted) return;
    this.init();
    const now = this.ctx!.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.1);
      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.4);
    });
  }

  playDelete() {
    if (this.muted) return;
    this.init();
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx!.currentTime);
    osc.frequency.linearRampToValueAtTime(50, this.ctx!.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, this.ctx!.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    osc.start();
    osc.stop(this.ctx!.currentTime + 0.2);
  }
}

export const soundManager = new SoundManager();
