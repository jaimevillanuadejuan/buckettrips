## 1. Implementation (superseded by voice-first approach)
- [x] 1.1 Replace `/new-trip` entry with conversational voice agent shell (`VoiceTripBuilder`)
- [x] 1.2 Implement phase-aware state machine: idle → listening → processing → speaking
- [x] 1.3 Capture rich preferences (companions, budget, pace, interests, exclusions, accommodation) via voice conversation
- [x] 1.4 Integrate backend `POST /api/trips/conversation` endpoint for natural language turn handling
- [x] 1.5 Integrate backend `POST /api/trips/confirm` endpoint to generate itinerary on confirm step
- [x] 1.6 Build and persist `TripContext` object in sessionStorage before navigating to loading page
- [x] 1.7 Send full `conversationHistory` with every turn so backend can extract context from any prior utterance
- [x] 1.8 Update `/new-trip/loading` to consume `TripContext` from sessionStorage

## 2. Voice Agent Fix (Web Speech API)
- [x] 2.1 Pre-load `SpeechSynthesis` voices on mount via `onvoiceschanged` and store in a ref
- [x] 2.2 Fix `speak()` to use the pre-loaded voices ref instead of calling `getVoices()` synchronously
- [x] 2.3 Fix state machine: UI transitions Listening → Processing → Speaking → Listening correctly via `phaseRef`
- [x] 2.4 Stop `SpeechRecognition` before speaking and only restart it in `utterance.onend`
- [x] 2.5 Remove the `isSpeaking` dependency from the `SpeechRecognition` `useEffect` to prevent stale closure re-registration
- [x] 2.6 Accumulate transcript across multiple `onresult` events via `accTextRef`; commit after `SILENCE_MS` of silence
- [x] 2.7 Replace mute toggle with `BsMicFill` / `BsMicMuteFill` from `react-icons`
- [x] 2.8 Center orb with processing pulse and speaking spin animation; collapse transcript to bottom toggle

## 3. Backend Conversation Intelligence
- [x] 3.1 Add `conversationHistory` field to `ConversationDto` so full history is sent each turn
- [x] 3.2 Inject full history into LLM user prompt so model can re-scan all prior turns for context clues
- [x] 3.3 Rewrite system prompt with explicit small talk handling, natural reply examples, and context extraction rules
- [x] 3.4 Add `ROBOTIC_PHRASES` blocklist — replace any robotic fallback reply with a natural greeting-aware response
- [x] 3.5 Set `OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free` for faster free-tier responses
- [x] 3.6 Reduce `OPENROUTER_TIMEOUT_MS` from 120s to 20s

## 4. Validation
- [x] 4.1 Manual happy-path voice conversation through all steps
- [x] 4.2 Verified agent speaks audibly after each user utterance
- [x] 4.3 Verified small talk (greetings) handled naturally without robotic fallback phrases
- [x] 4.4 Verified conversation history context extraction (companions mentioned early are retained later)
