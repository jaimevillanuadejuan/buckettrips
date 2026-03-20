# Proposal: Global Style System

## Problem
The app had inconsistent styling across views — some components used dark gradient `surface-card` with white text, others used light backgrounds with dark text. The itinerary cards, my-trips cards, chat components, and refinement chat all had different visual languages. The `theme` field (nature/historic) was still surfacing in the UI despite being removed from the product logic.

## Decisions Made

### Two-zone layout (intentional, not a bug)
- **Header** (`bg-background-first` = `#95c5f5`) — medium blue, white text. Shared with the homepage hero.
- **Main content** (`--color-background-second` = `#bfd7ed`) — light blue, dark `var(--foreground)` text. Clean light-mode zone.
- These two zones coexist intentionally. The header/homepage feel like a unified hero. Content pages are a distinct light-mode surface.

### Card style — light tint
All content cards use:
- Background: `rgba(12,45,72,0.07)`
- Border: `1px solid rgba(12,45,72,0.13)`
- Text: `var(--foreground)` = `#0c2d48`
- Secondary text: `var(--foreground)` at 0.6–0.75 opacity
- Accent (budget numbers, section titles, day focus): `var(--color-background-third)` = `#145da0`

### Chat components — same light palette
`ChatView` and `TripRefinementChat` use the same card palette:
- Agent bubbles: `rgba(12,45,72,0.08)` bg, `var(--foreground)` text
- User bubbles: `var(--color-background-third)` bg, white text
- Input: `rgba(12,45,72,0.06)` bg, `rgba(12,45,72,0.14)` border, `var(--foreground)` text
- Send/action buttons: `var(--color-background-third)` bg, white icon

### Theme field removed
`theme: "nature" | "historic"` was removed from:
- `TripOverview` interface
- `SavedTripSummary` interface
- `normalizeTripItinerary` normalizer
- `isTripItinerary` validator
- Backend `confirmTrip` prompt JSON shape
- All UI display locations

## What was NOT done
- No dark overlay on `main`
- No flat color change to `main` background
- No merging of header and main background colors
- The header/main color split is preserved as a design feature
