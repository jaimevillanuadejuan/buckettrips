# Project Overview

## Purpose
BucketTrips helps users generate themed travel itineraries after selecting a destination, dates, and a trip style.

## Stack
- Next.js App Router
- TypeScript + React
- Google Gemini API (REST)
- External NestJS + Prisma + PostgreSQL backend for saved trips

## Conventions
- API routes validate request input before calling external services.
- Generated plans should be practical, budget-aware, and easy to refine iteratively.
- Theme-specific planning currently supports `nature` and `historic`.
