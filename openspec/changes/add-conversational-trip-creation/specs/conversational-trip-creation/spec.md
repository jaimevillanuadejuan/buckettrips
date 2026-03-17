## ADDED Requirements

### Requirement: Voice-First Conversational Trip Intake
The system SHALL collect trip preferences through a voice-first conversational flow that preserves the five phases (`spark`, `context`, `depth`, `craft`, `confirm`) while presenting a single-screen voice agent UI.

#### Scenario: Human-first conversation start
- **WHEN** a user starts trip creation at `/new-trip`
- **THEN** the UI begins in a neutral listening state with no scripted greeting
- **AND** the user can start describing what they want in freeform speech

#### Scenario: Voice agent prompt cadence
- **WHEN** the user mentions a destination (city or country)
- **THEN** the voice agent responds naturally and transitions into follow-up prompts aligned to the existing workflow
- **AND** the follow-up questions are phrased conversationally like a real travel advisor

### Requirement: Always-Listening Voice Input (English Only)
The system SHALL support always-on voice input for trip intake in English.

#### Scenario: Continuous listening
- **WHEN** the user is in the trip intake UI
- **THEN** voice capture remains active by default (English only)
- **AND** the UI reflects listening vs speaking states

### Requirement: Dynamic Personalization Inputs
The system SHALL support richer personalization inputs than destination/date/theme form fields.

#### Scenario: Rich preference capture
- **WHEN** the user completes context and depth phases
- **THEN** the system captures companions, budget posture, season intent, pace, interests, exclusions, and accommodation style
- **AND** these values are persisted into a `TripContext` object

### Requirement: Backend-Assisted Conversational Intelligence
The system SHALL call backend conversational endpoints during intake.

#### Scenario: Destination intent parsing
- **WHEN** the user submits free-text destination intent
- **THEN** the frontend calls `POST /api/trips/parse-intent`
- **AND** stores resolved region and confidence in `TripContext.destination`

#### Scenario: Contextual follow-up generation
- **WHEN** the user reaches craft phase
- **THEN** the frontend calls `POST /api/trips/contextual-questions`
- **AND** presents 2-3 contextual follow-up prompts

### Requirement: Voice Mode Visual Design
The system SHALL render a ChatGPT Voice Mode-style UI to represent listening and speaking states.

#### Scenario: Listening state visuals
- **WHEN** the agent is listening
- **THEN** the circular voice orb shows a static, solid fill using `--color-background-first`

#### Scenario: Speaking state visuals
- **WHEN** the agent is speaking
- **THEN** the circular voice orb uses `--color-background-first` with an animated inner texture or motion effect
- **AND** the motion is smooth and continuous

### Requirement: Conversational Confirm-To-Itinerary Generation
The system SHALL generate itinerary output from conversational context via backend confirm endpoint.

#### Scenario: Confirm and generate
- **WHEN** the user confirms exact dates and submits phase 5
- **THEN** the frontend calls `POST /api/trips/confirm` with `TripContext`
- **AND** `/new-trip/loading` renders the returned itinerary

#### Scenario: Follow-up refinement
- **WHEN** the user submits follow-up answers after first itinerary draft
- **THEN** the frontend calls `POST /api/trips/confirm` again with prior context plus `followUpAnswers`
- **AND** renders an updated itinerary
