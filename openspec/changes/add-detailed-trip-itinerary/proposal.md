# Proposal: Add Detailed AI Trip Itinerary Generation

## Why
The current `new-trip` loading flow collects destination, dates, and theme from URL params, but no itinerary is generated yet. The API route is stubbed, and users do not receive a complete plan or follow-up questions for refining preferences.

## What Changes
- Implement `POST /api/new-trip` to:
  - validate `location`, `startDate`, `endDate`, and `theme`
  - build a detailed travel-advisor prompt using the selected criteria
  - call Gemini and return a structured itinerary result
- Update `/new-trip/loading` page to call the API using URL-derived criteria.
- Extend loading UI so it displays generated itinerary output or errors.
- Add iterative planning support by asking follow-up questions in the model response.

## Impact
- Users receive an end-to-end itinerary draft instead of a placeholder loading screen.
- Generated plans are theme-aware (`nature`/`historic`) and budget-oriented.
- Portfolio quality improves by showing a documented, spec-first workflow and a production-style API prompt design.
