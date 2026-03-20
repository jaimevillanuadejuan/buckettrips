## Status: Implemented

## 1. Card restyling

- [x] 1.1 Itinerary overview card — replaced `surface-card` dark gradient with `rgba(12,45,72,0.07)` light tint
- [x] 1.2 Day cards — same light tint, `var(--foreground)` text, `var(--color-background-third)` accents
- [x] 1.3 Section list items — replaced `surface-chip` dark with light tint + border
- [x] 1.4 My-trips cards — replaced `surface-card` with light tint
- [x] 1.5 My-trips header card — same

## 2. Chat component restyling

- [x] 2.1 `TripRefinementChat` — matched `ChatView` palette (light container, dark text, `var(--color-background-third)` user bubbles + send button)
- [x] 2.2 `ChatView` — confirmed consistent with design system

## 3. Theme removal

- [x] 3.1 Removed `theme` from `TripOverview` interface
- [x] 3.2 Removed `theme` from `SavedTripSummary` interface
- [x] 3.3 Removed `normalizeTheme()` from `normalizeTripItinerary`
- [x] 3.4 Removed `theme` check from `isTripItinerary`
- [x] 3.5 Removed `theme` from backend `confirmTrip` prompt JSON shape
- [x] 3.6 Removed `theme` display from itinerary overview card
- [x] 3.7 Removed `theme` display from my-trips cards

## 4. Layout zone decision

- [x] 4.1 Confirmed two-zone layout as intentional design decision
- [x] 4.2 Reverted all overlay/flat-color experiments — `main` stays `#bfd7ed`
- [x] 4.3 Documented zone rules in spec
