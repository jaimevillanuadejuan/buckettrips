# Proposal: Destination-Aware Currency for Budget Display

## Problem

All budget figures in generated itineraries are hardcoded in EUR, and the frontend formats them as USD (`Intl.NumberFormat` with `currency: "USD"`). This is wrong in two ways:

1. A trip to Japan should show budgets in JPY, not EUR. A trip to the US should show USD. The currency should match the destination.
2. If a user says "I have a $2000 budget" during the conversational intake, the LLM currently ignores the currency context and still outputs EUR figures — making the budget tier mapping meaningless.

## Solution

### LLM side (backend)
- Tell the `confirmTrip` prompt to use the **local currency of the destination** for all budget figures
- Include `currencyCode` (ISO 4217, e.g. `"JPY"`) and `currencySymbol` (e.g. `"¥"`) in the returned JSON
- If the user mentioned a budget in their own currency during conversation, instruct the LLM to convert it to the destination currency and use that as the budget ceiling
- Same treatment for `refineTrip` prompt so refinements stay consistent

### Data model
- Add `currencyCode: string` and `currencySymbol: string` to `TripOverview` in the frontend type (`itinerary.ts`)
- Normalize these fields in `normalizeTripItinerary` with a sensible fallback (`"EUR"` / `"€"`)
- Update `isTripItinerary` validator on the backend to accept (but not require) these fields — backward compatible with existing saved trips

### Frontend display
- Replace the hardcoded `Intl.NumberFormat("en-US", { currency: "USD" })` in `Itinerary.tsx` with a dynamic formatter that uses `itinerary.tripOverview.currencyCode`
- Show the currency code label next to the budget snapshot so it's always clear (e.g. "¥45,000 – ¥80,000 JPY")

## What does NOT change
- The DB schema — `itinerary` is stored as JSON, currency fields are just part of that blob
- The save/load flow — no migration needed
- The `budget.tier` concept in `TripContext` — that stays as a qualitative tier, currency is only relevant at display/generation time

## Implementation Notes

### LLM field-renaming bug (fixed)
The LLM was renaming `estimatedBudgetEur` to match the destination currency (e.g. `estimatedBudgetPen` for Peru, `estimatedBudgetJpy` for Japan). This caused both the backend validator and frontend normalizer to find empty budget objects, resulting in a 400 error and raw JSON rendering instead of the itinerary UI.

Fix: the JSON schema template in `confirmTrip` now uses currency-agnostic names (`estimatedBudget`, `overallBudgetEstimate`). Both validators use a flexible key scan (`findBudgetField`, `findOverallBudgetField`) that accepts any `estimatedBudget*` / `overallBudgetEstimate*` key — so old saved trips with the `Eur` suffix still work.

### Premature confirm bug (fixed)
The conversation agent was jumping to `nextStep: "confirm"` on ambiguous phrases like "make the calculations" or "sounds good", triggering an immediate redirect to the loading page before all required info was collected.

Fix: the `continueConversation` system prompt now has an explicit 5-item checklist (destination, exact_start, exact_end, companions, budget) that must all be satisfied before confirm is allowed. A DATE CALCULATION RULE instructs the LLM to compute YYYY-MM-DD dates from natural language itself and confirm with the user rather than jumping ahead.

## Correctness Properties
- For any destination, `currencyCode` in the output must be a valid ISO 4217 code matching that country
- If the user stated a numeric budget in conversation, the generated `overallBudget.high` must not exceed that amount (converted to destination currency)
- Existing saved trips without `currencyCode` must still render correctly (fallback to EUR)
- `nextStep: "confirm"` must never be set unless all 5 checklist items are present in `tripContextUpdates` or existing `tripContext`
