## Status: Implemented

## 1. Backend — confirmTrip prompt

- [x] 1.1 Update `confirmTrip` system prompt to instruct the LLM to use destination local currency, include `currencyCode`/`currencySymbol` in `tripOverview`, and convert user-stated budgets
- [x] 1.2 Update the JSON shape in the user prompt to use currency-agnostic field names (`estimatedBudget`, `overallBudgetEstimate`) so the LLM doesn't rename them to match the currency

## 2. Backend — refineTrip prompt

- [x] 2.1 Update `refineTrip` system prompt to preserve `currencyCode` and `currencySymbol` from the input itinerary

## 3. Backend — isTripItinerary validator

- [x] 3.1 Use flexible key lookup (`findBudgetField`, `findOverallBudgetField`) to accept any `estimatedBudget*` / `overallBudgetEstimate*` key — handles LLM currency-renamed fields and old `Eur`-suffixed trips

## 4. Frontend — itinerary types

- [x] 4.1 Add `currencyCode: string` and `currencySymbol: string` to `TripOverview` interface
- [x] 4.2 Update `normalizeTripItinerary` to read and normalize `currencyCode`/`currencySymbol` with fallback `"EUR"` / `"€"`
- [x] 4.3 Add `findBudgetField` and `findOverallBudgetField` helpers to `normalizeDay` and `normalizeTripItinerary` — tolerates any currency-suffixed key
- [x] 4.4 Update `isTripItinerary` to use the same flexible helpers (backward compatible with existing saved trips)

## 5. Frontend — Itinerary component

- [x] 5.1 Replace hardcoded `currency: "USD"` with dynamic `formatCurrency(value, currencyCode)`
- [x] 5.2 Show currency code label next to budget snapshot
- [x] 5.3 Update per-day budget display to use dynamic formatter

## 6. Backend — conversation prompt (confirm gate)

- [x] 6.1 Add explicit 5-item checklist to `continueConversation` system prompt that must all be satisfied before `nextStep` can be set to `"confirm"`
- [x] 6.2 Add DATE CALCULATION RULE — LLM must calculate YYYY-MM-DD dates from natural language and confirm with user before setting `exact_start`/`exact_end`
- [x] 6.3 Enumerate non-confirm phrases explicitly ("make the calculations", "sounds good", "sure", "ok", etc.)
