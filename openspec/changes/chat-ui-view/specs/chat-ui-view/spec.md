# Chat UI View

## Overview
A chat UI mode was added to the trip creation flow as an alternative to the voice orb. The user toggles between voice and chat via a pill toggle at the top of `VoiceTripBuilder`. Chat mode has its own independent conversation state — it does not share transcript or recognition state with voice mode. It calls `POST /trips/chat` directly.

---

## Requirement: View Toggle
The system SHALL provide a pill toggle between voice orb view and chat view within `VoiceTripBuilder`.

### Scenario: Toggle from voice to chat
- **WHEN** the user clicks "Chat" on the toggle pill
- **THEN** the voice orb UI is replaced by the full chat UI
- **AND** voice recognition is stopped and gated by `viewModeRef`

### Scenario: Toggle from chat to voice
- **WHEN** the user clicks "Voice" on the toggle pill
- **THEN** the chat UI is replaced by the voice orb UI
- **AND** chat conversation state is independent and unaffected

---

## Requirement: Contextual Intro Message
The system SHALL display a contextual intro message at the top of the chat view when no messages have been exchanged yet.

### Scenario: User has a previous saved trip
- **WHEN** the chat view opens and `lastTripDestination` is provided
- **THEN** the intro references that destination naturally

### Scenario: No previous trip
- **WHEN** no prior trip context exists
- **THEN** the intro is warm and open-ended

---

## Requirement: Quick Action Cards
The system SHALL display a 2-column grid of quick-action cards below the intro when no messages have been sent yet.

### Cards
- 🏖️ Beach getaway
- 🏔️ Mountain adventure
- 🏛️ Cultural city trip
- 🌿 Off-grid nature escape
- 👫 Trip with friends
- ✈️ Surprise me

### Scenario: User taps a card
- **WHEN** the user clicks a quick-action card
- **THEN** the card's value is sent as a user message via `sendMessage`
- **AND** the cards and intro disappear

---

## Requirement: Chat Message Display
The system SHALL render conversation messages in a scrollable list with auto-scroll on each new turn.

### Message bubbles
- Agent messages: left-aligned, `rgba(12,45,72,0.08)` background, `var(--foreground)` text
- User messages: right-aligned, `var(--color-background-third)` background, white text
- Typing indicator: three-dot bounce animation in an agent bubble while `isProcessing`

---

## Requirement: Input Bar
The system SHALL render a fixed input bar at the bottom of the chat view.

### Elements
- Audio wave button (left) — triggers voice input via `SpeechRecognition`
  - Active: `var(--color-background-third)` background, animated bars
  - Listening state replaces the form with a full-width listening indicator + Stop button
- Text input (center) — rounded pill, `rgba(12,45,72,0.06)` background, `rgba(12,45,72,0.14)` border
- Send button (right) — `var(--color-background-third)` background, white arrow icon

### Voice in chat mode
- Uses its own `SpeechRecognition` instance with `continuous: true` and 2500ms silence window
- Accumulated transcript committed via `stopListening` → `sendMessage`
- Completely independent from voice mode recognition state

---

## Requirement: Backend Endpoint
The system SHALL call `POST /trips/chat` for all chat messages.

### Request
```json
{ "message": "string", "history": [{ "role": "user|agent", "text": "string" }] }
```

### Response
```json
{ "reply": "string" }
```

---

## Colors (all from globals.css)
| Usage | Value |
|---|---|
| Agent bubble bg | `rgba(12,45,72,0.08)` |
| User bubble bg | `var(--color-background-third)` = `#145da0` |
| Input bg | `rgba(12,45,72,0.06)` |
| Input border | `rgba(12,45,72,0.14)` |
| Send / wave button | `var(--color-background-third)` |
| Quick action bg | `rgba(12,45,72,0.07)` |
| Quick action border | `rgba(12,45,72,0.13)` |
| Text | `var(--foreground)` = `#0c2d48` |
