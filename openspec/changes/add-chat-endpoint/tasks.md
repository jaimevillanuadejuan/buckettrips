## Status: Implemented

## 1. Chat endpoint

- [x] 1.1 Add `ChatDto` — `message: string`, optional `history: Array<{ role, text }>`
- [x] 1.2 Implement `chat()` in `TripConversationService` — system prompt for free-form travel chat, injects history, returns `{ reply: string }`
- [x] 1.3 Add `POST /trips/chat` route to `trips.controller.ts`

## 2. Refine endpoint

- [x] 2.1 Add `RefineTripDto` — `itinerary`, `message: string`, optional `history`
- [x] 2.2 Implement `refineTrip()` in `TripConversationService` — system prompt instructs LLM to return `{ reply, itinerary }`, only modifies what user asked
- [x] 2.3 Add `POST /trips/refine` route to `trips.controller.ts`
- [x] 2.4 Return both `reply` (natural confirmation of change) and `itinerary` (updated full itinerary)
