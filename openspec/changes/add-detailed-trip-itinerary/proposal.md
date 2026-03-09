# Proposal: Add Detailed AI Trip Itinerary Generation

## Why
The current `new-trip` loading flow collects destination, dates, and theme from URL params, but no itinerary is generated yet. The backend itinerary endpoint needs to own the full provider call so users receive a complete plan and follow-up questions for refining preferences.

## What Changes
- Implement backend repo `buckettrips-backend` `POST /api/api-trips` to:
  - validate `location`, `startDate`, `endDate`, and `theme`
  - build a detailed travel-advisor prompt using the selected criteria
  - call OpenRouter and return a structured itinerary result
- Update `/new-trip/loading` page to call backend `POST /api/api-trips` using URL-derived criteria.
- Extend loading UI so it displays generated itinerary cards or errors.
- Add iterative planning support by asking follow-up questions in the model response.
- Normalize near-schema AI responses so itinerary cards render even when some fields arrive as strings instead of arrays/objects.
- Apply explicit responsive card layout breakpoints for itinerary results:
  - mobile default: 1 card per row
  - tablet (`min-width: 768px`): auto-fit from 1 to 2 cards per row based on available space
  - desktop (`min-width: 1280px`): 3 cards per row
- Make daily itinerary cards compact by default with click-to-expand interaction and smooth animation.
- Format day dates as `Month DayOrdinal` (for example `Feb 15th`) in card headers.
- Use a dedicated high-contrast day-title accent color token from `globals.css` to improve readability.
- Present budget snapshot directly in the main trip overview card (no nested sub-container).

## Impact
- Users receive an end-to-end itinerary draft instead of a placeholder loading screen.
- Generated plans are theme-aware (`nature`/`historic`) and budget-oriented.
- Portfolio quality improves by showing a documented, spec-first workflow and a production-style API prompt design.



