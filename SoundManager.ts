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
      this.ambientGain.gain.linearRampToValueAtTime(0.08, this.ctx!.currentTime + 4);
  }

  private createPanner(): StereoPannerNode | null {
      if (this.ctx && 'createStereoPanner' in this.ctx) {
          return this.ctx.createStereoPanner();
      }
      return null;
  }

  private setupCosmicHum() {
      // Deep Rumble
      const buffer = this.createNoiseBuffer('brown');
      this.ambientSource = this.ctx!.createBufferSource();
      this.ambientSource.buffer = buffer;
      this.ambientSource.loop = true;

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 80;

      // Drone Layers (Detuned Sines for 'beating' effect)
      const drone1 = this.ctx!.createOscillator();
      drone1.type = 'sine';
      drone1.frequency.value = 55; // A1
      const droneGain1 = this.ctx!.createGain();
      droneGain1.gain.value = 0.03;

      const drone2 = this.ctx!.createOscillator();
      drone2.type = 'sine';
      drone2.frequency.value = 55.5; // Slightly detuned
      const droneGain2 = this.ctx!.createGain();
      droneGain2.gain.value = 0.03;

      // Filter modulation LFO
      const lfo = this.ctx!.createOscillator();
      lfo.frequency.value = 0.05;
      const lfoGain = this.ctx!.createGain();
      lfoGain.gain.value = 20;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      this.activeLFOs.push(lfo);

      // Add Stereo Panning for the Drones to create space
      const panner = this.createPanner();
      if (panner) {
          const panLfo = this.ctx!.createOscillator();
          panLfo.frequency.value = 0.1; // Slow rotation
          const panGain = this.ctx!.createGain();
          panGain.gain.value = 0.5;
          panLfo.connect(panGain);
          panGain.connect(panner.pan);
          panLfo.start();
          this.activeLFOs.push(panLfo);

          drone1.connect(droneGain1);
          drone2.connect(droneGain2);
          droneGain1.connect(panner);
          droneGain2.connect(panner);
          panner.connect(this.ambientGain!);
      } else {
          drone1.connect(droneGain1);
          droneGain1.connect(this.ambientGain!);
          drone2.connect(droneGain2);
          droneGain2.connect(this.ambientGain!);
      }

      this.ambientSource.connect(filter);
      filter.connect(this.ambientGain!);

      drone1.start();
      this.activeLFOs.push(drone1);

      drone2.start();
      this.activeLFOs.push(drone2);
      
      this.ambientSource.start();
  }

  private setupGentleRain() {
      const rainBuffer = this.createNoiseBuffer('pink');
      this.ambientSource = this.ctx!.createBufferSource();
      this.ambientSource.buffer = rainBuffer;
      this.ambientSource.loop = true;

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;

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
      lfo.frequency.value = 0.3; // Slower modulation
      const lfoGain = this.ctx!.createGain();
      lfoGain.gain.value = 0.02;
      lfo.connect(lfoGain);
      lfoGain.connect(patterGain.gain);
      lfo.start();
      this.activeLFOs.push(lfo);

      this.ambientSource.connect(filter);
      filter.connect(this.ambientGain!);
      
      // Pan the patter slightly for width
      const panner = this.createPanner();
      if (panner) {
          const panLfo = this.ctx!.createOscillator();
          panLfo.frequency.value = 0.2;
          panLfo.connect(panner.pan);
          panLfo.start();
          this.activeLFOs.push(panLfo);
          
          this.secondarySource.connect(patterFilter);
          patterFilter.connect(patterGain);
          patterGain.connect(panner);
          panner.connect(this.ambientGain!);
      } else {
          this.secondarySource.connect(patterFilter);
          patterFilter.connect(patterGain);
          patterGain.connect(this.ambientGain!);
      }
      
      this.ambientSource.start();
      this.secondarySource.start();
  }

  private setupForestNight() {
      // Wind base (Pink Noise)
      const windBuffer = this.createNoiseBuffer('pink');
      this.ambientSource = this.ctx!.createBufferSource();
      this.ambientSource.buffer = windBuffer;
      this.ambientSource.loop = true;

      const windFilter = this.ctx!.createBiquadFilter();
      windFilter.type = 'lowpass';
      windFilter.frequency.value = 400;

      // Rustling Leaves (Pink Noise, High-passed)
      const leafBuffer = this.createNoiseBuffer('pink');
      this.secondarySource = this.ctx!.createBufferSource();
      this.secondarySource.buffer = leafBuffer;
      this.secondarySource.loop = true;

      const leafFilter = this.ctx!.createBiquadFilter();
      leafFilter.type = 'highpass';
      leafFilter.frequency.value = 2500;
      
      const leafGain = this.ctx!.createGain();
      leafGain.gain.value = 0.04;

      // LFO for wind swelling
      const lfo = this.ctx!.createOscillator();
      lfo.frequency.value = 0.15; // Slightly faster wind
      const lfoGain = this.ctx!.createGain();
      lfoGain.gain.value = 200;
      lfo.connect(lfoGain);
      lfoGain.connect(windFilter.frequency);
      lfo.start();
      this.activeLFOs.push(lfo);

      // Modulation for leaves
      const leafLfo = this.ctx!.createOscillator();
      leafLfo.frequency.value = 0.08;
      const leafLfoGain = this.ctx!.createGain();
      leafLfoGain.gain.value = 0.01;
      leafLfo.connect(leafLfoGain);
      leafLfoGain.connect(leafGain.gain);
      leafLfo.start();
      this.activeLFOs.push(leafLfo);

      this.ambientSource.connect(windFilter);
      windFilter.connect(this.ambientGain!);

      // Pan the leaves
      const panner = this.createPanner();
      if (panner) {
          const panLfo = this.ctx!.createOscillator();
          panLfo.frequency.value = 0.05;
          const panAmp = this.ctx!.createGain();
          panAmp.gain.value = 0.6;
          panLfo.connect(panAmp);
          panAmp.connect(panner.pan);
          panLfo.start();
          this.activeLFOs.push(panLfo);
          
          this.secondarySource.connect(leafFilter);
          leafFilter.connect(leafGain);
          leafGain.connect(panner);
          panner.connect(this.ambientGain!);
      } else {
          this.secondarySource.connect(leafFilter);
          leafFilter.connect(leafGain);
          leafGain.connect(this.ambientGain!);
      }

      this.ambientSource.start();
      this.secondarySource.start();
  }

  private setupMidnightOcean() {
     // Deep Waves (Brown Noise)
      const waveBuffer = this.createNoiseBuffer('brown');
      this.ambientSource = this.ctx!.createBufferSource();
      this.ambientSource.buffer = waveBuffer;
      this.ambientSource.loop = true;

      const waveFilter = this.ctx!.createBiquadFilter();
      waveFilter.type = 'lowpass';
      waveFilter.frequency.value = 350;

      const waveGain = this.ctx!.createGain();
      waveGain.gain.value = 1;

      // Spray/Foam (Pink Noise)
      const sprayBuffer = this.createNoiseBuffer('pink');
      this.secondarySource = this.ctx!.createBufferSource();
      this.secondarySource.buffer = sprayBuffer;
      this.secondarySource.loop = true;

      const sprayFilter = this.ctx!.createBiquadFilter();
      sprayFilter.type = 'highpass';
      sprayFilter.frequency.value = 2000;
      
      const sprayGain = this.ctx!.createGain();
      sprayGain.gain.value = 0; // Starts silent, modulated by wave

      // Master LFO for the wave cycle (approx 10 seconds)
      const waveLfo = this.ctx!.createOscillator();
      waveLfo.frequency.value = 0.1; 
      
      // Modulate Wave Volume
      const waveLfoGain = this.ctx!.createGain();
      waveLfoGain.gain.value = 0.3; // +/- 0.3 gain
      waveLfo.connect(waveLfoGain);
      waveLfoGain.connect(waveGain.gain);

      // Modulate Spray Volume (sync'd)
      const sprayLfoGain = this.ctx!.createGain();
      sprayLfoGain.gain.value = 0.03;
      waveLfo.connect(sprayLfoGain);
      sprayLfoGain.connect(sprayGain.gain);

      waveLfo.start();
      this.activeLFOs.push(waveLfo);

      // Pan the ocean movement
      const panner = this.createPanner();
      if (panner) {
          const panLfo = this.ctx!.createOscillator();
          panLfo.frequency.value = 0.05; // Slow roll
          panLfo.connect(panner.pan);
          panLfo.start();
          this.activeLFOs.push(panLfo);
          
          this.ambientSource.connect(waveFilter);
          waveFilter.connect(waveGain);
          waveGain.connect(panner);

          this.secondarySource.connect(sprayFilter);
          sprayFilter.connect(sprayGain);
          sprayGain.connect(panner);
          
          panner.connect(this.ambientGain!);
      } else {
          this.ambientSource.connect(waveFilter);
          waveFilter.connect(waveGain);
          waveGain.connect(this.ambientGain!);

          this.secondarySource.connect(sprayFilter);
          sprayFilter.connect(sprayGain);
          sprayGain.connect(this.ambientGain!);
      }

      this.ambientSource.start();
      this.secondarySource.start();
  }

  private setupSummerNight() {
      const buffer = this.createNoiseBuffer('pink');
      this.ambientSource = this.ctx!.createBufferSource();
      this.ambientSource.buffer = buffer;
      this.ambientSource.loop = true;

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 600;

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
      modGain.gain.value = 0.02;
      mod.connect(modGain);
      modGain.connect(chirpGain.gain);
      mod.start();
      this.activeLFOs.push(mod);

      // Slower rhythm for the chirps
      const rhythm = this.ctx!.createOscillator();
      rhythm.type = 'sine';
      rhythm.frequency.value = 0.4;
      const rhythmGain = this.ctx!.createGain();
      rhythmGain.gain.value = 0.02;
      rhythm.connect(rhythmGain);
      rhythmGain.connect(chirpGain.gain);
      rhythm.start();
      this.activeLFOs.push(rhythm);

      chirpOsc.connect(chirpGain);
      chirpGain.connect(this.ambientGain!);
      chirpOsc.start();
      this.activeLFOs.push(chirpOsc);
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
          this.ambientGain.gain.cancelScheduledValues(now);
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