# BucketTrips Frontend

Next.js frontend for trip planning and saved trips management.

## Prerequisites
- Node.js 20+
- Running backend API (`buckettrips-backend`)

## Environment
Create `.env.local`:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080/api
```

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## API Integration
- Generate itinerary: `POST ${NEXT_PUBLIC_BACKEND_URL}/api-trips`
- Save trip: `POST ${NEXT_PUBLIC_BACKEND_URL}/trips`
- List trips: `GET ${NEXT_PUBLIC_BACKEND_URL}/trips`
- Trip detail: `GET ${NEXT_PUBLIC_BACKEND_URL}/trips/:tripId`
- Delete trip: `DELETE ${NEXT_PUBLIC_BACKEND_URL}/trips/:tripId`

The frontend no longer calls OpenRouter directly. LLM generation is handled by backend.
