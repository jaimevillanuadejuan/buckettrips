# Proposal: Country-Level Multi-Destination Planning With Itinerary Map

## Why

Today the trip flow is optimized for one destination string (usually one city). When users say "I want to visit Italy" or "plan a trip across Japan", the app should suggest a practical city sequence, then show flights and hotels per stop in one overview.

Without this, country-level intent gets flattened into one place and users lose the planning value of multi-stop routing.

## What Changes

- Add country-mode trip rendering in overview pages:
  - stop-by-stop cards (`Rome -> Florence -> Venice`)
  - flight suggestions per leg (origin->stop1, stop1->stop2, etc.)
  - hotel suggestions per stop (top 3 to 5)
- Add a route graphic in the itinerary overview using MapLibre:
  - line route from ordered destination coordinates
  - numbered stop markers
  - active stop highlight synced with destination cards
- Keep payload and UI practical:
  - only persist selected/curated suggestions (not raw provider responses)
  - lazy-load map on client and use compact GeoJSON
- Keep city-trip UX unchanged for existing single-destination plans.

## Map Rendering Approach

Primary option:
- `maplibre-gl` with OpenFreeMap/MapTiler style and lightweight GeoJSON source.

Alternative options:
- Leaflet + polyline: smaller conceptual overhead, easier fallback, less polished vector styling.
- Static map snapshot API: fastest to ship, no interactive map, very low runtime cost.

## Data Contract Expected From Backend

- `tripScope`: `CITY | COUNTRY`
- `destinations[]`: ordered stop summaries with coordinates and stay window
- `routeGeoJson`: LineString for rendering route
- `flightSuggestionsByLeg[]`: grouped by leg index
- `hotelSuggestionsByDestination[]`: grouped by destination index

## Impact

- Country-level requests become first-class and visually understandable.
- Users can evaluate transportation and lodging choices across a whole country itinerary in one screen.
- Existing city flow stays intact while multi-destination capabilities are added incrementally.
