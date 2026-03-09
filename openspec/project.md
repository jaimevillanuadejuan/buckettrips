# Project Overview

## Purpose
BucketTrips helps users generate themed travel itineraries after selecting a destination, dates, and a trip style.

## Stack
- Next.js App Router
- TypeScript + React
- OpenRouter-powered itinerary generation via external NestJS backend
- External NestJS + Prisma + PostgreSQL backend for itinerary generation and saved trips

## Conventions
- Frontend calls backend API endpoints via `NEXT_PUBLIC_BACKEND_URL`.
- Generated plans should be practical, budget-aware, and easy to refine iteratively.
- Theme-specific planning currently supports `nature` and `historic`.
