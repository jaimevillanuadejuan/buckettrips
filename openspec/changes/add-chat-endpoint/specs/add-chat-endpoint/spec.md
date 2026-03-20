# Add Chat + Refine Endpoints

## Overview
Two new backend endpoints added to support free-form travel chat and post-generation itinerary refinement. Both use Groq `llama-3.3-70b-versatile` and inject full conversation history into the prompt.

---

## Requirement: POST /trips/chat

### Purpose
General-purpose travel chat. Used by `ChatView` (new trip flow) and `TripRefinementChat` intro message.

### Request
```json
{
  "message": "string",
  "history": [{ "role": "user | agent", "text": "string" }]
}
```

### Response
```json
{ "reply": "string" }
```

### Behavior
- System prompt instructs the LLM to act as a warm travel companion
- Full `history` injected as conversation context
- Robotic phrases blocked — `naturalFallback()` applied if detected
- Temperature: `0.7` (more conversational)
- Timeout: 20s

### Scenario: Small talk
- **WHEN** user sends "hey how's it going"
- **THEN** reply is warm, casual, pivots naturally to travel

### Scenario: Trip planning intent
- **WHEN** user describes a trip idea
- **THEN** reply engages with the idea and asks one follow-up question

---

## Requirement: POST /trips/refine

### Purpose
Modify an existing generated itinerary based on a natural language request. Used by `TripRefinementChat` on itinerary and my-trips detail views.

### Request
```json
{
  "itinerary": { ...TripItinerary },
  "message": "string",
  "history": [{ "role": "user | agent", "text": "string" }]
}
```

### Response
```json
{
  "reply": "string",
  "itinerary": { ...updated TripItinerary }
}
```

### Behavior
- System prompt instructs LLM to return `{ reply, itinerary }` — only modify what was asked
- `reply` is a short natural confirmation of the change (1-2 sentences)
- `itinerary` preserves the same JSON shape as the input
- Temperature: `0.35` (more precise)
- Timeout: 20s

### Scenario: Day swap
- **WHEN** user says "swap Day 3 to focus on cenotes"
- **THEN** `reply` confirms the change naturally: "Done! Swapped Day 3 to cenotes and jungle hikes."
- **AND** `itinerary.dailyItinerary[2]` is updated accordingly

### Scenario: No change needed
- **WHEN** user says "looks good, I'm happy with it"
- **THEN** `reply` responds naturally to the sentiment
- **AND** `itinerary` is returned unchanged

---

## LLM Configuration
| Setting | Value |
|---|---|
| Provider | Groq |
| Model | `llama-3.3-70b-versatile` |
| API key env var | `GROQ_API_KEY` |
| Chat temperature | `0.7` |
| Refine temperature | `0.35` |
| Timeout | `20000ms` |
