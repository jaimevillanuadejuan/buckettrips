"use client";

import { useEffect, useState } from "react";

interface FlightResult {
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

interface FlightResultsProps {
  destination: string;
  startDate: string;
  endDate: string;
  originCity?: string | null;
  flightBudget?: { amount: number; currency: string } | null;
}

function formatTime(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function SkeletonCard() {
  return (
    <div
      className="rounded-xl p-4 animate-pulse"
      style={{ background: "rgba(12,45,72,0.07)", border: "1px solid rgba(12,45,72,0.13)" }}
    >
      <div className="h-4 rounded w-1/3 mb-3" style={{ background: "rgba(12,45,72,0.12)" }} />
      <div className="h-3 rounded w-1/2 mb-2" style={{ background: "rgba(12,45,72,0.08)" }} />
      <div className="h-3 rounded w-1/4" style={{ background: "rgba(12,45,72,0.08)" }} />
    </div>
  );
}

export default function FlightResults({
  destination,
  startDate,
  endDate,
  originCity,
  flightBudget,
}: FlightResultsProps) {
  const [flights, setFlights] = useState<FlightResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [resolvedOrigin, setResolvedOrigin] = useState<string | null>(originCity ?? null);
  // Currency from user's home country (detected via IP), used when no flightBudget currency is set
  const [originCurrency, setOriginCurrency] = useState<string | null>(null);

  // Resolve origin city + currency via IP geolocation if not provided by conversation
  useEffect(() => {
    if (originCity) {
      setResolvedOrigin(originCity);
      // Still detect currency even if city is known
    }
    const detect = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (!res.ok) return;
        const data = (await res.json()) as { city?: string; currency?: string };
        if (!originCity && data.city) setResolvedOrigin(data.city);
        if (data.currency) setOriginCurrency(data.currency);
      } catch {
        // silently fall through
      }
    };
    void detect();
  }, [originCity]);

  useEffect(() => {
    if (!resolvedOrigin) return;

    // Priority: explicit flightBudget currency > detected origin currency > USD
    const currency = flightBudget?.currency ?? originCurrency ?? "USD";

    const params = new URLSearchParams({
      origin: resolvedOrigin,
      destination,
      departureDate: startDate,
      returnDate: endDate,
      currency,
    });

    if (flightBudget) {
      params.set("budget", String(flightBudget.amount));
    }

    const fetchFlights = async () => {
      try {
        setLoading(true);
        setError(false);
        const res = await fetch(`/api/flights?${params.toString()}`);
        if (!res.ok) throw new Error("Failed");
        const data = (await res.json()) as FlightResult[];
        setFlights(Array.isArray(data) ? data : []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    void fetchFlights();
  }, [destination, startDate, endDate, resolvedOrigin, flightBudget, originCurrency]);

  return (
    <section className="mt-6">
      <h2
        className="text-lg font-semibold mb-3"
        style={{ color: "var(--foreground)" }}
      >
        ✈ Flights to {destination}
        {resolvedOrigin && (
          <span className="text-sm font-normal opacity-60 ml-2">from {resolvedOrigin}</span>
        )}
      </h2>

      {loading && (
        <div className="flex flex-col gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {!loading && (error || flights.length === 0) && (
        <div
          className="rounded-xl p-4 text-sm"
          style={{
            background: "rgba(12,45,72,0.07)",
            border: "1px solid rgba(12,45,72,0.13)",
            color: "var(--foreground)",
          }}
        >
          No flights found — try searching on{" "}
          <a
            href={`https://www.google.com/flights?q=flights+to+${encodeURIComponent(destination)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--color-background-third)" }}
            className="underline"
          >
            Google Flights
          </a>
          .
        </div>
      )}

      {!loading && !error && flights.length > 0 && (
        <div className="flex flex-col gap-3">
          {flights.map((flight, i) => (
            <div
              key={i}
              className="rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap"
              style={{
                background: "rgba(12,45,72,0.07)",
                border: "1px solid rgba(12,45,72,0.13)",
                color: "var(--foreground)",
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                {flight.airlineLogo ? (
                  <img
                    src={flight.airlineLogo}
                    alt={flight.airline}
                    width={32}
                    height={32}
                    className="rounded shrink-0 object-contain"
                    style={{ background: "rgba(12,45,72,0.06)", padding: "3px" }}
                  />
                ) : (
                  <span className="font-semibold text-sm truncate">{flight.airline}</span>
                )}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-semibold text-sm truncate">{flight.airline}</span>
                  <span className="text-xs opacity-70">
                    {formatTime(flight.departureTime)} → {formatTime(flight.arrivalTime)}
                    {" · "}
                    {flight.duration}
                    {" · "}
                    {flight.stops === 0 ? "Nonstop" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="font-bold text-base" style={{ color: "var(--color-background-third)" }}>
                  {flight.currency} {flight.price.toLocaleString()}
                </span>
                {flight.deepLinkUrl && (
                  <a
                    href={flight.deepLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-85"
                    style={{
                      background: "var(--color-background-third)",
                      color: "#fff",
                    }}
                  >
                    Book
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
