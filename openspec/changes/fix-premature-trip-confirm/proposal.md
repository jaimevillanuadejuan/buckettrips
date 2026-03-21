# Proposal: Fix Premature Trip Confirm

## Problem

The conversation agent was jumping to `nextStep: "confirm"` — and immediately redirecting the user to the loading/generation page — on ambiguous phrases like:

- "make the calculations"
- "sounds good"
- "sure" / "ok" / "that works"

This happened even when required info (exact dates, companions, budget) was still missing. The root cause was that the system prompt only listed what was needed for confirm but didn't explicitly block ambiguous go-ahead phrases.

A related issue: when a user described dates in natural language (e.g. "first Saturday of October"), the agent would ask the user to provide the exact date themselves rather than calculating it.

## Solution

### Backend — `continueConversation` system prompt

- Add an explicit 5-item checklist that must all be satisfied before `nextStep` can be set to `"confirm"`:
  1. `destination` — resolved_region or raw_input is set
  2. `exact_start` — a real calendar date in YYYY-MM-DD format
  3. `exact_end` — a real calendar date in YYYY-MM-DD format
  4. `companions` — type is known
  5. `budget` — tier is known
- Enumerate non-confirm phrases explicitly so the LLM knows to stay on the current step
- Add a DATE CALCULATION RULE: if the user describes dates in natural language, the LLM must calculate the YYYY-MM-DD dates itself and confirm with the user ("So that would be X to Y — does that work?") rather than asking the user to provide them

### Frontend — `VoiceTripBuilder.tsx`

- Add an `isExplicitConfirm` gate: only redirect to `/new-trip/loading` when `nextStep === "confirm"` AND both dates are present AND the user utterance contains an explicit phrase like "let's go", "plan it", "build the itinerary", etc.
- This is a safety net on top of the prompt fix — defense in depth

## What does NOT change
- The conversation step flow or data model
- The `TripContext` shape
- Any UI outside of the redirect guard

## Correctness Properties
- `nextStep: "confirm"` must never trigger a redirect unless destination, exact_start, exact_end, companions, and budget are all present
- Natural language date descriptions must result in calculated YYYY-MM-DD dates confirmed with the user, not a request for the user to type them
- Ambiguous agreement phrases must keep the agent on the current step asking for the next missing field
