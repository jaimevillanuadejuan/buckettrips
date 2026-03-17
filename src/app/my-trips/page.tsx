"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { SavedTripSummary } from "@/types/saved-trip";

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080/api";

export default function MyTripsPage() {
  const [trips, setTrips] = useState<SavedTripSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sortedTrips = useMemo(
    () =>
      [...trips].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [trips]
  );

  useEffect(() => {
    const loadTrips = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${BACKEND_BASE_URL}/trips`);

        if (!response.ok) {
          throw new Error("Failed to load trips");
        }

        const data = (await response.json()) as SavedTripSummary[];
        setTrips(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load trips");
      } finally {
        setIsLoading(false);
      }
    };

    void loadTrips();
  }, []);

  const handleDelete = async (tripId: string) => {
    try {
      setDeletingId(tripId);
      setError(null);

      const response = await fetch(`${BACKEND_BASE_URL}/trips/${tripId}`, {
        method: "DELETE",
      });

      if (!response.ok && response.status !== 204) {
        throw new Error("Failed to delete trip");
      }

      setTrips((existing) => existing.filter((trip) => trip.id !== tripId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete trip");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full">
      <section className="surface-card rounded-2xl p-5 md:p-6">
        <h1 className="text-2xl font-bold text-white">My Trips</h1>
        <p className="text-slate-100 mt-2">
          Saved itineraries are listed here from newest to oldest.
        </p>
      </section>

      {isLoading && (
        <p className="text-background-fourth mt-6 font-semibold">
          Loading your saved trips...
        </p>
      )}

      {error && <p className="text-red-400 mt-6 font-semibold">{error}</p>}

      {!isLoading && sortedTrips.length === 0 && (
        <section className="surface-card rounded-2xl p-5 md:p-6 mt-6">
          <p className="text-slate-100">
            You do not have any saved trips yet. Generate one and click{" "}
            <span className="font-semibold">Save Trip</span>.
          </p>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mt-6">
        {sortedTrips.map((trip) => (
          <article key={trip.id} className="surface-card rounded-2xl p-5">
            <h2 className="text-lg font-bold text-white">{trip.location}</h2>
            <p className="text-sm text-slate-100 mt-1">
              {new Date(trip.startDate).toISOString().split("T")[0]} to{" "}
              {new Date(trip.endDate).toISOString().split("T")[0]}
            </p>
            <p className="text-sm text-slate-100 mt-1">Theme: {trip.theme}</p>
            <p className="text-xs text-slate-100 mt-1">
              Saved: {new Date(trip.createdAt).toLocaleString()}
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-4">
              <Link
                href={`/my-trips/${trip.id}`}
                className="button inline-flex items-center justify-center"
              >
                View
              </Link>
              <button
                type="button"
                className="button inline-flex items-center justify-center"
                disabled={deletingId === trip.id}
                onClick={() => void handleDelete(trip.id)}
              >
                {deletingId === trip.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
