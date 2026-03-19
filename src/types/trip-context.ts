export interface TripContext {
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
}

export interface ContextualQuestion {
  id: string;
  question: string;
  answerType: 'yes_no' | 'a_b' | 'free_text';
  options?: string[];
  whyItMatters: string;
}
