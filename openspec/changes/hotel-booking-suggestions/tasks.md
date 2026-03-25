## Status: Complete

## API Notes

**Chosen API**: SerpApi Google Hotels (`engine=google_hotels`)

**Endpoint**: `GET https://serpapi.com/search` with params:
- `engine=google_hotels`
- `q` — destination string (e.g. "Paris hotels")
- `check_in_date` — YYYY-MM-DD
- `check_out_date` — YYYY-MM-DD
- `adults` — number of guests (default 2)
- `currency` — ISO currency code (e.g. USD, EUR)
- `api_key` — reuses existing `SERP_API_KEY`

**Auth**: `api_key` query param — reuses existing `SERP_API_KEY` in backend `.env`. No new key needed.

**Note on booking links**: SerpApi `link` field returns the hotel's own website, not a booking platform deep-link. All hotels now use a Google Hotels search URL as the booking link for reliability.

**Free tier**: 250 searches/month shared with flight searches on the same key.

---

## 1. Backend — TripContext types

- [x] 1.1 Add `accommodationBudget: { amount: number; currency: string } | null` to the `TripContext` interface/type
- [x] 1.2 Add `accommodationType: string | null` to `TripContext` (e.g. `"hotel"`, `"hostel"`, `"apartment"`)

## 2. Backend — conversation prompt

- [x] 2.1 Update `continueConversation` system prompt to ask about accommodation budget after destination + dates are confirmed
- [x] 2.2 Update prompt to optionally ask about accommodation type preference if not already mentioned
- [x] 2.3 Verify the 5-item confirm checklist is unchanged — accommodation fields must remain optional

## 3. Backend — HotelsModule

- [x] 3.1 Create `src/hotels/hotels.module.ts`
- [x] 3.2 Create `src/hotels/hotels.service.ts` — calls SerpApi `engine=google_hotels`, filters results with no price, maps to `HotelResult[]`
- [x] 3.3 Define `HotelResult` DTO: `{ name, stars, overallRating, reviews, pricePerNight, currency, thumbnailUrl, deepLinkUrl, amenities }`
- [x] 3.4 Create `src/hotels/hotels.controller.ts` — `GET /hotels/search`
- [x] 3.5 Register `HotelsModule` in `AppModule`

## 4. Backend — DB schema updates

- [x] 4.1 Add `originCity`, `flightBudget`, `accommodationBudget`, `accommodationType` columns to `Trip` model
- [x] 4.2 Add `preferredCurrency` to `Profile` model
- [x] 4.3 Run `prisma db push` to apply to Neon DB
- [x] 4.4 Update `CreateTripDto` to accept new trip travel context fields
- [x] 4.5 Update `trips.service.ts` to save new fields on trip create
- [x] 4.6 Add `GET /profile/me` endpoint returning `preferredCurrency`
- [x] 4.7 Add `POST /profile/currency` endpoint to set `preferredCurrency`

## 5. Frontend — Next.js API proxy routes

- [x] 5.1 Create `src/app/api/hotels/route.ts` — proxies to backend
- [x] 5.2 Create `src/app/api/profile/me/route.ts` — returns `preferredCurrency` from backend
- [x] 5.3 Create `src/app/api/profile/currency/route.ts` — saves `preferredCurrency` to backend
- [x] 5.4 Create `src/app/api/geo/route.ts` — server-side IP geolocation fallback

## 6. Frontend — HotelResults component

- [x] 6.1 Create `src/components/HotelResults/HotelResults.tsx`
- [x] 6.2 Null-safe rendering for `pricePerNight`, `stars`, `overallRating`, `reviews`
- [x] 6.3 All hotels show "Book" button linking to Google Hotels search for that hotel
- [x] 6.4 Loading skeleton + graceful empty state
- [x] 6.5 Design system card styles applied

## 7. Frontend — Budget snapshot dual-currency display

- [x] 7.1 `useUserCurrency` hook in `Itinerary.tsx` — fetches `preferredCurrency` from `/api/profile/me`, falls back to `/api/geo`
- [x] 7.2 Exchange rate fetched via `open.er-api.com/v6/latest/{tripCurrency}` (supports all currencies including MXN, HKD, PEN)
- [x] 7.3 Budget snapshot shows destination currency (regular weight) + user preferred currency (bold) side by side
- [x] 7.4 Same dual-currency display applied to estimated daily budget in each day card
- [x] 7.5 `preferredCurrency` detected from browser IP on trip loading page and saved to profile via `/api/profile/currency`

## 8. Frontend — Trip overview integration

- [x] 8.1 `HotelResults` rendered below `FlightResults` above `Itinerary` on both loading page and saved trip detail
- [x] 8.2 `FlightResults` given `w-full text-left` to match hotel container width
- [x] 8.3 `loading/page.tsx` passes `originCity`, `flightBudget`, `accommodationBudget`, `accommodationType` to `Loading` component and saves them on trip create

