# BucketTrips — Frontend

Next.js 15 App Router frontend for BucketTrips, a conversational AI trip planner.

## Stack

- Next.js 15 (App Router)
- TypeScript + React
- Tailwind CSS
- NextAuth.js v5 (Auth.js) — Google OAuth
- Deployed on Vercel

## Auth

Authentication uses NextAuth.js v5 with Google OAuth. On sign-in, the backend is called to upsert a profile. The session includes a `profileId` which is passed to backend API calls via `X-Profile-Id` and `X-Api-Key` headers.

Required env vars:

```
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080/api
NEXT_PUBLIC_INTERNAL_API_KEY=
```

## Trip Creation Flow

Trip planning is fully conversational via `VoiceTripBuilder` — supports both voice and chat modes. The flow:

1. User describes their trip naturally (destination, dates, companions, budget, interests)
2. Backend extracts context turn-by-turn via `/trips/conversation`
3. Once enough context is gathered, the backend generates a full itinerary via `/trips/confirm`
4. User can refine the itinerary via `/trips/refine`
5. User saves the trip — stored in PostgreSQL via the NestJS backend

The legacy theme-selection step (nature/historic) has been removed. Theme is no longer a field in the trip model or itinerary.

## Running locally

```bash
npm install
npm run dev
```
