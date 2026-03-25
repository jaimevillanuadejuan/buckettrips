# Proposal: Hotel Booking Suggestions

## Why

After a trip itinerary is generated, users have no way to discover accommodation options from within the app. They must leave BucketTrips and search manually, which breaks the end-to-end trip planning experience. The conversational intake also never asks about accommodation budget or preferences, so the itinerary has no awareness of lodging costs.

This mirrors the existing flight search integration — hotel results should appear alongside the itinerary, budget-aware, with direct booking links.

## API Selection

**SerpApi Google Hotels** (`serpapi.com`, `engine=google_hotels`) — same provider already used for flight search. No new API key or signup required; the existing `SERPAPI_API_KEY` covers hotel searches too.

Google Hotels aggregates inventory from Booking.com, Expedia, Hotels.com, and others, so users see trusted OTA listings backed by Google's infrastructure. Results include hotel name, star class, overall rating, review count, price per night, thumbnail image, amenities, and direct booking deep-links to trusted OTAs.

Alternative considered: Booking.com via RapidAPI — unofficial third-party scraper, same reliability class as the Skyscanner RapidAPI wrapper that proved unreliable. Rejected in favour of SerpApi.

## What Changes

### Conversation Flow Changes

The `continueConversation` prompt will be updated to naturally ask about:
1. **Accommodation budget** — "roughly how much per night are you thinking for hotels?" (asked after destination + dates are confirmed, alongside or after the flight budget question)
2. **Accommodation type preference** — "any preference on accommodation type — hotel, hostel, apartment?" (optional)

Two new optional fields added to `TripContext`:
- `accommodationBudget: { amount: number; currency: string } | null`
- `accommodationType: string | null` (e.g. `"hotel"`, `"hostel"`, `"apartment"`)

The 5-item confirm checklist is NOT changed — accommodation info is optional and must not block trip generation.

### Backend — HotelsModule

A new `HotelsModule` in the NestJS backend:
- `GET /hotels/search` — accepts `destination`, `checkIn`, `checkOut`, `guests?`, `budget?`, `currency?` and returns top hotel options
- Calls SerpApi `engine=google_hotels` with the trip parameters
- Returns a normalized `HotelResult[]` shape: `{ name, stars, overallRating, reviews, pricePerNight, currency, thumbnailUrl, deepLinkUrl, amenities }`
- Results are NOT persisted — fetched fresh on each page load
- No auth required (public data, same pattern as flights)

### Frontend — Hotel Results on Trip Overview

A new `HotelResults` component shown above the itinerary (below `FlightResults`) on both the new trip loading page and the saved trip detail page:
- Displays top 3–5 hotel options in card format
- Shows hotel name, star class, overall rating, price per night, thumbnail, amenities snippet, and a "Book" deep-link button
- Fetches from a new Next.js API route `GET /api/hotels` which proxies to the backend
- Shows a loading skeleton while fetching, graceful empty state if no results or API error
- Uses trip's `startDate`, `endDate`, `destination`, and `accommodationBudget` (if available) as search parameters
- Currency detection reuses the same `ipapi.co/json/` pattern already used by `FlightResults`

## What Does NOT Change

- The itinerary generation flow (`POST /trips/confirm`, `POST /trips/refine`)
- The `TripContext` confirm checklist (accommodation info is optional)
- The DB schema — hotel results are not saved
- The existing `FlightResults` or `Itinerary` component structure
- The `SERPAPI_API_KEY` env var — reused as-is

## Correctness Properties

- Hotel results must only be shown when `startDate`, `endDate`, and `destination` are all present on the trip
- If the hotel API returns an error or empty results, the UI must show a graceful fallback — never a broken state
- `accommodationBudget` and `accommodationType` must never block the confirm step
- The `HotelResults` component must not affect itinerary rendering performance (loaded independently)
- Deep-link URLs must open in a new tab
- `HotelResults` must render below `FlightResults` and above `Itinerary`
