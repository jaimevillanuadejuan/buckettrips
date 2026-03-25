"use client";

import { useEffect, useState } from "react";

interface HotelResult {
  name: string;
  stars: number;
  overallRating: number;
  reviews: number;
  pricePerNight: number;
  currency: string;
  thumbnailUrl: string;
  deepLinkUrl: string;
  amenities: string[];
}

interface HotelResultsProps {
  destination: string;
  startDate: string;
  endDate: string;
  accommodationBudget?: { amount: number; currency: string } | null;
  guests?: number;
}

function SkeletonCard() {
  return (
    <div
      className="rounded-xl p-4 animate-pulse"
      style={{ background: "rgba(12,45,72,0.07)", border: "1px solid rgba(12,45,72,0.13)" }}
    >
      <div className="flex gap-3 mb-3">
        <div className="w-16 h-16 rounded-lg shrink-0" style={{ background: "rgba(12,45,72,0.12)" }} />
        <div className="flex-1">
          <div className="h-4 rounded w-2/3 mb-2" style={{ background: "rgba(12,45,72,0.12)" }} />
          <div className="h-3 rounded w-1/3 mb-2" style={{ background: "rgba(12,45,72,0.08)" }} />
          <div className="h-3 rounded w-1/2" style={{ background: "rgba(12,45,72,0.08)" }} />
        </div>
      </div>
      <div className="h-3 rounded w-3/4" style={{ background: "rgba(12,45,72,0.08)" }} />
    </div>
  );
}

export default function HotelResults({
  destination,
  startDate,
  endDate,
  accommodationBudget,
  guests = 2,
}: HotelResultsProps) {
  const [hotels, setHotels] = useState<HotelResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [originCurrency, setOriginCurrency] = useState<string | null>(null);

  // Detect home currency via IP geolocation
  useEffect(() => {
    const detect = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (!res.ok) return;
        const data = (await res.json()) as { currency?: string };
        if (data.currency) setOriginCurrency(data.currency);
      } catch {
        // silently fall through
      }
    };
    void detect();
  }, []);

  useEffect(() => {
    // Priority: accommodationBudget.currency > detected origin currency > USD
    const currency = accommodationBudget?.currency ?? originCurrency ?? "USD";

    const params = new URLSearchParams({
      destination,
      checkIn: startDate,
      checkOut: endDate,
      guests: String(guests),
      currency,
    });

    if (accommodationBudget) {
      params.set("budget", String(accommodationBudget.amount));
    }

    const fetchHotels = async () => {
      try {
        setLoading(true);
        setError(false);
        const res = await fetch(`/api/hotels?${params.toString()}`);
        if (!res.ok) throw new Error("Failed");
        const data = (await res.json()) as HotelResult[];
        setHotels(Array.isArray(data) ? data.slice(0, 5) : []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    void fetchHotels();
  }, [destination, startDate, endDate, guests, accommodationBudget, originCurrency]);

  return (
    <section className="mt-6 w-full text-left">
      <h2
        className="text-lg font-semibold mb-3"
        style={{ color: "var(--foreground)" }}
      >
        🏨 Hotels in {destination}
      </h2>

      {loading && (
        <div className="flex flex-col gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {!loading && (error || hotels.length === 0) && (
        <div
          className="rounded-xl p-4 text-sm"
          style={{
            background: "rgba(12,45,72,0.07)",
            border: "1px solid rgba(12,45,72,0.13)",
            color: "var(--foreground)",
          }}
        >
          No hotels found — try searching on{" "}
          <a
            href={`https://www.google.com/travel/hotels?q=${encodeURIComponent(destination)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--color-background-third)" }}
            className="underline"
          >
            Google Hotels
          </a>
          .
        </div>
      )}

      {!loading && !error && hotels.length > 0 && (
        <div className="flex flex-col gap-3">
          {hotels.map((hotel, i) => (
            <div
              key={i}
              className="rounded-xl p-4 flex items-start justify-between gap-4 flex-wrap"
              style={{
                background: "rgba(12,45,72,0.07)",
                border: "1px solid rgba(12,45,72,0.13)",
                color: "var(--foreground)",
              }}
            >
              <div className="flex gap-3 min-w-0 flex-1">
                {hotel.thumbnailUrl && (
                  <img
                    src={hotel.thumbnailUrl}
                    alt={hotel.name}
                    width={64}
                    height={64}
                    className="rounded-lg shrink-0 object-cover"
                    style={{ background: "rgba(12,45,72,0.06)" }}
                  />
                )}
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="font-semibold text-sm truncate">{hotel.name}</span>
                  <span className="text-xs opacity-70">
                    {hotel.stars != null && hotel.stars > 0 && "⭐".repeat(Math.min(hotel.stars, 5))}
                    {hotel.overallRating != null && hotel.overallRating > 0 && (
                      <span className="ml-1">
                        {hotel.overallRating != null && hotel.overallRating.toFixed(1)}
                        {hotel.reviews != null && hotel.reviews > 0 && (
                          <span className="opacity-60"> ({hotel.reviews.toLocaleString()} reviews)</span>
                        )}
                      </span>
                    )}
                  </span>
                  {hotel.amenities.length > 0 && (
                    <span className="text-xs opacity-60 truncate">
                      {hotel.amenities.slice(0, 3).join(" · ")}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="font-bold text-base block" style={{ color: "var(--color-background-third)" }}>
                    {hotel.pricePerNight != null
                      ? `${hotel.currency} ${hotel.pricePerNight.toLocaleString()}`
                      : "Price unavailable"}
                  </span>
                  <span className="text-xs opacity-60">per night</span>
                </div>
                {hotel.deepLinkUrl ? (
                  <a
                    href={hotel.deepLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-85"
                    style={{ background: "var(--color-background-third)", color: "#fff" }}
                  >
                    Book
                  </a>
                ) : (
                  <a
                    href={`https://www.google.com/travel/hotels?q=${encodeURIComponent(hotel.name + " " + destination)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-85"
                    style={{ background: "rgba(12,45,72,0.12)", color: "var(--foreground)" }}
                  >
                    Search
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
