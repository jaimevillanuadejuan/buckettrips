## ADDED Requirements

### Requirement: Prevent Invalid Date Range In Date Step
The system SHALL prevent continuing when trip end date is earlier than trip start date in the date selection form.

#### Scenario: End date earlier than start date
- **WHEN** a user selects a start date and an earlier end date
- **THEN** the form displays this red warning below the date inputs:
  - `End Date can't be set to a day before Start date. Please select a date later than [Start Date].`
- **AND** form submission is blocked

#### Scenario: Valid date range
- **WHEN** a user selects both dates and `endDate` is equal to or later than `startDate`
- **THEN** the form allows navigation to the next step

#### Scenario: Missing date values
- **WHEN** either start date or end date is missing at submit time
- **THEN** the form displays the required-date validation message
