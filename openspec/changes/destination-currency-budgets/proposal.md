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

## Correctness Properties
- For any destination, `currencyCode` in the output must be a valid ISO 4217 code matching that country
- If the user stated a numeric budget in conversation, the generated `overallBudget.high` must not exceed that amount (converted to destination currency)
- Existing saved trips without `currencyCode` must still render correctly (fallback to EUR)
