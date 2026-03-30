"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  DestinationStop,
  FlightOption,
  FlightSuggestionsByLeg,
  HotelOption,
  HotelSuggestionsByDestination,
  TripItinerary,
  TripLeg,
} from "@/types/itinerary";

interface MultiDestinationOverviewProps {
  itinerary: TripItinerary;
  originCity?: string | null;
  flightBudget?: { amount: number; currency: string } | null;
  accommodationBudget?: { amount: number; currency: string } | null;
}

interface PlannedLeg {
  legOrder: number;
  fromStopOrder: number;
  toStopOrder: number;
  fromName: string;
  toName: string;
  mode: "flight" | "train";
  departureDate: string;
}

function formatDay(value: string): string {
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function addDays(date: string, delta: number): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  parsed.setUTCDate(parsed.getUTCDate() + delta);
  return parsed.toISOString().slice(0, 10);
}

function buildFlightSearchUrl(fromName: string, toName: string, departureDate: string): string {
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(
    `${fromName} to ${toName} ${departureDate}`,
  )}`;
}

function buildTrainSearchUrl(fromName: string, toName: string, departureDate: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(
    `${fromName} to ${toName} train ${departureDate}`,
  )}`;
}

function getRouteCoordinates(itinerary: TripItinerary): Array<[number, number]> {
  const route = itinerary.routeGeoJson;
  if (route && route.geometry.type === "LineString" && Array.isArray(route.geometry.coordinates)) {
    const valid = route.geometry.coordinates
      .map((coord) => {
        if (!Array.isArray(coord) || coord.length < 2) return null;
        const lng = Number(coord[0]);
        const lat = Number(coord[1]);
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
        return [lng, lat] as [number, number];
      })
      .filter((coord): coord is [number, number] => coord !== null);

    if (valid.length >= 2) {
      return valid;
    }
  }

  return itinerary.destinations
    .map((stop) => {
      if (!Number.isFinite(stop.longitude) || !Number.isFinite(stop.latitude)) {
        return null;
      }
      return [stop.longitude, stop.latitude] as [number, number];
    })
    .filter((coord): coord is [number, number] => coord !== null);
}

function RouteMap({ itinerary }: { itinerary: TripItinerary }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<{ remove: () => void } | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const coordinates = useMemo(
    () => getRouteCoordinates(itinerary),
    [itinerary.routeGeoJson, itinerary.destinations],
  );

  useEffect(() => {
    let cancelled = false;

    const mountMap = async () => {
      if (!containerRef.current || coordinates.length < 2) return;

      try {
        const maplibregl = await import("maplibre-gl");
        if (cancelled || !containerRef.current) return;

        const map = new maplibregl.Map({
          container: containerRef.current,
          style: "https://demotiles.maplibre.org/style.json",
          center: coordinates[0],
          zoom: 5,
        });

        mapRef.current = map;

        map.on("load", () => {
          if (cancelled) return;

          map.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates,
              },
            },
          });

          map.addLayer({
            id: "route-line",
            type: "line",
            source: "route",
            paint: {
              "line-color": "#0d4ea6",
              "line-width": 4,
            },
          });

          map.addSource("stops", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: itinerary.destinations.map((stop) => ({
                type: "Feature",
                properties: {
                  label: `${stop.stopOrder}`,
                  cityName: stop.cityName,
                },
                geometry: {
                  type: "Point",
                  coordinates: [stop.longitude, stop.latitude],
                },
              })),
            },
          });

          map.addLayer({
            id: "stops-circles",
            type: "circle",
            source: "stops",
            paint: {
              "circle-radius": 8,
              "circle-color": "#1d4ed8",
              "circle-stroke-color": "#0f172a",
              "circle-stroke-width": 2,
            },
          });

          map.addLayer({
            id: "stops-labels",
            type: "symbol",
            source: "stops",
            layout: {
              "text-field": ["get", "label"],
              "text-size": 11,
            },
            paint: {
              "text-color": "#ffffff",
            },
          });

          const bounds = coordinates.reduce(
            (acc, coord) => acc.extend(coord),
            new maplibregl.LngLatBounds(coordinates[0], coordinates[0]),
          );

          map.fitBounds(bounds, {
            padding: 48,
            duration: 0,
            maxZoom: 8,
          });
        });

        map.on("error", () => {
          if (!cancelled) {
            setMapError("Map tiles could not be loaded in this environment.");
          }
        });
      } catch {
        if (!cancelled) {
          setMapError("Map failed to initialize.");
        }
      }
    };

    void mountMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [coordinates, itinerary.destinations]);

  return (
    <article
      className="rounded-2xl p-4"
      style={{ background: "rgba(12,45,72,0.07)", border: "1px solid rgba(12,45,72,0.13)" }}
    >
      <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--foreground)" }}>
        Country Route Map
      </h2>
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden"
        style={{ height: 360, background: "rgba(12,45,72,0.06)", border: "1px solid rgba(12,45,72,0.12)" }}
      />
      {mapError && <p className="text-xs opacity-70 mt-2">{mapError}</p>}
    </article>
  );
}

