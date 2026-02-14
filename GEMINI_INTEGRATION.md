# Gemini API Integration Strategy

Infinity Heroes leverages the Gemini API suite through server-side Vercel serverless functions to ensure API keys are never exposed to the browser.

## 🔒 Security Architecture

All Gemini API calls are made **exclusively** via Vercel serverless `/api` routes. API keys never run in the browser.

**Client-side** → Calls `/api/story`, `/api/image`, `/api/tts`  
**Server-side** → Routes call Gemini API with `process.env.GEMINI_API_KEY`

## 🤖 Model Selection
| Task | Model | Endpoint | Reasoning |
| :--- | :--- | :--- | :--- |
| **Narrative Generation** | `gemini-3-pro-preview` | `/api/story` | Superior reasoning for logic-heavy Mad Libs and long-form hypnotic sleep prose. |
| **Asset Generation** | `gemini-2.5-flash-image` | `/api/image` | High-speed generation of character avatars and scene illustrations. |
| **Narration (TTS)** | `gemini-2.5-flash-preview-tts` | `/api/tts` | Native multimodal audio output with high emotional resonance. |

## 📝 Prompting Strategy
Prompts are structured using **Instructional Constraints** rather than just prose:
- **Sleep Hypnosis Rules**: Instructions to use sensory "anchors" (texture, scent) and zero-conflict narratives.
- **Structure**: Enforced JSON schema using the `responseSchema` config to ensure 100% parse success.
- **Pacing**: Variable length instructions based on `storyLength` (Short, Medium, Long, Eternal).

## 🔊 Text-to-Speech (TTS) Implementation
- **PCM Handling**: The API returns a Base64 string of raw 16-bit PCM data. 
- **Decoding**: We avoid `decodeAudioData` (which expects file headers like .wav) and instead manually map bytes to a Float32 array for the Web Audio API.
- **Voice Selection**: Dynamic mapping of user-friendly names (e.g., "Zephyr") to prebuilt voice IDs (e.g., `Zephyr`).

## 🛡️ Rate Limiting & CORS
- In-memory rate limiting (30 requests/min per IP by default, configurable via `RATE_LIMIT_PER_MIN`)
- CORS origin configurable via `ALLOWED_ORIGIN` environment variable
- All endpoints include proper error handling and standard response formats
