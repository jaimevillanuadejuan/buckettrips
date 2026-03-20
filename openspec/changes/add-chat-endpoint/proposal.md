# Proposal: Add Chat + Refine Endpoints

## Problem
The frontend chat UI (`ChatView`, `TripRefinementChat`) needs dedicated backend endpoints for:
1. General conversational travel chat — not tied to the structured trip intake flow
2. Itinerary refinement — modifying an existing generated itinerary via natural language

The existing `continueConversation` endpoint is tightly coupled to the step-based intake state machine and is not suitable for free-form chat or post-generation refinement.

## Solution
Add two new endpoints to the trips controller:

- `POST /trips/chat` — free-form travel chat, returns a natural language reply
- `POST /trips/refine` — takes an existing itinerary + user message, returns an updated itinerary + confirmation reply

Both use Groq `llama-3.3-70b-versatile` with full conversation history injected into the prompt.

## Impact
- Enables `ChatView` in the new trip flow
- Enables `TripRefinementChat` on the itinerary and my-trips detail views
- No changes to existing `continueConversation` or `confirmTrip` endpoints
