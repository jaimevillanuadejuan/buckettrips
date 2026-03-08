## 1. Save Integration
- [x] 1.1 Update loading page save handler to call backend `POST /api/trips`
- [x] 1.2 Include criteria + itinerary + provider/model metadata in save payload
- [x] 1.3 Show inline save success/error feedback and `View my trips` shortcut
- [x] 1.4 Prevent duplicate save clicks while request is pending

## 2. My Trips Views
- [x] 2.1 Add `/my-trips` list view consuming backend `GET /api/trips`
- [x] 2.2 Add delete action calling backend `DELETE /api/trips/:tripId`
- [x] 2.3 Add `/my-trips/[tripId]` detail view consuming `GET /api/trips/:tripId`
- [x] 2.4 Render saved itinerary in read-only mode on detail page

## 3. Navigation And Types
- [x] 3.1 Add `My Trips` link in global header
- [x] 3.2 Add shared saved-trip frontend types
- [x] 3.3 Reuse existing itinerary renderer for both generated and saved flows

## 4. Validation
- [x] 4.1 Run lint
- [x] 4.2 Run typecheck/build
- [ ] 4.3 Manual verify save/list/detail/delete against backend on port `8080`
