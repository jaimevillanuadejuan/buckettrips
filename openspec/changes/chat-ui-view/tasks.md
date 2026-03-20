## Status: Implemented

## 1. Frontend

- [x] 1.1 Create `ChatView.tsx` — contextual intro, quick-action cards, message list, typing indicator, input bar with voice + text
- [x] 1.2 Add `viewMode` state (`"voice" | "chat"`) + `viewModeRef` to `VoiceTripBuilder`
- [x] 1.3 Add pill toggle button to `VoiceTripBuilder` UI
- [x] 1.4 Gate voice recognition by `viewModeRef` — recognition only runs in voice mode
- [x] 1.5 `ChatView` manages its own independent conversation history via `historyRef`
- [x] 1.6 `ChatView` has its own `SpeechRecognition` instance with 2500ms silence window
- [x] 1.7 Render `ChatView` when `viewMode === "chat"`, voice orb when `viewMode === "voice"`

## 2. Backend

- [x] 2.1 Add `POST /trips/chat` endpoint to `trips.controller.ts`
- [x] 2.2 Add `ChatDto` with `message: string` and optional `history` array
- [x] 2.3 Implement `chat()` method in `TripConversationService` — calls Groq `llama-3.3-70b-versatile`, injects full history, returns `{ reply: string }`

## 3. Validation

- [x] 3.1 Toggle between voice and chat views — each has independent state
- [x] 3.2 Quick action cards send message and disappear correctly
- [x] 3.3 Typing indicator shows while processing
- [x] 3.4 Auto-scroll works on new messages
- [x] 3.5 Voice input works from chat view independently
- [x] 3.6 All colors from `globals.css` variables — no orange, no arbitrary hex outside design system
