## Status: Not Started

## 1. Backend — confirmTrip prompt

- [ ] 1.1 Update `confirmTrip` system prompt in `trip-conversation.service.ts` to instruct the LLM to:
  - Use the local currency of the destination for all budget figures
  - Include `currencyCode` (ISO 4217) and `currencySymbol` in `tripOverview`
  - If the user mentioned a numeric budget in their own currency, convert it to the destination currency and treat it as the budget ceiling
- [ ] 1.2 Update the `confirmTrip` JSON shape in the user prompt to include `currencyCode` and `currencySymbol` fields in `tripOverview`
- [ ] 1.3 Rename `estimatedBudgetEur` → `estimatedBudget` and `overallBudgetEstimateEur` → `overallBudgetEstimate` in the prompt JSON shape (currency is now dynamic)

## 2. Backend — refineTrip prompt

- [ ] 2.1 Update `refineTrip` system prompt to preserve `currencyCode` and `currencySymbol` from the existing itinerary when returning the updated version

## 3. Backend — isTripItinerary validator

- [ ] 3.1 Update `isTripItinerary` in `is-trip-itinerary.ts` to accept optional `currencyCode` and `currencySymbol` on `tripOverview` (no breaking change)
- [ ] 3.2 Rename field checks from `estimatedBudgetEur` → `estimatedBudget` and `overallBudgetEstimateEur` → `overallBudgetEstimate`

## 4. Frontend — itinerary types

- [ ] 4.1 Add `currencyCode: string` and `currencySymbol: string` to `TripOverview` interface in `itinerary.ts`
- [ ] 4.2 Update `normalizeTripItinerary` to read and normalize `currencyCode` / `currencySymbol` with fallback `"EUR"` / `"€"`
- [ ] 4.3 Rename `estimatedBudgetEur` → `estimatedBudget` on `ItineraryDay` and `overallBudgetEstimateEur` → `overallBudgetEstimate` on `TripItinerary`
- [ ] 4.4 Update `normalizeTripItinerary` and `isTripItinerary` in `itinerary.ts` to use the renamed fields, with backward-compat fallback reading old field names from raw JSON

## 5. Frontend — Itinerary component

- [ ] 5.1 Replace hardcoded `Intl.NumberFormat("en-US", { currency: "USD" })` with a dynamic `formatCurrency(value, currencyCode)` that uses the itinerary's `currencyCode`
- [ ] 5.2 Update budget snapshot display to show currency code label (e.g. "¥45,000 – ¥80,000 JPY")
- [ ] 5.3 Update per-day budget display to use the same dynamic formatter
