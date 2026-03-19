# Project Overview

## Purpose
BucketTrips helps travelers create highly personalized itineraries through a conversational intake flow.

## Stack
- Next.js App Router
- TypeScript + React
- Backend-powered conversational trip APIs (`parse-intent`, `contextual-questions`, `confirm`)

## Conventions
- Trip intake is conversation-first: one question at a time across five phases.
- Frontend calls backend APIs via `NEXT_PUBLIC_BACKEND_URL` for conversational intelligence and itinerary generation.
- Generated plans should remain practical, budget-aware, and refineable via follow-up answers.
