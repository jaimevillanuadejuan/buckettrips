export interface SavedTripSummary {
  id: string;
  location: string;
  theme: "nature" | "historic";
  startDate: string;
  endDate: string;
  provider?: string | null;
  model?: string | null;
  createdAt: string;
}

export interface SavedTripDetail extends SavedTripSummary {
  updatedAt: string;
  itinerary: unknown;
}

export interface SaveTripResult {
  status: "success" | "error" | "info";
  message: string;
  showMyTripsLink?: boolean;
}
