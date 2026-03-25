export interface SavedTripSummary {
  id: string;
  location: string;
  startDate: string;
  endDate: string;
  provider?: string | null;
  model?: string | null;
  createdAt: string;
}

export interface SavedTripDetail extends SavedTripSummary {
  updatedAt: string;
  itinerary: unknown;
  originCity?: string | null;
  flightBudget?: { amount: number; currency: string } | null;
  accommodationBudget?: { amount: number; currency: string } | null;
  accommodationType?: string | null;
}

export interface SaveTripResult {
  status: "success" | "error" | "info";
  message: string;
  showMyTripsLink?: boolean;
}
