## 1. Implementation
- [x] 1.1 Add request validation and OpenRouter itinerary generation in backend repo `buckettrips-backend` `POST /api/api-trips` route
- [x] 1.2 Add detailed prompt instructions for budget-aware, theme-aligned day-by-day planning
- [x] 1.3 Include iterative follow-up questions in generated output format
- [x] 1.4 Wire `/new-trip/loading` page to invoke backend `POST /api/api-trips` with URL parameter criteria
- [x] 1.5 Update loading component to render generated response and API errors
- [x] 1.6 Add styled itinerary rendering (overview, daily cards, budget, logistics, reservations)
- [x] 1.7 Add follow-up answer form and re-generation loop using `followUpAnswers`
- [x] 1.8 Fix pre-existing `Activities` TypeScript prop typing mismatch
- [x] 1.9 Add UI-only `Save Trip` button with temporary "coming soon" feedback (no persistence yet)
- [x] 1.10 Normalize near-schema itinerary payloads to prevent raw JSON fallback in loading results
- [x] 1.11 Enforce itinerary results card grid breakpoints (mobile default, tablet 768 auto-fit, desktop 1280 three columns)
- [x] 1.12 Make daily itinerary cards compact with click-to-expand animated details
- [x] 1.13 Format day card dates as `Month DayOrdinal` (e.g., `Feb 15th`)
- [x] 1.14 Add a dedicated day-title accent color token for higher contrast in day focus labels
- [x] 1.15 Integrate budget snapshot content directly into the main trip overview card (remove nested budget box)

## 2. Validation
- [x] 2.1 Run lint/type checks
- [ ] 2.2 Manual test with sample query params for both `nature` and `historic`



