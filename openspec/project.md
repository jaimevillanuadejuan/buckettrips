# BucketTrips — Project Overview

## Purpose

BucketTrips helps travelers create highly personalized itineraries through a conversational AI flow. Users describe their trip naturally and the system builds a full day-by-day itinerary.

## Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: NestJS, Prisma, PostgreSQL (Neon)
- **Auth**: NextAuth.js v5 (Auth.js) with Google OAuth
- **AI**: Groq (llama-3.3-70b-versatile) via OpenRouter fallback
- **Deploy**: Vercel (frontend), Railway/Render (backend)

## Auth Architecture

- NextAuth.js v5 handles Google OAuth on the frontend
- On sign-in, a `profile` is upserted in the backend DB via `/api/profile/upsert`
- The session JWT contains `profileId`
- All authenticated backend requests pass `X-Profile-Id` and `X-Api-Key` headers
- Backend `AuthGuard` validates both headers — no JWT decryption needed

## Trip Creation Flow

1. User opens `/new-trip` → `VoiceTripBuilder` (voice or chat mode)
2. Frontend calls `POST /trips/conversation` turn-by-turn, passing full `tripContext` + conversation history
3. Backend LLM extracts context, advances step, returns `agentReply` + `tripContextUpdates`
4. When context is complete, frontend calls `POST /trips/confirm` with exact dates → full itinerary returned
5. User can refine via `POST /trips/refine`
6. User saves via `POST /trips` (auth required) → stored in DB

## What Was Removed

- `theme` field — removed from `Trip` model, `CreateTripDto`, `isTripItinerary` validator, `TripOverview` type, and all frontend save/display logic
- Theme image assets (`nature.jpg`, `historic.jpg`) — deleted
- Theme selection UI (`Theme` component) — replaced with redirect to `/new-trip`
- Hardcoded `generateContextualQuestions` — replaced with AI-powered version that reads full context and conversation history

## Conventions

- Trip intake is conversation-first: one question at a time, context extracted from natural language
- Frontend passes full `conversationHistory` on every turn so the model never asks about things already mentioned
- `normalizeTripItinerary` on the frontend normalizes LLM output before saving
- Backend validator `isTripItinerary` guards the save endpoint against malformed payloads
