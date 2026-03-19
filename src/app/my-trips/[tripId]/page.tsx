"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Itinerary from "@/components/Itinerary/Itinerary";
import { normalizeTripItinerary } from "@/types/itinerary";
import type { SavedTripDetail } from "@/types/saved-trip";

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080/api";

export default function MyTripDetailPage() {
  const params = useParams<{ tripId: string }>();
  const tripId = params.tripId;
  const [trip, setTrip] = useState<SavedTripDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const normalizedItinerary = normalizeTripItinerary(trip?.itinerary ?? null);

  useEffect(() => {
    if (!tripId) {
      return;
    }

    const loadTrip = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${BACKEND_BASE_URL}/trips/${tripId}`);

        if (response.status === 404) {
          throw new Error("Trip not found");
        }

        if (!response.ok) {
          throw new Error("Failed to load trip");
        }

        const data = (await response.json()) as SavedTripDetail;
        setTrip(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load trip");
      } finally {
        setIsLoading(false);
      }
    };

    void loadTrip();
  }, [tripId]);

  return (
    <div className="w-full">
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white font-semibold transition-opacity hover:opacity-85"
        >
          <span aria-hidden="true">&larr;</span>
          <span>Dashboard</span>
        </Link>
      </div>

      {isLoading && (
        <p className="text-background-fourth mt-6 font-semibold">
          Loading trip...
        </p>
      )}

      {error && <p className="text-red-400 mt-6 font-semibold">{error}</p>}

      {!isLoading && trip && normalizedItinerary && (
        <Itinerary
          itinerary={normalizedItinerary}
          isSubmitting={false}
          readOnly
          onSubmitFollowUpAnswers={() => undefined}
        />
      )}

      {!isLoading && trip && !normalizedItinerary && (
        <section className="surface-card rounded-2xl p-5 md:p-6 mt-6">
          <p className="text-red-300">
            This saved itinerary format is invalid and cannot be rendered.
          </p>
        </section>
      )}
    </div>
  );
}
