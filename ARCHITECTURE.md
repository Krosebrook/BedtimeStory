# System Architecture

Infinity Heroes is built as a modular "Fat Client" SPA to minimize server-side dependencies and maximize privacy/offline performance.

## 1. The Story Engine (`useStoryEngine.ts`)
The central orchestrator of the application state. It manages:
- **Phase Control**: Transitions between `setup`, `reading`, and `finished`.
- **Input Management**: Deep state tracking for Hero, Setting, and Sleep Configs.
- **Async Orchestration**: Coordinates AI generation, Image caching, and Persistence.

## 2. Persistence Layer (`StorageManager.ts`)
Uses IndexedDB via the browser's native API (no external wrappers) for high-performance binary storage:
- **`stories` store**: Stores structured JSON story data and Base64 scene imagery.
- **`audio` store**: Caches raw PCM audio buffers from the TTS engine.
- **Versioning**: Currently at v3 to support schema changes for "Sleep Mode" sensory anchors.

## 3. Audio Synthesis Engine (`SoundManager.ts`)
Utilizes a procedural approach instead of static MP3 loops to save bandwidth and provide infinite variety.
- **Noise Generation**: Procedural Brown/Pink noise for nature sounds.
- **LFO Modulation**: Low-frequency oscillators drive filter cutoffs to create "breathing" wind and wave effects.
- **Polyphony**: Supports simultaneous playback of ambient soundscapes and voice narration.

## 4. Narration & Sync (`NarrationManager.ts` & `SyncedText.tsx`)
- **Raw PCM Decoding**: Manually decodes Gemini's 24kHz Mono output to a standard AudioBuffer.
- **Time Polling**: `useNarrationSync` uses `requestAnimationFrame` to poll `audioCtx.currentTime`, ensuring word-level highlighting matches the voice precisely.
