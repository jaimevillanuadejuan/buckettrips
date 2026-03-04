## 1. Implementation
- [x] 1.1 Add request validation and Gemini itinerary generation in `src/app/api/new-trip/route.ts`
- [x] 1.2 Add detailed prompt instructions for budget-aware, theme-aligned day-by-day planning
- [x] 1.3 Include iterative follow-up questions in generated output format
- [x] 1.4 Wire `/new-trip/loading` page to invoke the API with URL parameter criteria
- [x] 1.5 Update loading component to render generated response and API errors
- [x] 1.6 Add styled itinerary rendering (overview, daily cards, budget, logistics, reservations)
- [x] 1.7 Add follow-up answer form and re-generation loop using `followUpAnswers`
- [x] 1.8 Fix pre-existing `Activities` TypeScript prop typing mismatch
- [x] 1.9 Add UI-only `Save Trip` button with temporary "coming soon" feedback (no persistence yet)

## 2. Validation
- [x] 2.1 Run lint/type checks
- [ ] 2.2 Manual test with sample query params for both `nature` and `historic`
