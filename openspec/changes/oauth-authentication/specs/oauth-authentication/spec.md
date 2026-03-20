# Spec: OAuth Authentication + Profile

## Overview
NextAuth.js (Auth.js v5) is added to the Next.js frontend with Google and GitHub OAuth providers. A `Profile` model is introduced in Prisma and linked to `Trip`. The backend Express API verifies a JWT Bearer token on every `/trips` request and scopes all queries to the authenticated user's `profileId`.

---

## Requirement: OAuth Sign-In

The Auth_Provider SHALL support Google and GitHub OAuth sign-in.

### Scenario: Successful sign-in (new user)
- **WHEN** a visitor completes OAuth authorization for the first time
- **THEN** a new `Profile` record is created from the OAuth identity data
- **AND** a Session is issued and persisted for 30 days

### Scenario: Successful sign-in (returning user)
- **WHEN** a returning user completes OAuth authorization
- **THEN** the existing `Profile` record's `updatedAt` is refreshed
- **AND** all existing data is preserved

### Scenario: OAuth error or cancellation
- **WHEN** the OAuth provider returns an error or the user cancels
- **THEN** the user is redirected to the sign-in page with a descriptive error message

---

## Requirement: Profile Model

The `Profile` model SHALL be added to the Prisma schema with the following fields:
- `id` — cuid, primary key
- `oauthProvider` — string (e.g. `"google"`, `"github"`)
- `oauthId` — string (provider-issued user ID)
- `email` — string, unique
- `name` — string, optional
- `avatarUrl` — string, optional
- `createdAt` — DateTime
- `updatedAt` — DateTime

A unique constraint SHALL exist on `(oauthProvider, oauthId)`.

The `Trip` model SHALL gain a `profileId` foreign key. Deleting a `Profile` SHALL cascade-delete all associated `Trip` records.

### Scenario: New trip creation
- **WHEN** an authenticated user creates a trip
- **THEN** the backend associates the trip with the user's `profileId`

---

## Requirement: Session Management

### Scenario: Session persistence
- **WHEN** a user signs in
- **THEN** a session token is issued that persists for 30 days
- **AND** session data (id, name, email, avatar) is available to both server and client components

### Scenario: Session expiry
- **WHEN** a session expires and the user requests a protected route
- **THEN** the user is redirected to the sign-in page

### Scenario: Sign-out
- **WHEN** a user clicks "Sign Out"
- **THEN** the session is invalidated and the user is redirected to the home page

---

## Requirement: Route Protection

The following routes SHALL be protected — unauthenticated requests redirect to the sign-in page with a `callbackUrl` parameter:
- `/my-trips`
- `/my-trips/[tripId]`
- `/new-trip`
- `/new-trip/dates`
- `/new-trip/theme`
- `/new-trip/loading`

### Scenario: Cross-user trip access
- **IF** an authenticated user requests a trip belonging to a different profile
- **THEN** the backend returns `403 Forbidden`

---

## Requirement: Trip Ownership Enforcement

### Scenario: List trips
- **WHEN** an authenticated user requests the trip list
- **THEN** only trips with a matching `profileId` are returned

### Scenario: Get trip by id
- **WHEN** an authenticated user requests a specific trip
- **THEN** the backend verifies `trip.profileId === requestingUser.profileId`
- **IF** they do not match, **THEN** `403 Forbidden` is returned and no trip data is exposed

### Scenario: Delete trip
- **WHEN** an authenticated user deletes a trip
- **THEN** ownership is verified before deletion
- **IF** the trip does not belong to the user, **THEN** `403 Forbidden` is returned

---

## Requirement: Personalized Dashboard

### Scenario: Authenticated user visits `/`
- **THEN** the dashboard displays the user's name and avatar from the session
- **AND** fetches and displays only the user's trips from the backend

### Scenario: No trips yet
- **WHEN** the user has no saved trips
- **THEN** a prompt is shown encouraging them to create their first trip

### Scenario: Header state
- **WHILE** a valid session exists → show user avatar + "Sign Out" button
- **WHILE** no session exists → show "Sign In" button

---

## Requirement: Backend API Authentication

### Scenario: Authenticated request
- **WHEN** the frontend sends a request to `/trips` with a valid Bearer token in the `Authorization` header
- **THEN** the backend extracts `profileId` from the token and scopes all queries to that profile

### Scenario: Missing or invalid token
- **WHEN** a request to `/trips` has no valid Bearer token
- **THEN** the backend returns `401 Unauthorized`
