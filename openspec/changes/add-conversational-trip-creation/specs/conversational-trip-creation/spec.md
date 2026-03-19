## Implemented: Voice-First Conversational Trip Intake

### Overview
The trip creation flow was replaced with a voice-first conversational agent UI (`VoiceTripBuilder`). The user speaks naturally to a voice agent that collects all trip preferences through conversation, then generates a full itinerary via the backend.

---

### Requirement: Voice Agent State Machine
The system SHALL manage voice interaction through a single `Phase` state machine.

#### States
- `idle` — mic on, not yet listening
- `listening` — `SpeechRecognition` active, accumulating transcript
- `processing` — utterance committed, API request in-flight
- `speaking` — agent reply being spoken via `SpeechSynthesis`

#### Scenario: Full turn cycle
- **WHEN** the user stops speaking (3s silence window elapses with no new transcript)
- **THEN** the UI transitions from `listening` → `processing`
- **WHEN** the backend returns an `agentReply`
- **THEN** the UI transitions from `processing` → `speaking`
- **WHEN** the utterance ends
- **THEN** the UI transitions from `speaking` → `idle` → `listening`

---

### Requirement: Continuous Listening with Silence Detection
The system SHALL use `continuous: true` SpeechRecognition and commit the transcript after `SILENCE_MS` (3000ms) of no new audio.

#### Scenario: Transcript accumulation
- **WHEN** the user speaks across multiple recognition segments
- **THEN** all final transcript segments are accumulated in `accTextRef`
- **AND** the silence timer resets on every new result
- **WHEN** silence elapses
- **THEN** the full accumulated text is committed as a single utterance

---

### Requirement: Natural Conversation with Full History Context
The system SHALL send the full conversation history with every turn so the backend LLM can extract context clues from any prior utterance.

#### Scenario: Context extraction across turns
- **WHEN** the user mentions companions in turn 1 ("I want to go with friends")
- **AND** asks about destination in turn 3
- **THEN** the backend extracts `companions.type=friends_small` from history
- **AND** does not ask about companions again

#### Scenario: Small talk handling
- **WHEN** the user greets the agent ("hey how's it going")
- **THEN** the agent responds warmly and naturally
- **AND** pivots to trip planning in the same reply
- **AND** never returns robotic phrases like "I hit a snag" or "I apologize"

---

### Requirement: TripContext Persistence
The system SHALL build and persist a `TripContext` object throughout the conversation.

#### Fields captured
- `destination` — raw input + resolved region + confidence
- `duration` — min/max days
- `companions` — type + count + children flag
- `budget` — tier
- `travel_dates` — season + moods + exact start/end dates
- `pace` — activity level + spontaneity
- `interests` — from allowed enum list
- `exclusions` — from allowed enum list
- `accommodation` — style + tier
- `contextual_answers` — free-form follow-up answers

#### Scenario: Confirm and navigate
- **WHEN** `nextStep === "confirm"` and exact dates are present
- **THEN** `TripContext` is written to `sessionStorage`
- **AND** the user is navigated to `/new-trip/loading`

---

### Requirement: Voice Mode Visual Design
The system SHALL render a centered orb UI reflecting the current phase.

#### Scenario: Listening state
- Orb is static, solid fill using `--color-background-first`
- Orb scale pulses with live audio level from `AnalyserNode`

#### Scenario: Speaking state
- Orb shows a conic-gradient spin animation (`spin 5s linear infinite`)

#### Scenario: Processing state
- Orb shows a white pulse overlay (`animate-pulse`)

#### Scenario: Transcript
- Collapsed by default at the bottom of the screen
- Toggle shows last 10 turns (agent + user lines)

---

### Requirement: Mic Control
The system SHALL provide a mic toggle button using `BsMicFill` / `BsMicMuteFill` from `react-icons`.

- Mic on → active fill style using `--color-background-first`
- Mic off → muted style, recognition aborted, synthesis cancelled
- Re-enabling mic restarts listening after 150ms debounce

---

### Requirement: Text Fallback
The system SHALL render a text input form when `SpeechRecognition` is not available in the browser.
