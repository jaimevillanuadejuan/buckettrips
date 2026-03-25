"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import type { TripItinerary } from "@/types/itinerary";
import type { SaveTripResult } from "@/types/saved-trip";
import TripRefinementChat from "@/components/TripRefinementChat/TripRefinementChat";

interface ItineraryProps {
  itinerary: TripItinerary;
  isSubmitting: boolean;
  onSubmitFollowUpAnswers: (answers: string[]) => Promise<void> | void;
  onSaveTripClick?: () => Promise<SaveTripResult> | SaveTripResult;
  readOnly?: boolean;
  tripId?: string;
}

function formatCurrency(value: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    // Fallback if currencyCode is unrecognized
    return `${value.toLocaleString("en-US")}`;
  }
}

function useUserCurrency(tripCurrencyCode: string) {
  const [userCurrency, setUserCurrency] = useState<string | null>(null);
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    const detect = async () => {
      try {
        // Try profile first, fall back to geo
        let detected: string | null = null;

        const profileRes = await fetch("/api/profile/me", { cache: "no-store" });
        if (profileRes.ok) {
          const d = (await profileRes.json()) as { preferredCurrency?: string | null };
          detected = d.preferredCurrency?.trim() ?? null;
        }

        if (!detected) {
          const geoRes = await fetch("/api/geo", { cache: "no-store" });
          if (geoRes.ok) {
            const d = (await geoRes.json()) as { currency?: string | null };
            detected = d.currency ?? null;
          }
        }

        if (!detected || detected === tripCurrencyCode) return;
        setUserCurrency(detected);

        // Get exchange rate via open.er-api.com (supports all currencies)
        let r: number | null = null;
        try {
          const er = await fetch(`https://open.er-api.com/v6/latest/${tripCurrencyCode}`);
          if (er.ok) {
            const ed = (await er.json()) as { rates?: Record<string, number> };
            r = ed.rates?.[detected] ?? null;
          }
        } catch { /* fall through */ }

        // Final fallback: exchangerate.host
        if (!r) {
          try {
            const er2 = await fetch(`https://api.exchangerate.host/latest?base=${tripCurrencyCode}&symbols=${detected}`);
            if (er2.ok) {
              const ed2 = (await er2.json()) as { rates?: Record<string, number> };
              r = ed2.rates?.[detected] ?? null;
            }
          } catch { /* fall through */ }
        }

        if (r) setRate(r);
      } catch { /* silently ignore */ }
    };
    void detect();
  }, [tripCurrencyCode]);

  return { userCurrency, rate };
}

function getOrdinalSuffix(day: number): string {
  const remainder10 = day % 10;
  const remainder100 = day % 100;

  if (remainder10 === 1 && remainder100 !== 11) {
    return "st";
  }

  if (remainder10 === 2 && remainder100 !== 12) {
    return "nd";
  }

  if (remainder10 === 3 && remainder100 !== 13) {
    return "rd";
  }

  return "th";
}

function formatDisplayDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(
    parsed
  );
  const day = parsed.getUTCDate();

  return `${month} ${day}${getOrdinalSuffix(day)}`;
}

