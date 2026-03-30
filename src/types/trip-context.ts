export interface TripContext {
  tripScope?: "CITY" | "COUNTRY";
  countryCode?: string | null;
  destination: {
    raw_input: string;
    resolved_region: string;
    confidence: number;
  };
  duration: {
    min: number;
    max: number;
  };
  travel_dates: {
    season: string;
    exact_start: string | null;
    exact_end: string | null;
  };
  companions: {
    type: string;
    count: number;
    children: boolean;
  };
  budget: {
    tier: string;
  };
  pace: {
    activity_level: number;
    spontaneity: number;
  };
  interests: string[];
  exclusions: string[];
  accommodation: {
    style: string;
    tier: string;
  };
  contextual_answers: Record<string, string>;
  confirmed: boolean;
  flightBudget: { amount: number; currency: string } | null;
  accommodationBudget: { amount: number; currency: string } | null;
  accommodationType: string | null;
  airlinePreferences: { preferred: string[]; avoided: string[] } | null;
  originCity: string | null;
}

export interface ContextualQuestion {
  id: string;
  question: string;
  answerType: "yes_no" | "a_b" | "free_text";
  options?: string[];
  whyItMatters: string;
}
