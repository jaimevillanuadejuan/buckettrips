# Proposal: Add Client Date-Range Validation In Date Selection Step

## Why
Users can currently submit the date step with an end date that is earlier than the start date and only see validation later in the API flow. The date step should catch this immediately and show a clear message.

## What Changes
- Add client-side validation in `Dates` form to block submit when `endDate < startDate`.
- Show a red inline warning below the date inputs:
  - `End Date can't be set to a day before Start date. Please select a date later than [Start Date].`
- Keep existing required-field validation.
- Keep server-side date validation unchanged as backend protection.

## Impact
- Prevents invalid date progression earlier in the flow.
- Reduces avoidable API requests with invalid criteria.
- Improves user feedback clarity in the date step.
