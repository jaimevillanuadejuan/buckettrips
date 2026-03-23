"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import type { SavedTripSummary } from "@/types/saved-trip";
import { apiFetch } from "@/lib/api";

export default function MyTripsPage() {
  const { data: session } = useSession();
  const profileId = session?.user?.profileId;
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
    if (!profileId) return;

    const loadTrips = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiFetch('/trips', {}, profileId);
        if (!response.ok) {
          console.error('[my-trips] fetch failed:', response.status);
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
  }, [profileId]);

  const handleDelete = async (tripId: string) => {
    try {
      setDeletingId(tripId);
      setError(null);

      const response = await apiFetch(`/trips/${tripId}`, { method: "DELETE" }, profileId);

      if (!response.ok && response.status !== 204) {
        throw new Error("Failed to delete trip");
      }

      setTrips((existing) => existing.filter((trip) => trip.id !== tripId));
    } catch (err) {
      console.error(err instanceof Error ? err.message : "Failed to delete trip");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full">
      <section
        className="rounded-2xl p-5 md:p-6"
        style={{ background: "rgba(12,45,72,0.07)", border: "1px solid rgba(12,45,72,0.13)" }}
      >
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>My Trips</h1>
        <p className="mt-2" style={{ color: "var(--foreground)", opacity: 0.7 }}>
          Saved itineraries are listed here from newest to oldest.
        </p>
      </section>

      {isLoading && (
        <p className="mt-6 font-semibold" style={{ color: "var(--foreground)" }}>
          Loading your saved trips...
        </p>
      )}

      {!isLoading && sortedTrips.length === 0 && (
        <section
          className="rounded-2xl p-5 md:p-6 mt-6"
          style={{ background: "rgba(12,45,72,0.07)", border: "1px solid rgba(12,45,72,0.13)" }}
        >
          <p style={{ color: "var(--foreground)", opacity: 0.75 }}>
            You don&apos;t have any saved trips yet.{" "}
            <Link
              href="/new-trip"
              className="font-semibold underline transition-opacity hover:opacity-70"
              style={{ color: "var(--foreground)" }}
            >
              Create a new trip
            </Link>
          </p>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mt-6">
        {sortedTrips.map((trip) => (
          <article
            key={trip.id}
            className="rounded-2xl p-5"
            style={{ background: "rgba(12,45,72,0.07)", border: "1px solid rgba(12,45,72,0.13)" }}
          >
            <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{trip.location}</h2>
            <p className="text-sm mt-1" style={{ color: "var(--foreground)", opacity: 0.75 }}>
              {new Date(trip.startDate).toISOString().split("T")[0]} to{" "}
              {new Date(trip.endDate).toISOString().split("T")[0]}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--foreground)", opacity: 0.5 }}>
              Saved: {new Date(trip.createdAt).toLocaleString()}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <Link href={`/my-trips/${trip.id}`} className="button inline-flex items-center justify-center">
                View
              </Link>
              <button type="button" className="button inline-flex items-center justify-center"
                disabled={deletingId === trip.id} onClick={() => void handleDelete(trip.id)}>
                {deletingId === trip.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
