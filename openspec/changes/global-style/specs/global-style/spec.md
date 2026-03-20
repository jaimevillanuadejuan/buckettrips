# Global Style System

## Overview
Defines the visual design system for BucketTrips — color tokens, surface styles, typography rules, and component-level style decisions. All styles derive from CSS variables in `globals.css`. No arbitrary hex colors outside the design system.

---

## Color Tokens

| Token | Value | Usage |
|---|---|---|
| `--background` | `#bfd7ed` | Body background |
| `--foreground` | `#0c2d48` | Primary text in content area |
| `--color-background-first` | `#95c5f5` | Header background, button bg |
| `--color-background-second` | `#bfd7ed` | Main content background |
| `--color-background-third` | `#145da0` | User bubbles, send buttons, accents |
| `--color-background-fourth` | `#0c2d48` | Deep dark (same as foreground) |
| `--color-day-accent` | `#ffd166` | Reserved (not currently used in content) |
| `--color-main` | `#2e8bc0` | Reserved |

---

## Layout Zones

### Header zone
- Background: `var(--color-background-first)` = `#95c5f5`
- Text: white
- Includes: `<Header>` nav, homepage `<Dashboard>` hero

### Main content zone
- Background: `var(--color-background-second)` = `#bfd7ed`
- Text: `var(--foreground)` = `#0c2d48`
- Includes: all page content — new trip, itinerary, my-trips, trip detail

These two zones are intentionally distinct. Do not merge them.

---

## Surface Styles

### Content cards (`.surface-card` equivalent — inline styles)
```
background: rgba(12,45,72,0.07)
border: 1px solid rgba(12,45,72,0.13)
border-radius: 1rem (rounded-2xl)
```
Used by: itinerary overview card, day cards, my-trips cards, my-trips header card.

### Section list items
```
background: rgba(12,45,72,0.07)
border: 1px solid rgba(12,45,72,0.13)
color: var(--foreground)
```

### Chat agent bubbles
```
background: rgba(12,45,72,0.08)
color: var(--foreground)
```

### Chat user bubbles
```
background: var(--color-background-third)
color: #fff
```

### Chat / refine input
```
background: rgba(12,45,72,0.06)
border: 1px solid rgba(12,45,72,0.14)
color: var(--foreground)
```

### Action buttons (send, voice wave)
```
background: var(--color-background-third)
color: #fff
```

---

## Typography Rules

| Context | Color |
|---|---|
| Headings (cards) | `var(--foreground)` full opacity |
| Body / secondary text | `var(--foreground)` at 0.75 opacity |
| Muted / meta text | `var(--foreground)` at 0.55–0.6 opacity |
| Accent (budget, day focus, section titles) | `var(--color-background-third)` |
| White text | Only on `var(--color-background-third)` backgrounds or header zone |

---

## Removed: Theme Field
`theme: "nature" | "historic"` has been fully removed from the product.

Removed from:
- `TripOverview` TypeScript interface
- `SavedTripSummary` TypeScript interface
- `normalizeTripItinerary()` normalizer
- `isTripItinerary()` validator
- Backend `confirmTrip` LLM prompt JSON shape
- All UI display locations (itinerary overview card, my-trips cards)

---

## Rules
- No orange colors anywhere
- No arbitrary hex values outside the token list above
- No dark overlays on `main`
- No merging of header and main background colors
- `surface-card` CSS class is kept for legacy compatibility but new components use inline styles with the light tint palette
