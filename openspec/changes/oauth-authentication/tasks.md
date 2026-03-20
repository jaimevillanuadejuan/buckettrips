## 1. Prisma Schema
- [ ] 1.1 Add `Profile` model with `id`, `oauthProvider`, `oauthId`, `email`, `name`, `avatarUrl`, `createdAt`, `updatedAt` and unique constraint on `(oauthProvider, oauthId)`
- [ ] 1.2 Add `profileId` foreign key to `Trip` model with cascade delete relation to `Profile`
- [ ] 1.3 Run `prisma migrate dev` (or `prisma db push`) to apply schema changes

## 2. NextAuth.js Setup (Frontend)
- [ ] 2.1 Install `next-auth` and configure `auth.ts` with Google and GitHub providers
- [ ] 2.2 Add `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_ID`, `GITHUB_SECRET` to `.env`
- [ ] 2.3 Create `/app/api/auth/[...nextauth]/route.ts` handler
- [ ] 2.4 Implement `signIn` callback to upsert `Profile` in the database on every sign-in
- [ ] 2.5 Encode `profileId` into the JWT session token so it's available on the frontend and forwardable to the backend

## 3. Route Protection (Frontend)
- [ ] 3.1 Add `middleware.ts` at the project root to protect `/my-trips`, `/new-trip`, and all sub-routes
- [ ] 3.2 Preserve `callbackUrl` on redirect to sign-in page

## 4. Sign-In Page (Frontend)
- [ ] 4.1 Create `/app/sign-in/page.tsx` with Google and GitHub sign-in buttons
- [ ] 4.2 Display OAuth error message when `error` query param is present

## 5. Header Updates (Frontend)
- [ ] 5.1 Show authenticated user avatar and "Sign Out" button when session exists
- [ ] 5.2 Show "Sign In" button when no session exists

## 6. Dashboard Updates (Frontend)
- [ ] 6.1 Display user name and avatar on `/` when authenticated
- [ ] 6.2 Fetch trips from backend with Bearer token in `Authorization` header
- [ ] 6.3 Show empty-state prompt when user has no trips

## 7. Backend API Authentication
- [ ] 7.1 Add JWT verification middleware to the Express app that validates the Bearer token on all `/trips` routes
- [ ] 7.2 Extract `profileId` from the verified token and attach it to `req.user`
- [ ] 7.3 Return `401 Unauthorized` for missing or invalid tokens

## 8. Backend Trip Ownership Enforcement
- [ ] 8.1 Scope `GET /trips` to return only trips matching `req.user.profileId`
- [ ] 8.2 Scope `GET /trips/:id` to verify `trip.profileId === req.user.profileId`, return `403` on mismatch
- [ ] 8.3 Scope `DELETE /trips/:id` to verify ownership before deletion, return `403` on mismatch
- [ ] 8.4 Require `profileId` on `POST /trips` and associate the new trip with the authenticated user

## 9. Validation
- [ ] 9.1 Sign in with Google — verify profile created and dashboard shows user info
- [ ] 9.2 Sign in with GitHub — verify profile created and dashboard shows user info
- [ ] 9.3 Verify unauthenticated access to `/my-trips` redirects to sign-in with `callbackUrl`
- [ ] 9.4 Verify cross-user trip access returns `403`
- [ ] 9.5 Verify sign-out invalidates session and redirects to home
