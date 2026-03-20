# Proposal: Chat UI View

## Problem
The voice orb is the only way to interact with the trip planning agent. Users who prefer typing, are in a quiet environment, or whose browser doesn't support the Web Speech API have no good alternative.

## Solution
Add a chat UI mode that replaces the voice orb view with a full conversational chat display — contextual intro, quick-action cards, scrollable message bubbles, and a text input bar with mic toggle. Both modes share the same conversation state and backend endpoint.

## Scope
- Frontend only (`buckettrips` repo)
- New component: `ChatView.tsx`
- Modified component: `VoiceTripBuilder.tsx` — add view toggle, render `ChatView` when in chat mode
- No backend changes required

## Out of scope
- Separate route or page
- Persisting view preference across sessions
- Backend changes
