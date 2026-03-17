# Proposal: Conversational Trip Creation Flow

## Why
The current trip creation path is form-first (`destination -> dates -> theme`), which creates friction and does not capture richer intent.

## What Changes
- Replace the current 3-step trip intake flow with a one-question-at-a-time conversational UI.
- Implement 5 phases (`spark`, `context`, `depth`, `craft`, `confirm`) in a single `ConversationShell` page.
- Add specialized inputs for conversational questions (free text, chips, spectrum, dual-axis sliders, multi-select interests/exclusions, accommodation style cards).
- Call backend conversational endpoints during flow:
  - `POST /api/trips/parse-intent`
  - `POST /api/trips/contextual-questions`
  - `GET /api/accommodations/style-filter`
  - `POST /api/trips/confirm`
- Persist a `TripContext` object in browser session storage and hand it off to `/new-trip/loading` for itinerary generation.
- Update loading flow to support conversational context and iterative follow-up refinements via backend `confirm` endpoint.

## Impact
- Trip creation becomes identity-first and more personalized.
- Destination/theme/date decisions become outputs of conversation, not initial form fields.
- Existing itinerary rendering stays reusable while input quality improves.
