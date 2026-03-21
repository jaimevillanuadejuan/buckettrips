export interface BudgetRange {
  low: number;
  high: number;
}

export interface TripOverview {
  destination: string;
  travelWindow: string;
  planningStyle: string;
  currencyCode: string;
  currencySymbol: string;
  keyAssumptions: string[];
}

export interface ItineraryDay {
  day: number;
  date: string;
  focus: string;
  morning: string[];
  afternoon: string[];
  evening: string[];
  estimatedBudgetEur: BudgetRange;
  budgetTips: string[];
  logisticsNotes: string[];
  reservationAlerts: string[];
}

export interface FollowUpQuestion {
  question: string;
  whyItMatters: string;
}

export interface TripItinerary {
  tripOverview: TripOverview;
  dailyItinerary: ItineraryDay[];
  overallBudgetEstimateEur: BudgetRange & { notes: string[] };
  followUpQuestions: FollowUpQuestion[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function toStringArray(value: unknown): string[] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  if (Array.isArray(value)) {
    return value
      .filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0
      )
      .map((item) => item.trim());
  }

  return [];
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function normalizeBudgetRange(value: unknown): BudgetRange {
  if (!isObject(value)) {
    return { low: 0, high: 0 };
  }

  return {
    low: toNumber(value.low) ?? 0,
    high: toNumber(value.high) ?? 0,
  };
}

function findBudgetField(day: Record<string, unknown>): unknown {
  if (isObject(day.estimatedBudget)) return day.estimatedBudget;
  if (isObject(day.estimatedBudgetEur)) return day.estimatedBudgetEur;
  const entry = Object.entries(day).find(([k]) =>
    k.toLowerCase().startsWith("estimatedbudget")
  );
  return entry ? entry[1] : undefined;
}

function findOverallBudgetField(value: Record<string, unknown>): unknown {
  if (isObject(value.overallBudgetEstimate)) return value.overallBudgetEstimate;
  if (isObject(value.overallBudgetEstimateEur)) return value.overallBudgetEstimateEur;
  const entry = Object.entries(value).find(([k]) =>
    k.toLowerCase().startsWith("overallbudgetestimate")
  );
  return entry ? entry[1] : undefined;
}

function normalizeDay(day: unknown, index: number): ItineraryDay | null {
  if (!isObject(day)) {
    return null;
  }

  return {
    day: toNumber(day.day) ?? index + 1,
    date: typeof day.date === "string" ? day.date : "TBD",
    focus: typeof day.focus === "string" ? day.focus : "General exploration",
    morning: toStringArray(day.morning),
    afternoon: toStringArray(day.afternoon),
    evening: toStringArray(day.evening),
    estimatedBudgetEur: normalizeBudgetRange(findBudgetField(day)),
    budgetTips: toStringArray(day.budgetTips),
    logisticsNotes: toStringArray(day.logisticsNotes),
    reservationAlerts: toStringArray(day.reservationAlerts),
  };
}

function normalizeFollowUps(value: unknown): FollowUpQuestion[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (typeof entry === "string" && entry.trim().length > 0) {
        return {
          question: entry.trim(),
          whyItMatters: "Helps personalize activity priorities and pacing.",
        };
      }

      if (
        isObject(entry) &&
        typeof entry.question === "string" &&
        entry.question.trim().length > 0
      ) {
        return {
          question: entry.question.trim(),
          whyItMatters:
            typeof entry.whyItMatters === "string" &&
            entry.whyItMatters.trim().length > 0
              ? entry.whyItMatters.trim()
              : "Helps personalize activity priorities and pacing.",
        };
      }

      return null;
    })
    .filter((entry): entry is FollowUpQuestion => entry !== null);
}

export function normalizeTripItinerary(value: unknown): TripItinerary | null {
  if (typeof value === "string") {
    try {
      return normalizeTripItinerary(JSON.parse(value));
    } catch {
      return null;
    }
  }

  if (!isObject(value)) {
    return null;
  }

  const overview = isObject(value.tripOverview) ? value.tripOverview : null;
  const dailyRaw = Array.isArray(value.dailyItinerary)
    ? value.dailyItinerary
    : [];
  const overallBudgetRaw = findOverallBudgetField(value);
  const overallBudget = isObject(overallBudgetRaw) ? overallBudgetRaw : {};

  const normalized: TripItinerary = {
    tripOverview: {
      destination:
        overview && typeof overview.destination === "string"
          ? overview.destination
          : "Selected destination",
      travelWindow:
        overview && typeof overview.travelWindow === "string"
          ? overview.travelWindow
          : "Travel dates not specified",
      planningStyle:
        overview && typeof overview.planningStyle === "string"
          ? overview.planningStyle
          : "balanced, budget-aware planning",
      currencyCode:
        overview && typeof overview.currencyCode === "string" && overview.currencyCode.trim()
          ? overview.currencyCode.trim().toUpperCase()
          : "EUR",
      currencySymbol:
        overview && typeof overview.currencySymbol === "string" && overview.currencySymbol.trim()
          ? overview.currencySymbol.trim()
          : "€",
      keyAssumptions: toStringArray(overview?.keyAssumptions),
    },
    dailyItinerary: dailyRaw
      .map((day, index) => normalizeDay(day, index))
      .filter((day): day is ItineraryDay => day !== null),
    overallBudgetEstimateEur: {
      ...normalizeBudgetRange(overallBudget),
      notes: toStringArray(overallBudget.notes),
    },
    followUpQuestions: normalizeFollowUps(value.followUpQuestions),
  };

  if (normalized.dailyItinerary.length === 0) {
    return null;
  }

  return normalized;
}

export function isTripItinerary(value: unknown): value is TripItinerary {
  if (!isObject(value)) {
    return false;
  }

  const overview = value.tripOverview;
  const days = value.dailyItinerary;
  const overallBudget = findOverallBudgetField(value);
  const followUps = value.followUpQuestions;

  if (
    !isObject(overview) ||
    !isObject(overallBudget) ||
    !Array.isArray(days) ||
    !Array.isArray(followUps)
  ) {
    return false;
  }

  if (
    typeof overview.destination !== "string" ||
    typeof overview.travelWindow !== "string" ||
    typeof overview.planningStyle !== "string" ||
    !isStringArray(overview.keyAssumptions)
  ) {
    return false;
  }

  if (
    typeof overallBudget.low !== "number" ||
    typeof overallBudget.high !== "number" ||
    !isStringArray(overallBudget.notes)
  ) {
    return false;
  }

  return (
    days.every((day) => {
      if (!isObject(day)) return false;
      const budget = findBudgetField(day);
      if (!isObject(budget)) return false;

      return (
        typeof day.day === "number" &&
        typeof day.date === "string" &&
        typeof day.focus === "string" &&
        isStringArray(day.morning) &&
        isStringArray(day.afternoon) &&
        isStringArray(day.evening) &&
        typeof budget.low === "number" &&
        typeof budget.high === "number" &&
        isStringArray(day.budgetTips) &&
        isStringArray(day.logisticsNotes) &&
        isStringArray(day.reservationAlerts)
      );
    }) &&
    followUps.every(
      (question) =>
        isObject(question) &&
        typeof question.question === "string" &&
        typeof question.whyItMatters === "string"
    )
  );
}
