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
  tripScope?: "CITY" | "COUNTRY";
  countryCode?: string | null;
}

export interface DestinationStop {
  stopOrder: number;
  cityName: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  nights: number;
}

export interface TripLeg {
  legOrder: number;
  fromStopOrder: number;
  toStopOrder: number;
  fromName: string;
  toName: string;
  mode: "flight" | "train";
  departureDate: string;
}

export interface RouteGeoJson {
  type: "Feature";
  geometry: {
    type: "LineString";
    coordinates: number[][];
  };
  properties?: Record<string, unknown>;
}

export interface FlightOption {
  airline: string;
  airlineLogo: string;
  price: number;
  currency: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  deepLinkUrl: string;
}

export interface FlightSuggestionsByLeg {
  legOrder: number;
  fromStopOrder: number;
  toStopOrder: number;
  fromName: string;
  toName: string;
  mode: "flight" | "train";
  departureDate: string;
  adjustedFromDate: string | null;
  fallbackBookingUrl: string | null;
  options: FlightOption[];
}

export interface HotelOption {
  name: string;
  stars: number | null;
  overallRating: number | null;
  reviews: number | null;
  pricePerNight: number | null;
  currency: string;
  thumbnailUrl: string | null;
  deepLinkUrl: string | null;
  amenities: string[];
}

export interface HotelSuggestionsByDestination {
  stopOrder: number;
  cityName: string;
  countryCode: string;
  checkIn: string;
  checkOut: string;
  options: HotelOption[];
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
  destinations: DestinationStop[];
  tripLegs: TripLeg[];
  routeGeoJson: RouteGeoJson | null;
  flightSuggestionsByLeg: FlightSuggestionsByLeg[];
  hotelSuggestionsByDestination: HotelSuggestionsByDestination[];
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

function normalizeDestinationStop(
  value: unknown,
  index: number,
): DestinationStop | null {
  if (!isObject(value)) return null;

  const cityName =
    typeof value.cityName === "string" ? value.cityName.trim() : "";
  const countryCode =
    typeof value.countryCode === "string" ? value.countryCode.trim().toUpperCase() : "";
  const latitude = toNumber(value.latitude);
  const longitude = toNumber(value.longitude);

  if (
    cityName.length === 0 ||
    countryCode.length === 0 ||
    latitude === null ||
    longitude === null
  ) {
    return null;
  }

  return {
    stopOrder: toNumber(value.stopOrder) ?? index + 1,
    cityName,
    countryCode,
    latitude,
    longitude,
    startDate: typeof value.startDate === "string" ? value.startDate : "TBD",
    endDate: typeof value.endDate === "string" ? value.endDate : "TBD",
    nights: toNumber(value.nights) ?? 0,
  };
}

function normalizeTripLeg(value: unknown, index: number): TripLeg | null {
  if (!isObject(value)) return null;

  const fromName = typeof value.fromName === "string" ? value.fromName.trim() : "";
  const toName = typeof value.toName === "string" ? value.toName.trim() : "";
  const modeRaw = typeof value.mode === "string" ? value.mode.toLowerCase() : "flight";

  if (fromName.length === 0 || toName.length === 0) {
    return null;
  }

  return {
    legOrder: toNumber(value.legOrder) ?? index + 1,
    fromStopOrder: toNumber(value.fromStopOrder) ?? index + 1,
    toStopOrder: toNumber(value.toStopOrder) ?? index + 2,
    fromName,
    toName,
    mode: modeRaw === "train" ? "train" : "flight",
    departureDate:
      typeof value.departureDate === "string" ? value.departureDate : "TBD",
  };
}

function normalizeRouteGeoJson(value: unknown): RouteGeoJson | null {
  if (!isObject(value)) return null;
  if (value.type !== "Feature") return null;
  if (!isObject(value.geometry) || value.geometry.type !== "LineString") return null;
  if (!Array.isArray(value.geometry.coordinates)) return null;

  const coordinates = value.geometry.coordinates
    .map((pair) => {
      if (!Array.isArray(pair) || pair.length < 2) return null;
      const lng = toNumber(pair[0]);
      const lat = toNumber(pair[1]);
      if (lng === null || lat === null) return null;
      return [lng, lat];
    })
    .filter((pair): pair is number[] => pair !== null);

  if (coordinates.length < 2) return null;

  return {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates,
    },
    properties: isObject(value.properties) ? value.properties : {},
  };
}

function normalizeFlightOption(value: unknown): FlightOption | null {
  if (!isObject(value)) return null;
  return {
    airline: typeof value.airline === "string" ? value.airline : "Unknown airline",
    airlineLogo: typeof value.airlineLogo === "string" ? value.airlineLogo : "",
    price: toNumber(value.price) ?? 0,
    currency: typeof value.currency === "string" ? value.currency : "USD",
    departureTime: typeof value.departureTime === "string" ? value.departureTime : "",
    arrivalTime: typeof value.arrivalTime === "string" ? value.arrivalTime : "",
    duration: typeof value.duration === "string" ? value.duration : "",
    stops: toNumber(value.stops) ?? 0,
    deepLinkUrl: typeof value.deepLinkUrl === "string" ? value.deepLinkUrl : "",
  };
}