async function fetchFlightsForLeg(
  leg: PlannedLeg,
  currency: string,
  budgetAmount?: number,
): Promise<FlightSuggestionsByLeg> {
  const offsets = [0, 1, -1, 2, -2, 3, -3];
  const budgetPasses =
    typeof budgetAmount === "number" && Number.isFinite(budgetAmount)
      ? [budgetAmount, undefined]
      : [undefined];

  for (const budget of budgetPasses) {
    for (const offset of offsets) {
      const candidateDate =
        offset === 0 ? leg.departureDate : addDays(leg.departureDate, offset);
      const params = new URLSearchParams({
        origin: leg.fromName,
        destination: leg.toName,
        departureDate: candidateDate,
        currency,
      });

      if (typeof budget === "number") {
        params.set("budget", String(budget));
      }

      try {
        const res = await fetch(`/api/flights?${params.toString()}`);
        if (!res.ok) continue;

        const raw = (await res.json()) as unknown;
        const options = Array.isArray(raw) ? (raw as FlightOption[]) : [];
        if (options.length === 0) continue;

        const fallbackUrl = buildFlightSearchUrl(leg.fromName, leg.toName, candidateDate);

        return {
          legOrder: leg.legOrder,
          fromStopOrder: leg.fromStopOrder,
          toStopOrder: leg.toStopOrder,
          fromName: leg.fromName,
          toName: leg.toName,
          mode: leg.mode,
          departureDate: candidateDate,
          adjustedFromDate: candidateDate === leg.departureDate ? null : leg.departureDate,
          fallbackBookingUrl: fallbackUrl,
          options: options.slice(0, 3).map((option) => ({
            ...option,
            deepLinkUrl: option.deepLinkUrl?.trim() || fallbackUrl,
          })),
        };
      } catch {
        continue;
      }
    }
  }

  return {
    legOrder: leg.legOrder,
    fromStopOrder: leg.fromStopOrder,
    toStopOrder: leg.toStopOrder,
    fromName: leg.fromName,
    toName: leg.toName,
    mode: leg.mode,
    departureDate: leg.departureDate,
    adjustedFromDate: null,
    fallbackBookingUrl: buildFlightSearchUrl(leg.fromName, leg.toName, leg.departureDate),
    options: [],
  };
}

function FlightCard({
  option,
  fallbackBookingUrl,
}: {
  option: FlightOption;
  fallbackBookingUrl?: string | null;
}) {
  const bookingUrl = option.deepLinkUrl?.trim() || fallbackBookingUrl || "";

  return (
    <article
      className="rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap"
      style={{ background: "rgba(12,45,72,0.07)", border: "1px solid rgba(12,45,72,0.13)" }}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate">{option.airline}</p>
        <p className="text-xs opacity-70 truncate">
          {option.departureTime || "TBD"} to {option.arrivalTime || "TBD"} | {option.duration || "duration TBD"} |{" "}
          {option.stops === 0 ? "Nonstop" : `${option.stops} stop${option.stops > 1 ? "s" : ""}`}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-bold" style={{ color: "var(--color-background-third)" }}>
          {option.currency} {Math.round(option.price).toLocaleString()}
        </span>
        {bookingUrl && (
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-85"
            style={{ background: "var(--color-background-third)", color: "#fff" }}
          >
            Book
          </a>
        )}
      </div>
    </article>
  );
}

