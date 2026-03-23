# Proposal: Flight Search API Integration

## Why

After a trip itinerary is generated, users have no way to discover or compare flight options from within the app. They must leave BucketTrips and search manually, which breaks the end-to-end trip planning experience. Additionally, the conversational intake never asks about flight budget or airline preferences, so the generated itinerary has no awareness of travel-to-destination costs.

## What Changes

### API Selection

Skyscanner's public API has been deprecated for new partners. The best freely accessible alternative is:

- **SerpApi Google Flights** — scrapes real Google Flights data, free tier (100 searches/month, no credit card required), returns structured JSON with prices, airlines, stops, duration, and a Google Flights deep-link URL. Maintained by SerpApi, more stable than RapidAPI scrapers.

The implementation uses **SerpApi Google Flights** as the data source, abstracted behind a backend service so the provider can be swapped without frontend changes. API key stored as `SERP_API_KEY`.

### Conversation Flow Changes

The `continueConversation` prompt will be updated to naturally ask about:
1. **Flight budget** — "roughly how much are you thinking for flights?" (asked after destination + dates are confirmed)
2. **Airline preferences** — "any airlines you prefer or want to avoid?" (optional, asked only if the user hasn't already mentioned it)

These are added as two new optional fields in `TripContext`:
- `flightBudget: { amount: number; currency: string } | null`
- `airlinePreferences: { preferred: string[]; avoided: string[] } | null`

The 5-item confirm checklist is NOT changed — flight info is optional and must not block trip generation.

### Backend — Flight Search Service

A new `FlightsModule` in the NestJS backend:
- `GET /flights/search` — accepts `origin`, `destination`, `departureDate`, `returnDate`, `budget`, `currency`, `adults` and returns top flight options
- Calls Sky Scrapper API (RapidAPI) with the user's trip parameters
- Returns a normalized `FlightResult[]` shape: `{ airline, price, currency, departureTime, arrivalTime, duration, stops, deepLinkUrl }`
- Results are NOT persisted — fetched fresh on each page load
- API key stored in backend `.env` as `RAPIDAPI_KEY`

### Frontend — Flight Results on Trip Overview

After the itinerary is rendered on `/my-trips/[tripId]`, a new `FlightResults` component is shown below the itinerary:
- Displays top 3–5 flight options in card format
- Shows airline, price, duration, stops, and a "Book" deep-link button
- Fetches from the Next.js API route `GET /api/flights` which proxies to the backend
- Shows a loading skeleton while fetching, and a graceful empty state if no results or API error
- Uses trip's `startDate`, `endDate`, `destination`, and `flightBudget` (if available) as search parameters
- Origin airport is derived from a new optional `originCity` field in `TripContext` (asked during conversation if not already known)

## What Does NOT Change

- The itinerary generation flow (`POST /trips/confirm`, `POST /trips/refine`)
- The `TripContext` confirm checklist (flight info is optional)
- The DB schema — flight results are not saved
- The existing `Itinerary` component structure

## Correctness Properties

- Flight results must only be shown when `startDate`, `endDate`, and `destination` are all present on the trip
- If the flight API returns an error or empty results, the UI must show a graceful fallback — never a broken state
- `flightBudget` and `airlinePreferences` must never block the confirm step
- The `FlightResults` component must not affect itinerary rendering performance (loaded independently, below the fold)
- Deep-link URLs must open in a new tab
