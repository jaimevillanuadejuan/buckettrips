## Status: Implemented

## 1. Backend — continueConversation system prompt

- [x] 1.1 Add explicit 5-item required checklist (destination, exact_start, exact_end, companions, budget) that must all be satisfied before `nextStep: "confirm"` is allowed
- [x] 1.2 Add DATE CALCULATION RULE — LLM calculates YYYY-MM-DD from natural language and confirms with user
- [x] 1.3 Enumerate non-confirm phrases explicitly ("make the calculations", "sounds good", "sure", "ok", "that works", "yes", "great")

## 2. Frontend — VoiceTripBuilder.tsx

- [x] 2.1 Add `isExplicitConfirm` gate — only redirect when nextStep is "confirm" AND dates are present AND user utterance contains an explicit confirm phrase
