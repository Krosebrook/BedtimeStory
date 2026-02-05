
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

class SoundManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  
  // Ambient Sound Nodes
  private ambientGain: GainNode | null = null;
  private ambientSource: AudioBufferSourceNode | null = null;
  private isAmbientPlaying: boolean = false;

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
    if (this.ambientGain) {
        // Smoothly fade out or in ambient
        this.ambientGain.gain.setTargetAtTime(muted ? 0 : 0.05, this.ctx!.currentTime, 0.5);
    }
  }

  // --- Ambient Sound Engine (Procedural) ---

  /**
   * Generates a noise buffer.
   * Type: 'white', 'pink', or 'brown'
   */
  private createNoiseBuffer(type: 'white' | 'pink' | 'brown'): AudioBuffer {
      const bufferSize = 2 * this.ctx!.sampleRate; // 2 seconds loop
      const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
      const output = buffer.getChannelData(0);

      if (type === 'white') {
          for (let i = 0; i < bufferSize; i++) {
              output[i] = Math.random() * 2 - 1;
          }
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
              output[i] *= 0.11; // (roughly) compensate for gain
              b6 = white * 0.115926;
          }
      } else if (type === 'brown') {
          let lastOut = 0;
          for (let i = 0; i < bufferSize; i++) {
              const white = Math.random() * 2 - 1;
              output[i] = (lastOut + (0.02 * white)) / 1.02;
              lastOut = output[i];
              output[i] *= 3.5; // (roughly) compensate for gain
          }
      }
      return buffer;
  }

  playAmbient(mode: 'space' | 'rain' | 'forest' | 'magic') {
      this.init();
      if (this.muted) return;

      // Stop existing if different mode, or if already playing just return
      if (this.isAmbientPlaying) {
          this.stopAmbient();
      }

      let noiseType: 'brown' | 'pink' | 'white' = 'pink';
      let filterFreq = 1000;
      let filterType: BiquadFilterType = 'lowpass';
      let q = 1;
      let modulationFreq = 0.1;
      let modulationDepth = 200;

      // Configure based on theme
      switch(mode) {
          case 'space': // Cosmic Hum
              noiseType = 'brown';
              filterFreq = 150;
              modulationFreq = 0.05;
              modulationDepth = 50;
              break;
          case 'rain': // Gentle Rain
              noiseType = 'pink';
              filterFreq = 1200;
              filterType = 'bandpass';
              q = 0.5;
              modulationFreq = 0.5;
              modulationDepth = 400;
              break;
          case 'forest': // Forest Ambiance (wind + leaves)
              noiseType = 'pink';
              filterFreq = 2500;
              filterType = 'lowpass';
              modulationFreq = 0.2;
              modulationDepth = 1000;
              break;
          case 'magic': // Ethereal
              noiseType = 'white';
              filterFreq = 1500;
              filterType = 'bandpass';
              q = 12; // Resonant
              modulationFreq = 0.15;
              modulationDepth = 500;
              break;
      }

      const buffer = this.createNoiseBuffer(noiseType);
      
      this.ambientSource = this.ctx!.createBufferSource();
      this.ambientSource.buffer = buffer;
      this.ambientSource.loop = true;

      // Create filter to shape the noise
      const filter = this.ctx!.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.value = filterFreq;
      filter.Q.value = q;

      // LFO for movement (makes it feel organic)
      const lfo = this.ctx!.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = modulationFreq; 
      const lfoGain = this.ctx!.createGain();
      lfoGain.gain.value = modulationDepth;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();

      this.ambientGain = this.ctx!.createGain();
      this.ambientGain.gain.value = 0; // Start silent for fade in
      
      this.ambientSource.connect(filter);
      filter.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx!.destination);

      this.ambientSource.start();
      this.isAmbientPlaying = true;

      // Fade in
      this.ambientGain.gain.linearRampToValueAtTime(0.04, this.ctx!.currentTime + 3);
  }

  stopAmbient() {
      if (this.ambientSource && this.ambientGain) {
          // Fade out
          const now = this.ctx!.currentTime;
          this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
          this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
          
          const oldSource = this.ambientSource;
          setTimeout(() => {
              try { oldSource.stop(); } catch(e) {}
          }, 1600);
          
          this.ambientSource = null;
          this.ambientGain = null;
          this.isAmbientPlaying = false;
      }
  }


  // --- SFX ---

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
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
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