function formatLongDate(date: string): string | null {
  const parsed = new Date(`${date}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const month = new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
  }).format(parsed);
  const day = parsed.getUTCDate();
  const year = parsed.getUTCFullYear();

  return `${month} ${day}${getOrdinalSuffix(day)} ${year}`;
}

function formatTravelWindow(windowValue: string): string {
  const parts = windowValue.split(/\s+to\s+/i);

  if (parts.length !== 2) {
    return windowValue;
  }

  const start = formatLongDate(parts[0]?.trim() ?? "");
  const end = formatLongDate(parts[1]?.trim() ?? "");

  if (!start || !end) {
    return windowValue;
  }

  return `${start} to ${end}`;
}

function SectionList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ color: "var(--color-background-third)" }}
      >
        {title}
      </h4>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li
            key={`${title}-${index}`}
            className="text-sm rounded-md p-2"
            style={{
              background: "rgba(12,45,72,0.07)",
              border: "1px solid rgba(12,45,72,0.13)",
              color: "var(--foreground)",
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Itinerary({
  itinerary: initialItinerary,
  isSubmitting,
  onSubmitFollowUpAnswers,
  onSaveTripClick,
  readOnly = false,
  tripId,
}: ItineraryProps) {
  const [itinerary, setItinerary] = useState<TripItinerary>(initialItinerary);
  const [answers, setAnswers] = useState<string[]>(
    initialItinerary.followUpQuestions.map(() => "")
  );
  const { userCurrency, rate } = useUserCurrency(itinerary.tripOverview.currencyCode);
  const [expandedDayKey, setExpandedDayKey] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<SaveTripResult | null>(null);
  const [isSavingTrip, setIsSavingTrip] = useState(false);
  const saveNoticeTimerRef = useRef<number | null>(null);

  const clearSaveNotice = () => {
    setSaveNotice(null);

    if (saveNoticeTimerRef.current !== null) {
      window.clearTimeout(saveNoticeTimerRef.current);
      saveNoticeTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (saveNoticeTimerRef.current !== null) {
        window.clearTimeout(saveNoticeTimerRef.current);
      }
    };
  }, []);

  const handleAnswerChange = (index: number, value: string) => {
    clearSaveNotice();
    setAnswers((previous) => {
      const updated = [...previous];
      updated[index] = value;
      return updated;
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    clearSaveNotice();

    const usableAnswers = answers
      .map((answer) => answer.trim())
      .filter((answer) => answer.length > 0);

    await onSubmitFollowUpAnswers(usableAnswers);
  };

  const handleSaveTrip = () => {
    const run = async () => {
      try {
        setIsSavingTrip(true);

        const result: SaveTripResult = onSaveTripClick
          ? await onSaveTripClick()
          : {
              status: "info",
              message:
                "Save Trip will be enabled when My Trips backend is live.",
            };

        setSaveNotice(result);

        if (saveNoticeTimerRef.current !== null) {
          window.clearTimeout(saveNoticeTimerRef.current);
        }

        saveNoticeTimerRef.current = window.setTimeout(() => {
          setSaveNotice(null);
          saveNoticeTimerRef.current = null;
        }, 3000);
      } finally {
        setIsSavingTrip(false);
      }
    };

    void run();
  };

  const hasFollowUpQuestions = itinerary.followUpQuestions.length > 0;

  const handleToggleDayCard = (dayKey: string) => {
    setExpandedDayKey((current) => (current === dayKey ? null : dayKey));
  };

  return (
    <div className="w-full mt-6 space-y-6">
      <section
        className="rounded-2xl p-5 tablet:p-6 text-left"
        style={{
          background: "rgba(12,45,72,0.07)",
          border: "1px solid rgba(12,45,72,0.13)",
        }}
      >
        <h3 className="text-2xl tablet:text-3xl font-bold" style={{ color: "var(--foreground)" }}>
          Trip to {itinerary.tripOverview.destination}
        </h3>
        <p className="text-sm tablet:text-base mt-2" style={{ color: "var(--foreground)", opacity: 0.75 }}>
          {formatTravelWindow(itinerary.tripOverview.travelWindow)}
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--foreground)", opacity: 0.75 }}>
          Style: {itinerary.tripOverview.planningStyle}
        </p>

        <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(12,45,72,0.13)" }}>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--foreground)", opacity: 0.6 }}>
            Budget Snapshot
          </p>
          <p className="text-lg font-semibold mt-1" style={{ color: "var(--color-background-third)" }}>
            <span className="font-normal opacity-80">
              {formatCurrency(itinerary.overallBudgetEstimateEur.low, itinerary.tripOverview.currencyCode)} –{" "}
              {formatCurrency(itinerary.overallBudgetEstimateEur.high, itinerary.tripOverview.currencyCode)}{" "}
              <span className="text-sm opacity-60">{itinerary.tripOverview.currencyCode}</span>
            </span>
            {userCurrency && rate && (
              <span className="ml-2 font-bold" style={{ color: "var(--color-background-third)" }}>
                ({formatCurrency(Math.round(itinerary.overallBudgetEstimateEur.low * rate), userCurrency)} –{" "}
                {formatCurrency(Math.round(itinerary.overallBudgetEstimateEur.high * rate), userCurrency)})
              </span>
            )}
          </p>
          {itinerary.overallBudgetEstimateEur.notes.length > 0 && (
            <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--foreground)", opacity: 0.7 }}>
              {itinerary.overallBudgetEstimateEur.notes.join(" | ")}
            </p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 text-left tablet:[grid-template-columns:repeat(auto-fit,minmax(18rem,1fr))] desktop:grid-cols-3">
        {itinerary.dailyItinerary.map((day) => {
          const dayKey = `${day.day}-${day.date}`;
          const isExpanded = expandedDayKey === dayKey;

          return (
            <article
              key={dayKey}
              className={`rounded-2xl p-5 tablet:p-6 overflow-hidden transition-all duration-500 ease-out ${
                isExpanded ? "max-h-[42rem] desktop:col-span-2" : "max-h-[11rem] desktop:col-span-1"
              }`}
              style={{ background: "rgba(12,45,72,0.07)", border: "1px solid rgba(12,45,72,0.13)" }}
            >
              <button
                type="button"
                onClick={() => handleToggleDayCard(dayKey)}
                className="w-full flex items-start justify-between gap-3 text-left"
              >
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: "var(--foreground)", opacity: 0.6 }}>
                    Day {day.day} - {formatDisplayDate(day.date)}
                  </p>
                  <p className="text-base font-bold mt-1" style={{ color: "var(--color-background-third)" }}>
                    {day.focus}
                  </p>
                </div>
                <span className="text-lg font-bold leading-none" style={{ color: "var(--foreground)" }}>
                  {isExpanded ? "-" : "+"}
                </span>
              </button>

              <div className={`overflow-hidden transition-all duration-500 ease-out ${isExpanded ? "max-h-[28rem] opacity-100 mt-4" : "max-h-0 opacity-0 mt-0"}`}>
                <div className="itinerary-scrollbar max-h-[24rem] overflow-y-auto pr-1 grid grid-cols-1 tablet:grid-cols-2 gap-4">
                  <SectionList title="Morning" items={day.morning} />
                  <SectionList title="Afternoon" items={day.afternoon} />
                  <SectionList title="Evening" items={day.evening} />
                  <SectionList title="Budget Tips" items={day.budgetTips} />
                  <SectionList title="Logistics Notes" items={day.logisticsNotes} />
                  <SectionList title="Reservation Alerts" items={day.reservationAlerts} />
                  <p className="text-sm tablet:col-span-2" style={{ color: "var(--foreground)", opacity: 0.75 }}>
                    Estimated daily budget:{" "}
                    <span className="font-semibold" style={{ color: "var(--color-background-third)" }}>
                      {formatCurrency(day.estimatedBudgetEur.low, itinerary.tripOverview.currencyCode)} –{" "}
                      {formatCurrency(day.estimatedBudgetEur.high, itinerary.tripOverview.currencyCode)}
                    </span>
                    {userCurrency && rate && (
                      <span className="ml-1 font-bold" style={{ color: "var(--color-background-third)" }}>
                        ({formatCurrency(Math.round(day.estimatedBudgetEur.low * rate), userCurrency)} –{" "}
                        {formatCurrency(Math.round(day.estimatedBudgetEur.high * rate), userCurrency)})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {readOnly && (
        <TripRefinementChat itinerary={itinerary} onItineraryUpdate={setItinerary} tripId={tripId} />
      )}

      {!readOnly && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="button" onClick={handleSaveTrip} disabled={isSavingTrip}>
              {isSavingTrip ? "Saving..." : "Save Trip"}
            </button>
            {saveNotice && (
              <div className="surface-chip rounded-md px-3 py-2 text-sm text-slate-50 flex flex-wrap items-center gap-2">
                <span>{saveNotice.message}</span>
                {saveNotice.status === "success" && saveNotice.showMyTripsLink && (
                  <Link href="/my-trips" className="font-semibold text-slate-50 transition-opacity hover:opacity-85">
                    View my trips
                  </Link>
                )}
              </div>
            )}
          </div>
          <TripRefinementChat itinerary={itinerary} onItineraryUpdate={setItinerary} />
        </>
      )}
    </div>
  );
}
