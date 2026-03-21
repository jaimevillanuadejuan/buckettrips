## Status: Implemented

## 1. Backend — PATCH endpoint

- [x] 1.1 Add `PATCH /trips/:tripId` to `trips.controller.ts` — protected by `AuthGuard`, calls `tripsService.updateItinerary()`
- [x] 1.2 Add `updateItinerary(id, profileId, itinerary)` to `trips.service.ts` — ownership check, `isTripItinerary` validation, Prisma `update` on `itinerary` field

## 2. Frontend — wire up persistence

- [x] 2.1 Add optional `tripId` prop to `TripRefinementChat` — when present, fires `PATCH /trips/:tripId` after each successful refine
- [x] 2.2 Import and use `apiFetch` + `useSession` in `TripRefinementChat` for authenticated patch call
- [x] 2.3 Update `itineraryRef` immediately after refine so subsequent refinements use the latest version
- [x] 2.4 Add optional `tripId` prop to `Itinerary` component — passed through to `TripRefinementChat`
- [x] 2.5 Pass `tripId` from `/my-trips/[tripId]/page.tsx` to `Itinerary`