## 9. Voice agent fixes

- [x] 9.1 Interruption fix — user speaking while agent talks cancels synthesis immediately and starts listening
- [x] 9.2 Confirm logic — removed hardcoded phrase list, LLM fully controls `nextStep: "confirm"` decision
- [x] 9.3 Synthesis timeout extended to 30s for longer summaries

## API Notes

**Chosen API**: SerpApi Google Hotels (`engine=google_hotels`)

**Endpoint**: `GET https://serpapi.com/search` with params:
- `engine=google_hotels`
- `q` — destination string (e.g. "Paris hotels")
- `check_in_date` — YYYY-MM-DD
- `check_out_date` — YYYY-MM-DD
- `adults` — number of guests (default 2)
- `currency` — ISO currency code (e.g. USD, EUR)
- `api_key` — reuses existing `SERPAPI_API_KEY`

**Auth**: `api_key` query param — reuses existing `SERPAPI_API_KEY` in backend `.env`. No new key needed.

**Free tier**: 250 searches/month shared with flight searches on the same key. Results include hotel name, star class, overall rating, review count, price per night, thumbnail URL, amenities, and booking deep-links to trusted OTAs (Booking.com, Expedia, etc.).

---

## 1. Backend — TripContext types

- [x] 1.1 Add `accommodationBudget: { amount: number; currency: string } | null` to the `TripContext` interface/type
- [x] 1.2 Add `accommodationType: string | null` to `TripContext` (e.g. `"hotel"`, `"hostel"`, `"apartment"`)

## 2. Backend — conversation prompt

- [x] 2.1 Update `continueConversation` system prompt to ask about accommodation budget after destination + dates are confirmed (natural, conversational phrasing — alongside or after the flight budget question)
- [x] 2.2 Update prompt to optionally ask about accommodation type preference if not already mentioned
- [x] 2.3 Verify the 5-item confirm checklist is unchanged — accommodation fields must remain optional

## 3. Backend — HotelsModule

- [x] 3.1 Create `src/hotels/hotels.module.ts`
- [x] 3.2 Create `src/hotels/hotels.service.ts` — calls SerpApi `engine=google_hotels`, maps response `properties[]` to `HotelResult[]`
- [x] 3.3 Define `HotelResult` DTO: `{ name, stars, overallRating, reviews, pricePerNight, currency, thumbnailUrl, deepLinkUrl, amenities }`
- [x] 3.4 Create `src/hotels/hotels.controller.ts` — `GET /hotels/search` with query params `destination`, `checkIn`, `checkOut`, `guests?`, `budget?`, `currency?`
- [x] 3.5 Register `HotelsModule` in `AppModule`

## 4. Frontend — Next.js API proxy route

- [x] 4.1 Create `src/app/api/hotels/route.ts` — proxies `GET /hotels/search` to the backend; no auth required

## 5. Frontend — HotelResults component

- [x] 5.1 Create `src/components/HotelResults/HotelResults.tsx` — accepts `destination`, `startDate`, `endDate`, `accommodationBudget?`, `guests?` as props
- [x] 5.2 Implement fetch logic using the `/api/hotels` proxy route
- [x] 5.3 Render hotel cards: thumbnail, name, star class, overall rating + review count, price per night + currency, amenities snippet, "Book" button (opens `deepLinkUrl` in new tab)
- [x] 5.4 Add loading skeleton state (3 placeholder cards)
- [x] 5.5 Add graceful empty/error state ("No hotels found — try searching on Google Hotels")
- [x] 5.6 Apply project card styles (`rgba(12,45,72,0.07)` bg, `1px solid rgba(12,45,72,0.13)` border)
- [x] 5.7 Detect home currency via `ipapi.co/json/` — used as hotel price currency (priority: `accommodationBudget.currency` > detected origin currency > USD)

## 6. Frontend — Trip overview page integration

- [x] 6.1 Import and render `HotelResults` below `FlightResults` and above `Itinerary` in `src/app/my-trips/[tripId]/page.tsx`
- [x] 6.2 Pass `trip.startDate`, `trip.endDate`, `trip.destination`, and optional `trip.accommodationBudget` as props
- [x] 6.3 Only render `HotelResults` when `startDate`, `endDate`, and `destination` are all present
- [x] 6.4 Also render `HotelResults` on new trip loading page (`/new-trip/loading`) in the same position

## 7. Frontend — TripContext type updates

- [x] 7.1 Add `accommodationBudget` and `accommodationType` to the frontend `TripContext` type
- [x] 7.2 Ensure `normalizeTripItinerary` and session storage serialization handle the new optional fields gracefully
