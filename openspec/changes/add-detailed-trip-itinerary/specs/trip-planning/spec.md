## ADDED Requirements

### Requirement: Generate A Structured Itinerary From Selected Trip Criteria
The system SHALL generate a detailed itinerary when the user has selected destination, start date, end date, and theme.

#### Scenario: Successful itinerary generation
- **WHEN** the client sends valid `location`, `startDate`, `endDate`, and `theme` to backend repo `buckettrips-backend` `POST /api/api-trips`
- **THEN** the API returns a structured itinerary response with day-by-day activities
- **AND** each day includes budget-aware recommendations and logistics notes
- **AND** activities align with the selected theme (`nature` or `historic`)

#### Scenario: Invalid input
- **WHEN** required fields are missing, malformed, or inconsistent (for example, start date after end date)
- **THEN** the API responds with an HTTP 400 error
- **AND** the response includes an actionable validation message

### Requirement: Budget-Friendly Travel Day Planning
The system SHALL optimize arrival and departure days for lower cost and lower complexity.

#### Scenario: Handling travel days
- **WHEN** generating the first and last day of the itinerary
- **THEN** the plan favors lighter activities and budget-conscious options
- **AND** the output includes practical notes on transport timing and reservation risk

### Requirement: Iterative Discovery Through Follow-Up Questions
The system SHALL include follow-up questions that help refine future itinerary iterations.

#### Scenario: Missing preference details
- **WHEN** user criteria is insufficient for deep personalization
- **THEN** the generated output includes 3 to 5 follow-up questions
- **AND** each question explains why it matters for planning quality

#### Scenario: Refining with user answers
- **WHEN** the client submits follow-up answers in `followUpAnswers` to backend repo `buckettrips-backend` `POST /api/api-trips`
- **THEN** the itinerary is regenerated using those answers as additional planning context
- **AND** the response still includes updated follow-up questions for a further iteration if needed

### Requirement: Render Human-Readable Itinerary Sections In UI
The system SHALL render the generated itinerary in structured sections rather than raw JSON whenever the response matches the expected itinerary schema.

#### Scenario: Structured itinerary display
- **WHEN** the loading page receives a valid itinerary object
- **THEN** the UI displays trip overview, budget summary, and day-by-day cards
- **AND** each day shows morning/afternoon/evening plans with logistics and reservation notes

#### Scenario: Budget summary integrated in overview card
- **WHEN** the trip overview is rendered
- **THEN** budget snapshot values are presented within the main overview container
- **AND** no nested budget sub-card/container is shown

#### Scenario: Near-schema response normalization
- **WHEN** the model returns near-schema JSON (for example string values where arrays or follow-up objects are expected)
- **THEN** the loading page normalizes the payload into the UI itinerary shape when possible
- **AND** the itinerary continues rendering as structured cards instead of raw JSON text fallback

### Requirement: Responsive Daily Card Grid Breakpoints
The system SHALL render itinerary daily cards with explicit responsive breakpoints.

#### Scenario: Mobile default layout
- **WHEN** viewport width is below `768px`
- **THEN** daily itinerary cards render in a single-column stack

#### Scenario: Tablet adaptive layout
- **WHEN** viewport width is at least `768px` and below `1280px`
- **THEN** daily itinerary cards start as one-per-row on narrower tablet widths
- **AND** expand up to two-per-row when horizontal space allows

#### Scenario: Desktop fixed three-column layout
- **WHEN** viewport width is at least `1280px`
- **THEN** daily itinerary cards render in three columns per row

### Requirement: Compact Interactive Daily Cards
The system SHALL present daily itinerary cards in a compact state by default and reveal full details on user interaction.

#### Scenario: Compact default card
- **WHEN** itinerary cards are initially rendered
- **THEN** each card shows only day label, formatted date, and daily planning title
- **AND** card height is capped for visual consistency

#### Scenario: Expand card details with animation
- **WHEN** a user clicks a daily card container
- **THEN** the card expands with a smooth animation to reveal detailed sections
- **AND** expanded card content remains scrollable within a practical max-height
- **AND** on desktop the expanded card can span additional horizontal space

#### Scenario: Date label and contrast improvements
- **WHEN** daily card headers are rendered
- **THEN** dates are formatted as `Month DayOrdinal` (for example `Feb 15th`)
- **AND** daily planning titles use a dedicated high-contrast accent color token from global theme variables

### Requirement: Show Save Trip UI Affordance Before Persistence Rollout
The system SHALL expose a Save Trip button in the itinerary view before backend persistence is implemented.

#### Scenario: Save button placeholder behavior
- **WHEN** a generated itinerary is visible and the user clicks `Save Trip`
- **THEN** the UI shows a temporary message that saving will be enabled with the future My Trips backend
- **AND** no persistence API call is made in this change
- **AND** actual storage to database is out of scope for this change and tracked in a separate follow-up change


