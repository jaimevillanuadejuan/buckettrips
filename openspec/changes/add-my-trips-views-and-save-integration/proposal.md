# Proposal: Add My Trips Views And Save Integration

## Why
The itinerary UI already supports generation and refinement, but users still need a complete frontend flow to persist trips and access them later. With the backend API now available, the frontend should integrate save/list/view/delete flows.

## What Changes
- Wire `Save Trip` action in `/new-trip/loading` to call backend `POST /api/trips`.
- Add success/error feedback for save attempts and shortcut link to `/my-trips`.
- Add `my-trips` list page with `View` and `Delete` actions.
- Add `my-trips/[tripId]` detail page that renders saved itineraries in read-only mode.
- Add global `My Trips` navigation link in the header.
- Keep saved-trip cards focused on user-relevant metadata (hide provider/model details in card UI).
- Simplify `my-trips/[tripId]` header by removing redundant hero container and adding a top-left dashboard back arrow.
- Default itinerary budget display formatting to USD for consistent presentation.

## Impact
- Users can persist generated itineraries and retrieve them later.
- Frontend and backend responsibilities stay cleanly separated across repos.
- Portfolio flow becomes end-to-end: generate, save, browse, inspect, delete.