function normalizeFlightSuggestionsByLeg(value: unknown): FlightSuggestionsByLeg[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry, index): FlightSuggestionsByLeg | null => {
      if (!isObject(entry)) return null;
      const options = Array.isArray(entry.options)
        ? entry.options
            .map((option) => normalizeFlightOption(option))
            .filter((option): option is FlightOption => option !== null)
        : [];

      return {
        legOrder: toNumber(entry.legOrder) ?? index + 1,
        fromStopOrder: toNumber(entry.fromStopOrder) ?? index + 1,
        toStopOrder: toNumber(entry.toStopOrder) ?? index + 2,
        fromName: typeof entry.fromName === "string" ? entry.fromName : "Origin",
        toName: typeof entry.toName === "string" ? entry.toName : "Destination",
        mode:
          typeof entry.mode === "string" && entry.mode.toLowerCase() === "train"
            ? "train"
            : "flight",
        departureDate:
          typeof entry.departureDate === "string" ? entry.departureDate : "TBD",
        adjustedFromDate:
          typeof entry.adjustedFromDate === "string"
            ? entry.adjustedFromDate
            : null,
        fallbackBookingUrl:
          typeof entry.fallbackBookingUrl === "string"
            ? entry.fallbackBookingUrl
            : null,
        options,
      };
    })
    .filter((entry): entry is FlightSuggestionsByLeg => entry !== null);
}

function normalizeHotelOption(value: unknown): HotelOption | null {
  if (!isObject(value)) return null;
  return {
    name: typeof value.name === "string" ? value.name : "Hotel",
    stars: toNumber(value.stars),
    overallRating: toNumber(value.overallRating),
    reviews: toNumber(value.reviews),
    pricePerNight: toNumber(value.pricePerNight),
    currency: typeof value.currency === "string" ? value.currency : "USD",
    thumbnailUrl:
      typeof value.thumbnailUrl === "string" ? value.thumbnailUrl : null,
    deepLinkUrl: typeof value.deepLinkUrl === "string" ? value.deepLinkUrl : null,
    amenities: toStringArray(value.amenities),
  };
}

function normalizeHotelSuggestionsByDestination(
  value: unknown,
): HotelSuggestionsByDestination[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry, index) => {
      if (!isObject(entry)) return null;
      const options = Array.isArray(entry.options)
        ? entry.options
            .map((option) => normalizeHotelOption(option))
            .filter((option): option is HotelOption => option !== null)
        : [];
      return {
        stopOrder: toNumber(entry.stopOrder) ?? index + 1,
        cityName: typeof entry.cityName === "string" ? entry.cityName : "City",
        countryCode:
          typeof entry.countryCode === "string"
            ? entry.countryCode.toUpperCase()
            : "",
        checkIn: typeof entry.checkIn === "string" ? entry.checkIn : "TBD",
        checkOut: typeof entry.checkOut === "string" ? entry.checkOut : "TBD",
        options,
      };
    })
    .filter((entry): entry is HotelSuggestionsByDestination => entry !== null);
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
  const destinationsRaw = Array.isArray(value.destinations) ? value.destinations : [];
  const tripLegsRaw = Array.isArray(value.tripLegs) ? value.tripLegs : [];

  const tripScopeRaw =
    overview && typeof overview.tripScope === "string"
      ? overview.tripScope.toUpperCase()
      : "CITY";
  const tripScope = tripScopeRaw === "COUNTRY" ? "COUNTRY" : "CITY";
  const countryCode =
    overview &&
    typeof overview.countryCode === "string" &&
    overview.countryCode.trim().length > 0
      ? overview.countryCode.trim().toUpperCase()
      : null;

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
          : "USD",
      currencySymbol:
        overview && typeof overview.currencySymbol === "string" && overview.currencySymbol.trim()
          ? overview.currencySymbol.trim()
          : "$",
      keyAssumptions: toStringArray(overview?.keyAssumptions),
      tripScope,
      countryCode,
    },
    dailyItinerary: dailyRaw
      .map((day, index) => normalizeDay(day, index))
      .filter((day): day is ItineraryDay => day !== null),
    overallBudgetEstimateEur: {
      ...normalizeBudgetRange(overallBudget),
      notes: toStringArray(overallBudget.notes),
    },
    followUpQuestions: normalizeFollowUps(value.followUpQuestions),
    destinations: destinationsRaw
      .map((entry, index) => normalizeDestinationStop(entry, index))
      .filter((entry): entry is DestinationStop => entry !== null),
    tripLegs: tripLegsRaw
      .map((entry, index) => normalizeTripLeg(entry, index))
      .filter((entry): entry is TripLeg => entry !== null),
    routeGeoJson: normalizeRouteGeoJson(value.routeGeoJson),
    flightSuggestionsByLeg: normalizeFlightSuggestionsByLeg(
      value.flightSuggestionsByLeg,
    ),
    hotelSuggestionsByDestination: normalizeHotelSuggestionsByDestination(
      value.hotelSuggestionsByDestination,
    ),
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
