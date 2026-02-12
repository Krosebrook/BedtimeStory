
# Infinity Heroes: Bedtime Chronicles 📖✨

Infinity Heroes is an interactive, AI-driven bedtime story application designed for children aged 7-9. It combines high-fidelity narrative generation via Google Gemini 3 Pro with procedural ambient soundscapes and high-quality Text-to-Speech to create a soothing, immersive sleep experience.

## 🚀 Key Features
- **Studio-Quality Design**: Immersive "Infinity Studio" aesthetic with 3D-layered kinetic typography, dynamic ambient backgrounds, and glassmorphism.
- **Three Creative Modes**: 
    - **Classic Adventure**: Decision-based hero journeys with customizable settings and powers.
    - **Mad Libs**: High-energy, chaos-driven stories based on user-provided words.
    - **Sleep Mode**: 6x longer, conflict-free, hypnotic narratives with procedural ambient audio. Now features **"Dream Pick"** (instant start) and **"Parent's Path"** (sensory customization) sub-modes.
- **Voice Selector**: Choose from 7 distinct AI narrator personalities (e.g., *Kore* for soothing, *Puck* for playful, *Charon* for deep voices).
- **Cinematic Loading**: Engaging `LoadingFX` system that keeps children entertained with mode-specific visuals while the AI generates content.
- **Resilient AI Client**: Implements exponential backoff retry logic and robust JSON extraction to ensure story generation succeeds even with transient API issues.
- **Procedural Soundscapes**: Real-time synthesized audio (Rain, Forest, Cosmic Hum) using the Web Audio API.
- **Offline First**: 
    - Full IndexedDB persistence for reading stories and listening to audio without an internet connection.
    - **Visual Indicators**: "Offline Ready" badges in the Memory Jar confirm when stories are safe for travel/flight mode.
- **Memory Jar**: Save stories as JSON files or share them via the native share sheet.
- **Child-Safe UI**: High-contrast comic aesthetic, rounded touch targets, and zero dark patterns.

## 🛠 Tech Stack
- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **AI Backend**: @google/genai (Gemini 3 Pro & 2.5 Flash)
- **Audio**: Web Audio API + Gemini TTS
- **Persistence**: IndexedDB (custom StorageManager)
- **PWA**: Service Worker for caching and asset management

## 📦 Installation
1. Ensure `process.env.API_KEY` is configured with a valid Google AI Studio key.
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

## 🤝 Contribution Guidelines
Please refer to `ARCHITECTURE.md` for the internal data flow and `CHILD_SAFETY_COMPLIANCE.md` for UX guardrails.