function HotelCard({ option }: { option: HotelOption }) {
  return (
    <article
      className="rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap"
      style={{ background: "rgba(12,45,72,0.07)", border: "1px solid rgba(12,45,72,0.13)" }}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate">{option.name}</p>
        <p className="text-xs opacity-70 truncate">
          {option.overallRating != null ? `${option.overallRating.toFixed(1)} rating` : "No rating"} |{" "}
          {option.reviews != null ? `${option.reviews.toLocaleString()} reviews` : "No reviews"}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-bold" style={{ color: "var(--color-background-third)" }}>
          {option.pricePerNight != null
            ? `${option.currency} ${Math.round(option.pricePerNight).toLocaleString()}`
            : "Price unavailable"}
        </span>
        {option.deepLinkUrl && (
          <a
            href={option.deepLinkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-85"
            style={{ background: "var(--color-background-third)", color: "#fff" }}
          >
            Book
          </a>
        )}
      </div>
    </article>
  );
}

function makeOutboundLeg(
  originCity: string,
  firstStop: DestinationStop,
): PlannedLeg {
  return {
    legOrder: 0,
    fromStopOrder: 0,
    toStopOrder: firstStop.stopOrder,
    fromName: originCity,
    toName: firstStop.cityName,
    mode: "flight",
    departureDate: firstStop.startDate,
  };
}

function makeReturnLeg(
  originCity: string,
  lastStop: DestinationStop,
  nextLegOrder: number,
): PlannedLeg {
  return {
    legOrder: nextLegOrder,
    fromStopOrder: lastStop.stopOrder,
    toStopOrder: lastStop.stopOrder + 1,
    fromName: lastStop.cityName,
    toName: originCity,
    mode: "flight",
    departureDate: lastStop.endDate,
  };
}

function toPlannedLeg(leg: TripLeg): PlannedLeg {
  return {
    legOrder: leg.legOrder,
    fromStopOrder: leg.fromStopOrder,
    toStopOrder: leg.toStopOrder,
    fromName: leg.fromName,
    toName: leg.toName,
    mode: "flight",
    departureDate: leg.departureDate,
  };
}

function canonicalizeLegNames(
  leg: PlannedLeg,
  destinationByStop: Map<number, DestinationStop>,
  maxStopOrder: number,
): PlannedLeg {
  const fromStop = destinationByStop.get(leg.fromStopOrder);
  const toStop = destinationByStop.get(leg.toStopOrder);
  const isInternalCountryLeg =
    leg.fromStopOrder >= 1 &&
    leg.toStopOrder >= 1 &&
    leg.toStopOrder <= maxStopOrder &&
    Boolean(fromStop) &&
    Boolean(toStop);

  if (!isInternalCountryLeg || !fromStop || !toStop) {
    return leg;
  }

  return {
    ...leg,
    fromName: fromStop.cityName,
    toName: toStop.cityName,
  };
}

export default function MultiDestinationOverview({
  itinerary,
  originCity,
  flightBudget,
  accommodationBudget,
}: MultiDestinationOverviewProps) {
  const isCountryTrip =
    itinerary.tripOverview.tripScope === "COUNTRY" &&
    itinerary.destinations.length > 1;

  const [flightGroups, setFlightGroups] = useState<FlightSuggestionsByLeg[]>(
    [...(itinerary.flightSuggestionsByLeg ?? [])].sort((a, b) => a.legOrder - b.legOrder),
  );
  const [hotelGroups, setHotelGroups] = useState<HotelSuggestionsByDestination[]>(
    itinerary.hotelSuggestionsByDestination ?? [],
  );

  const attemptedFlightFetchesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    setFlightGroups(
      [...(itinerary.flightSuggestionsByLeg ?? [])].sort((a, b) => a.legOrder - b.legOrder),
    );
    attemptedFlightFetchesRef.current = new Set();
  }, [itinerary.flightSuggestionsByLeg]);

  useEffect(() => {
    setHotelGroups(itinerary.hotelSuggestionsByDestination ?? []);
  }, [itinerary.hotelSuggestionsByDestination]);

  const plannedLegs = useMemo(() => {
    const destinationByStop = new Map(
      itinerary.destinations.map((stop) => [stop.stopOrder, stop]),
    );
    const maxStopOrder = itinerary.destinations.reduce(
      (max, stop) => (stop.stopOrder > max ? stop.stopOrder : max),
      0,
    );

    const internalLegs = itinerary.tripLegs
      .map((leg) =>
        canonicalizeLegNames(
          toPlannedLeg(leg),
          destinationByStop,
          maxStopOrder,
        ),
      )
      .sort((a, b) => a.legOrder - b.legOrder);

    const cleanedOrigin = originCity?.trim();
    if (!cleanedOrigin || itinerary.destinations.length === 0) {
      return internalLegs;
    }

    const firstStop = itinerary.destinations[0];
    const lastStop = itinerary.destinations[itinerary.destinations.length - 1];
    const nextLegOrder =
      internalLegs.length > 0
        ? Math.max(...internalLegs.map((leg) => leg.legOrder)) + 1
        : 1;

    return [
      makeOutboundLeg(cleanedOrigin, firstStop),
      ...internalLegs,
      makeReturnLeg(cleanedOrigin, lastStop, nextLegOrder),
    ].sort((a, b) => a.legOrder - b.legOrder);
  }, [itinerary.tripLegs, itinerary.destinations, originCity]);

  useEffect(() => {
    if (!isCountryTrip) return;

    const existing = new Map(flightGroups.map((group) => [group.legOrder, group]));
    const missingOrEmptyFlightLegs = plannedLegs.filter((leg) => {
      if (attemptedFlightFetchesRef.current.has(leg.legOrder)) return false;
      const group = existing.get(leg.legOrder);
      if (!group) return true;
      return group.options.length === 0;
    });

    if (missingOrEmptyFlightLegs.length === 0) return;

    missingOrEmptyFlightLegs.forEach((leg) => {
      attemptedFlightFetchesRef.current.add(leg.legOrder);
    });

    const currency =
      flightBudget?.currency ?? itinerary.tripOverview.currencyCode ?? "USD";

    const run = async () => {
      const fetched = await Promise.all(
        missingOrEmptyFlightLegs.map((leg) =>
          fetchFlightsForLeg(leg, currency, flightBudget?.amount),
        ),
      );

      setFlightGroups((prev) =>
        Array.from(
          new Map([...prev, ...fetched].map((entry) => [entry.legOrder, entry])).values(),
        ).sort((a, b) => a.legOrder - b.legOrder),
      );
    };

    void run();
  }, [
    isCountryTrip,
    plannedLegs,
    itinerary.tripOverview.currencyCode,
    flightBudget,
    flightGroups,
  ]);

  useEffect(() => {
    if (!isCountryTrip) return;
    const existing = new Set(hotelGroups.map((g) => g.stopOrder));
    const missingStops = itinerary.destinations.filter((stop) => !existing.has(stop.stopOrder));
    if (missingStops.length === 0) return;

    const currency =
      accommodationBudget?.currency ?? itinerary.tripOverview.currencyCode ?? "USD";

    const run = async () => {
      const fetched = await Promise.all(
        missingStops.map(async (stop) => {
          const checkOut =
            stop.startDate === stop.endDate
              ? addDays(stop.endDate, 1)
              : stop.endDate;

          const params = new URLSearchParams({
            destination: `${stop.cityName}, ${stop.countryCode}`,
            checkIn: stop.startDate,
            checkOut,
            currency,
          });
          if (accommodationBudget?.amount) {
            params.set("budget", String(accommodationBudget.amount));
          }

          try {
            const res = await fetch(`/api/hotels?${params.toString()}`);
            if (!res.ok) return null;
            const options = (await res.json()) as HotelOption[];
            return {
              stopOrder: stop.stopOrder,
              cityName: stop.cityName,
              countryCode: stop.countryCode,
              checkIn: stop.startDate,
              checkOut,
              options: Array.isArray(options) ? options.slice(0, 5) : [],
            } satisfies HotelSuggestionsByDestination;
          } catch {
            return null;
          }
        }),
      );

      setHotelGroups((prev) =>
        Array.from(
          new Map(
            [...prev, ...fetched.filter((entry): entry is HotelSuggestionsByDestination => entry !== null)].map(
              (entry) => [entry.stopOrder, entry],
            ),
          ).values(),
        ).sort((a, b) => a.stopOrder - b.stopOrder),
      );
    };

    void run();
  }, [
    isCountryTrip,
    itinerary.destinations,
    itinerary.tripOverview.currencyCode,
    hotelGroups,
    accommodationBudget,
  ]);

  const displayFlightLegs = useMemo(() => {
    const byOrder = new Map(flightGroups.map((group) => [group.legOrder, group]));
    const maxStopOrder = itinerary.destinations.reduce(
      (max, stop) => (stop.stopOrder > max ? stop.stopOrder : max),
      0,
    );

    const fromPlan = plannedLegs.map((leg) => {
      const existing = byOrder.get(leg.legOrder);
      if (existing) {
        return {
          legOrder: leg.legOrder,
          fromStopOrder: leg.fromStopOrder,
          toStopOrder: leg.toStopOrder,
          fromName: leg.fromName,
          toName: leg.toName,
          mode: leg.mode,
          departureDate: existing.departureDate || leg.departureDate,
          adjustedFromDate: existing.adjustedFromDate ?? null,
          fallbackBookingUrl: existing.fallbackBookingUrl ?? null,
          options: existing.options,
        } satisfies FlightSuggestionsByLeg;
      }

      return {
        legOrder: leg.legOrder,
        fromStopOrder: leg.fromStopOrder,
        toStopOrder: leg.toStopOrder,
        fromName: leg.fromName,
        toName: leg.toName,
        mode: leg.mode,
        departureDate: leg.departureDate,
        adjustedFromDate: null,
        fallbackBookingUrl:
          leg.mode === "flight"
            ? buildFlightSearchUrl(leg.fromName, leg.toName, leg.departureDate)
            : buildTrainSearchUrl(leg.fromName, leg.toName, leg.departureDate),
        options: [],
      } satisfies FlightSuggestionsByLeg;
    });

    const fromPlanOrderSet = new Set(fromPlan.map((leg) => leg.legOrder));
    const cleanedOriginLower = originCity?.trim().toLowerCase() ?? "";
    const extraReturnLegs = flightGroups
      .filter((group) => !fromPlanOrderSet.has(group.legOrder))
      .filter(
        (group) =>
          group.fromStopOrder === 0 ||
          (group.fromStopOrder >= 1 && group.toStopOrder > maxStopOrder),
      )
      .filter((group) =>
        cleanedOriginLower.length > 0
          ? group.toName.trim().toLowerCase() === cleanedOriginLower ||
            group.fromName.trim().toLowerCase() === cleanedOriginLower
          : true,
      );

    return [...fromPlan, ...extraReturnLegs].sort((a, b) => a.legOrder - b.legOrder);
  }, [flightGroups, plannedLegs, itinerary.destinations, originCity]);

  if (!isCountryTrip) {
    return null;
  }

  return (
    <section className="mt-6 w-full space-y-6 text-left">
      <RouteMap itinerary={itinerary} />

      <article
        className="rounded-2xl p-4"
        style={{ background: "rgba(12,45,72,0.07)", border: "1px solid rgba(12,45,72,0.13)" }}
      >
        <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--foreground)" }}>
          Stops and Stay Windows
        </h2>
        <div className="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-3">
          {itinerary.destinations.map((stop) => (
            <article
              key={stop.stopOrder}
              className="rounded-xl p-3"
              style={{ background: "rgba(12,45,72,0.05)", border: "1px solid rgba(12,45,72,0.13)" }}
            >
              <p className="text-xs uppercase opacity-60">Stop {stop.stopOrder}</p>
              <p className="text-sm font-semibold mt-1">{stop.cityName}</p>
              <p className="text-xs opacity-70 mt-1">
                {formatDay(stop.startDate)} to {formatDay(stop.endDate)} | {stop.nights} night
                {stop.nights === 1 ? "" : "s"}
              </p>
            </article>
          ))}
        </div>
      </article>

      <article
        className="rounded-2xl p-4"
        style={{ background: "rgba(12,45,72,0.07)", border: "1px solid rgba(12,45,72,0.13)" }}
      >
        <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--foreground)" }}>
          Flights by Leg
        </h2>
        <div className="space-y-3">
          {displayFlightLegs.map((leg) => {
            const flightFallback =
              leg.fallbackBookingUrl ||
              buildFlightSearchUrl(leg.fromName, leg.toName, leg.departureDate);
            const trainFallback = buildTrainSearchUrl(
              leg.fromName,
              leg.toName,
              leg.departureDate,
            );
            const cleanedOriginLower = originCity?.trim().toLowerCase() ?? "";
            const isOutboundLeg = leg.fromStopOrder === 0;
            const isReturnLeg =
              cleanedOriginLower.length > 0 &&
              leg.toStopOrder > itinerary.destinations.length &&
              leg.toName.trim().toLowerCase() === cleanedOriginLower;

            return (
              <article
                key={`${leg.legOrder}-${leg.fromName}-${leg.toName}`}
                className="rounded-xl p-3"
                style={{ background: "rgba(12,45,72,0.05)", border: "1px solid rgba(12,45,72,0.13)" }}
              >
                <p className="text-sm font-semibold">
                  {isOutboundLeg
                    ? `Outbound: ${leg.fromName} to ${leg.toName} (${leg.mode})`
                    : isReturnLeg
                    ? `Return: ${leg.fromName} to ${leg.toName} (${leg.mode})`
                    : `Leg ${leg.legOrder}: ${leg.fromName} to ${leg.toName} (${leg.mode})`}
                </p>
                <p className="text-xs opacity-70 mb-2">Departure: {formatDay(leg.departureDate)}</p>
                {leg.adjustedFromDate && (
                  <p className="text-xs mb-2" style={{ color: "var(--color-background-third)" }}>
                    No results on {formatDay(leg.adjustedFromDate)}. Showing nearest availability on {formatDay(leg.departureDate)}.
                  </p>
                )}
                <div className="space-y-2">
                  {leg.options.length > 0 && (
                    <>
                      {leg.options.map((option, index) => (
                        <FlightCard
                          key={`${leg.legOrder}-${index}`}
                          option={option}
                          fallbackBookingUrl={flightFallback}
                        />
                      ))}
                    </>
                  )}
                  {leg.options.length === 0 && leg.mode === "train" && (
                    <p className="text-xs opacity-70">
                      Rail-friendly leg. Use a train booking platform for live schedules. {" "}
                      <a
                        href={trainFallback}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                        style={{ color: "var(--color-background-third)" }}
                      >
                        Find trains
                      </a>
                    </p>
                  )}
                  {leg.options.length === 0 && leg.mode === "flight" && (
                    <p className="text-xs opacity-70">
                      No direct flight options were returned for nearby dates. {" "}
                      <a
                        href={flightFallback}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                        style={{ color: "var(--color-background-third)" }}
                      >
                        Search flights
                      </a>
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </article>

      <article
        className="rounded-2xl p-4"
        style={{ background: "rgba(12,45,72,0.07)", border: "1px solid rgba(12,45,72,0.13)" }}
      >
        <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--foreground)" }}>
          Hotels by Stop
        </h2>
        <div className="space-y-3">
          {itinerary.destinations.map((stop) => {
            const group = hotelGroups.find((entry) => entry.stopOrder === stop.stopOrder);
            return (
              <article
                key={stop.stopOrder}
                className="rounded-xl p-3"
                style={{ background: "rgba(12,45,72,0.05)", border: "1px solid rgba(12,45,72,0.13)" }}
              >
                <p className="text-sm font-semibold">
                  Stop {stop.stopOrder}: {stop.cityName}
                </p>
                <p className="text-xs opacity-70 mb-2">
                  {formatDay(stop.startDate)} to {formatDay(stop.endDate)}
                </p>
                <div className="space-y-2">
                  {group && group.options.length > 0 && (
                    <>
                      {group.options.map((option, index) => (
                        <HotelCard key={`${stop.stopOrder}-${index}`} option={option} />
                      ))}
                    </>
                  )}
                  {(!group || group.options.length === 0) && (
                    <p className="text-xs opacity-70">
                      No hotel options available yet for this stop.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </article>
    </section>
  );
}
