export interface SavedTripSummary {
  id: string;
  location: string;
  startDate: string;
  endDate: string;
  provider?: string | null;
  model?: string | null;
  createdAt: string;
  scope?: "CITY" | "COUNTRY";
  countryCode?: string | null;
}

export interface SavedTripDetail extends SavedTripSummary {
  updatedAt: string;
  itinerary: unknown;
  originCity?: string | null;
  flightBudget?: { amount: number; currency: string } | null;
  accommodationBudget?: { amount: number; currency: string } | null;
  accommodationType?: string | null;
  routeGeoJson?: Record<string, unknown> | null;
  destinations?: Array<{
    stopOrder: number;
    cityName: string;
    countryCode: string;
    latitude: number;
    longitude: number;
    startDate?: string | null;
    endDate?: string | null;
    nights?: number | null;
  }>;
  legs?: Array<{
    legOrder: number;
    fromStopOrder: number;
    toStopOrder: number;
    mode: string;
    departureDate?: string | null;
  }>;
}

export interface SaveTripResult {
  status: "success" | "error" | "info";
  message: string;
  showMyTripsLink?: boolean;
}
