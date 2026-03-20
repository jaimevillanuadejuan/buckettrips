# Proposal: OAuth Authentication + Profile

## Why
BucketTrips currently has no user identity — all trips are anonymous and unscoped. As a portfolio project that may be tested by others, we need a way to associate trips with a specific user so each person sees only their own data.

## What Changes
- Add NextAuth.js (Auth.js) to the Next.js frontend with Google and GitHub OAuth providers.
- Introduce a `Profile` model in the Prisma schema linked to the existing `Trip` model.
- Protect `/my-trips`, `/my-trips/[tripId]`, `/new-trip`, and all sub-routes behind authentication.
- Update the backend Express API to accept a Bearer token on all `/trips` endpoints and scope queries by `profileId`.
- Update the dashboard (`/`) to show the authenticated user's name, avatar, and their own trips only.
- Add sign-in / sign-out controls to the Header.

## Impact
- Trips become user-scoped — no cross-user data leakage.
- Unauthenticated visitors are redirected to a sign-in page.
- The backend enforces ownership on every read, write, and delete operation.
- Existing trip creation and itinerary flows are preserved; they just require a session.
