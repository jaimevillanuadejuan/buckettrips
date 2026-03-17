## 1. Implementation
- [ ] 1.1 Replace `/new-trip` entry with conversational question-by-question shell
- [ ] 1.2 Implement phase-aware conversational prompts and response bubbles
- [ ] 1.3 Add new input widgets: budget spectrum, pace dual-axis, interest grid, exclusion chips, accommodation cards
- [ ] 1.4 Integrate backend `parse-intent` endpoint in spark phase
- [ ] 1.5 Integrate backend `contextual-questions` endpoint in craft phase
- [ ] 1.6 Integrate backend `style-filter` endpoint for accommodation options
- [ ] 1.7 Build and persist `TripContext` object in session
- [ ] 1.8 Update `/new-trip/loading` to call backend `POST /api/trips/confirm`
- [ ] 1.9 Keep iterative follow-up regeneration loop using `followUpAnswers` against `confirm`

## 2. Validation
- [ ] 2.1 `npm run lint`
- [ ] 2.2 Manual happy-path run through all 5 phases
- [ ] 2.3 Manual refinement loop validation from loading page
