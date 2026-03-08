## ADDED Requirements

### Requirement: Save Generated Itineraries To Backend
The system SHALL allow users to save generated itineraries from the loading flow to the backend persistence API.

#### Scenario: Save success
- **WHEN** a valid itinerary is visible and the user clicks `Save Trip`
- **THEN** the frontend sends `POST /api/trips` to the configured backend base URL
- **AND** includes `location`, `startDate`, `endDate`, `theme`, `provider`, `model`, and `itinerary`
- **AND** the UI shows a success message with a shortcut to `/my-trips`

#### Scenario: Save failure
- **WHEN** backend save returns an error or is unreachable
- **THEN** the frontend keeps the user on the same page
- **AND** shows a non-blocking inline error message
- **AND** avoids duplicate concurrent saves by disabling the button while pending

### Requirement: Show Saved Trips List
The system SHALL provide a dedicated `/my-trips` page listing saved trips.

#### Scenario: List available trips
- **WHEN** the user opens `/my-trips`
- **THEN** the frontend requests `GET /api/trips`
- **AND** renders trip cards with summary metadata and actions

#### Scenario: Empty state
- **WHEN** no trips are returned
- **THEN** the UI shows an empty-state guidance message

### Requirement: Show Saved Trip Detail
The system SHALL provide a detail page for each saved trip at `/my-trips/[tripId]`.

#### Scenario: View saved itinerary
- **WHEN** a trip exists for the given ID
- **THEN** the frontend requests `GET /api/trips/:tripId`
- **AND** renders itinerary sections in read-only mode

#### Scenario: Missing trip
- **WHEN** the requested trip ID does not exist
- **THEN** the UI shows a clear not-found error state

### Requirement: Delete Saved Trip
The system SHALL allow deleting saved trips from the list view.

#### Scenario: Delete success
- **WHEN** the user clicks `Delete` on a trip card
- **THEN** the frontend calls `DELETE /api/trips/:tripId`
- **AND** removes the card from the current list without full-page reload

### Requirement: Global Navigation To My Trips
The system SHALL expose navigation to `my-trips` in the global header.

#### Scenario: Navigate from header
- **WHEN** any page is rendered with the shared header
- **THEN** a `My Trips` link is visible
- **AND** clicking it opens `/my-trips`
