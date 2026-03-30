## 1. API Contract Adoption
- [x] 1.1 Add frontend types for `tripScope`, `destinations`, and `routeGeoJson`
- [x] 1.2 Add grouped suggestion types for flight legs and destination hotels
- [x] 1.3 Keep backward compatibility for existing single-city itinerary payloads

## 2. Multi-Destination Overview UI
- [x] 2.1 Add a destination sequence section (ordered stops with dates and nights)
- [x] 2.2 Add per-leg flight cards linked to the matching destination pair
- [x] 2.3 Add per-stop hotel cards linked to the matching destination
- [x] 2.4 Add graceful empty states per section if no suggestions are returned

## 3. Map Visualization
- [x] 3.1 Add MapLibre client component for itinerary route rendering
- [x] 3.2 Render stop markers with order labels and hover/selection behavior
- [x] 3.3 Render route LineString from `routeGeoJson` or derived coordinates fallback
- [x] 3.4 Lazy-load map to avoid blocking itinerary initial render

## 4. UX and Performance
- [x] 4.1 Keep city-trip overview behavior unchanged
- [x] 4.2 Ensure mobile layout works for cards + map stack
- [x] 4.3 Limit default suggestion count (top 3 flights, top 5 hotels) for readability

## 5. Validation
- [ ] 5.1 Run `npm run lint` (currently blocked by ESLint config error: `nextVitals is not iterable`)
- [x] 5.2 Run `npm run build`
- [ ] 5.3 Manually test one city trip and one country trip with 3+ destinations
