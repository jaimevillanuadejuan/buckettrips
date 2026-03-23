## Status: Complete

## API Notes

**Chosen API**: SerpApi Google Flights (https://serpapi.com/google-flights-api)

**Endpoints used**:
- `GET https://serpapi.com/search.json?engine=google_flights` — main search, params: `departure_id`, `arrival_id`, `outbound_date`, `return_date`, `type`, `adults`, `currency`, `hl`
- `GET https://serpapi.com/search.json?engine=google_flights_autocomplete` — resolves city names to IATA codes before the main search

**Auth**: `api_key` query param (`SERP_API_KEY` in backend `.env`)

**Free tier**: 100 searches/month, no credit card required. Results include airline, airline logo URL, price, departure/arrival times, total duration, stops, and a Google Flights deep-link URL.

---

## 1. API Research & Setup

- [x] 1.1 Sign up for SerpApi and obtain `SERP_API_KEY`; document the chosen endpoints in a brief note in this file
- [x] 1.2 Add `SERP_API_KEY` to `buckettrips-backend/.env` and `.env.example`

## 2. Backend — TripContext types

- [x] 2.1 Add `flightBudget: { amount: number; currency: string } | null` to the `TripContext` interface/type
- [x] 2.2 Add `airlinePreferences: { preferred: string[]; avoided: string[] } | null` to `TripContext`
- [x] 2.3 Add `originCity: string | null` to `TripContext` (used as departure airport hint)

## 3. Backend — conversation prompt

- [x] 3.1 Update `continueConversation` system prompt to ask about flight budget after destination + dates are confirmed (natural, conversational phrasing)
- [x] 3.2 Update prompt to optionally ask about airline preferences if not already mentioned
- [x] 3.3 Update prompt to extract `originCity` from conversation if the user mentions where they're flying from
- [x] 3.4 Verify the 5-item confirm checklist is unchanged — flight fields must remain optional
- [x] 3.5 Add `detectedOriginCity` to `ConversationDto` — frontend passes IP-geolocated city; prompt uses it to confirm with user ("Are you flying from Madrid?")

## 4. Backend — FlightsModule

- [x] 4.1 Create `src/flights/flights.module.ts`
- [x] 4.2 Create `src/flights/flights.service.ts` — calls SerpApi Google Flights, maps response to `FlightResult[]`
- [x] 4.3 Define `FlightResult` DTO: `{ airline, airlineLogo, price, currency, departureTime, arrivalTime, duration, stops, deepLinkUrl }`
- [x] 4.4 Create `src/flights/flights.controller.ts` — `GET /flights/search` with query params `origin`, `destination`, `departureDate`, `returnDate`, `budget?`, `currency?`, `adults?`
- [x] 4.5 ~~Add `AuthGuard` to the flights endpoint~~ — removed, flights are public data, no auth required
- [x] 4.6 Register `FlightsModule` in `AppModule`
- [x] 4.7 Add `resolveToIata()` — calls SerpApi autocomplete to convert city names to IATA codes before search
- [x] 4.8 Strip ISO time suffix from dates before passing to SerpApi (`2026-09-01T00:00:00.000Z` → `2026-09-01`)

## 5. Frontend — Next.js API proxy route

- [x] 5.1 Create `src/app/api/flights/route.ts` — proxies `GET /flights/search` to the backend; no auth required

## 6. Frontend — FlightResults component

- [x] 6.1 Create `src/components/FlightResults/FlightResults.tsx` — accepts `destination`, `startDate`, `endDate`, `flightBudget?`, `originCity?` as props
- [x] 6.2 Implement fetch logic using the `/api/flights` proxy route
- [x] 6.3 Render flight cards: airline logo + name, price + currency, duration, stops count, "Book" button (opens `deepLinkUrl` in new tab)
- [x] 6.4 Add loading skeleton state (3 placeholder cards)
- [x] 6.5 Add graceful empty/error state ("No flights found — try searching on Google Flights")
- [x] 6.6 Apply project card styles (`rgba(12,45,72,0.07)` bg, `1px solid rgba(12,45,72,0.13)` border)
- [x] 6.7 IP geolocation fallback — if `originCity` not set by conversation, detect via `ipapi.co/json/` and use detected city; show "from {city}" in section header
- [x] 6.8 Detect home currency via `ipapi.co/json/` — used as flight price currency (priority: `flightBudget.currency` > detected origin currency > USD)

## 7. Frontend — Trip overview page integration

- [x] 7.1 Import and render `FlightResults` above `Itinerary` in `src/app/my-trips/[tripId]/page.tsx`
- [x] 7.2 Pass `trip.startDate`, `trip.endDate`, `trip.destination`, and optional `trip.flightBudget` / `trip.originCity` as props
- [x] 7.3 Only render `FlightResults` when `startDate`, `endDate`, and `destination` are all present
- [x] 7.4 Also render `FlightResults` on new trip loading page (`/new-trip/loading`) above the itinerary

## 8. Frontend — TripContext type updates

- [x] 8.1 Add `flightBudget`, `airlinePreferences`, and `originCity` to the frontend `TripContext` type
- [x] 8.2 Ensure `normalizeTripItinerary` and session storage serialization handle the new optional fields gracefully

## 9. Frontend — Origin city detection

- [x] 9.1 Detect user's city on mount in `VoiceTripBuilder` via `ipapi.co/json/` (free, no key)
- [x] 9.2 Pass `detectedOriginCity` in every `POST /trips/conversation` payload
- [x] 9.3 Backend prompt uses it to confirm with user: "Are you flying from {city}?" instead of asking open-endedly
