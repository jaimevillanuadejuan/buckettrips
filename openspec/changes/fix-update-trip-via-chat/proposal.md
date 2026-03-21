# Proposal: Persist Trip Itinerary Updates via Refinement Chat

## Problem

When a user opens a saved trip from My Trips and refines it through the `TripRefinementChat` component, the updated itinerary is applied to local React state but never written back to the database. Navigating away and returning to the trip shows the original unmodified itinerary.

## Root Cause

`TripRefinementChat` calls `POST /trips/refine` to get an updated itinerary from the LLM, then calls `onItineraryUpdate(updated)` which updates local state in `Itinerary.tsx`. There was no `PATCH` endpoint on the backend and no persistence call after a successful refine.

## Solution

1. Add `PATCH /trips/:tripId` endpoint to the backend — validates ownership via `AuthGuard`, validates itinerary shape via `isTripItinerary`, updates the `itinerary` JSON column in the DB.
2. `TripRefinementChat` accepts an optional `tripId` prop. When present (i.e. viewing a saved trip), it fires a `PATCH` after every successful refine to persist the change silently.
3. `Itinerary` component threads `tripId` down to `TripRefinementChat`.
4. The trip detail page (`/my-trips/[tripId]`) passes `tripId` to `Itinerary`.

## Impact

- Saved trips now reflect all chat-based refinements after navigation
- No change to the new-trip flow (no `tripId` → no persistence call)
- Persistence is fire-and-forget (non-fatal) — UI updates immediately regardless
