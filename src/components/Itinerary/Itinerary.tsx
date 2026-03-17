"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { TripItinerary } from "@/types/itinerary";
import type { SaveTripResult } from "@/types/saved-trip";

interface ItineraryProps {
  itinerary: TripItinerary;
  isSubmitting: boolean;
  onSubmitFollowUpAnswers: (answers: string[]) => Promise<void> | void;
  onSaveTripClick?: () => Promise<SaveTripResult> | SaveTripResult;
  readOnly?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
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
      <h4 className="text-xs font-semibold uppercase tracking-wide text-background-first">
        {title}
      </h4>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li
            key={`${title}-${index}`}
            className="surface-chip text-sm text-slate-100 rounded-md p-2"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Itinerary({
  itinerary,
  isSubmitting,
  onSubmitFollowUpAnswers,
  onSaveTripClick,
  readOnly = false,
}: ItineraryProps) {
  const [answers, setAnswers] = useState<string[]>(
    itinerary.followUpQuestions.map(() => "")
  );
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
      <section className="surface-card rounded-2xl p-5 tablet:p-6 text-left">
        <h3 className="text-2xl tablet:text-3xl font-bold text-white">
          Trip to {itinerary.tripOverview.destination}
        </h3>
        <p className="text-sm tablet:text-base text-slate-100 mt-2">
          {formatTravelWindow(itinerary.tripOverview.travelWindow)}
        </p>
        <p className="text-sm text-slate-100 mt-2">
          Theme:{" "}
          <span className="font-semibold text-day-accent">
            {itinerary.tripOverview.theme}
          </span>
        </p>
        <p className="text-sm text-slate-100 mt-1">
          Style: {itinerary.tripOverview.planningStyle}
        </p>

        <div className="mt-5 pt-4 border-t border-white/15">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-100">
            Budget Snapshot
          </p>
          <p className="text-lg font-semibold text-white mt-1">
            {formatCurrency(itinerary.overallBudgetEstimateEur.low)} -{" "}
            {formatCurrency(itinerary.overallBudgetEstimateEur.high)}
          </p>
          {itinerary.overallBudgetEstimateEur.notes.length > 0 && (
            <p className="text-sm text-slate-100 mt-2 leading-relaxed">
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
              className={`surface-card rounded-2xl p-5 tablet:p-6 overflow-hidden transition-all duration-500 ease-out ${
                isExpanded
                  ? "max-h-[42rem] desktop:col-span-2"
                  : "max-h-[11rem] desktop:col-span-1"
              }`}
            >
              <button
                type="button"
                onClick={() => handleToggleDayCard(dayKey)}
                className="w-full flex items-start justify-between gap-3 text-left"
              >
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold text-slate-100">
                    Day {day.day} - {formatDisplayDate(day.date)}
                  </p>
                  <p className="text-base font-bold text-day-accent mt-1">
                    {day.focus}
                  </p>
                </div>
                <span className="text-lg font-bold text-white leading-none">
                  {isExpanded ? "-" : "+"}
                </span>
              </button>

              <div
                className={`overflow-hidden transition-all duration-500 ease-out ${
                  isExpanded
                    ? "max-h-[28rem] opacity-100 mt-4"
                    : "max-h-0 opacity-0 mt-0"
                }`}
              >
                <div className="itinerary-scrollbar max-h-[24rem] overflow-y-auto pr-1 grid grid-cols-1 tablet:grid-cols-2 gap-4">
                  <SectionList title="Morning" items={day.morning} />
                  <SectionList title="Afternoon" items={day.afternoon} />
                  <SectionList title="Evening" items={day.evening} />
                  <SectionList title="Budget Tips" items={day.budgetTips} />
                  <SectionList
                    title="Logistics Notes"
                    items={day.logisticsNotes}
                  />
                  <SectionList
                    title="Reservation Alerts"
                    items={day.reservationAlerts}
                  />
                  <p className="text-sm text-slate-100 tablet:col-span-2">
                    Estimated daily budget:{" "}
                    <span className="font-semibold">
                      {formatCurrency(day.estimatedBudgetEur.low)} -{" "}
                      {formatCurrency(day.estimatedBudgetEur.high)}
                    </span>
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {hasFollowUpQuestions && !readOnly && (
        <section className="surface-card rounded-2xl p-5 tablet:p-6 text-left">
          <h3 className="text-base font-bold text-white">
            Refine this plan with follow-up answers
          </h3>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {itinerary.followUpQuestions.map((entry, index) => (
              <div key={`follow-up-${index}`} className="space-y-2">
                <p className="text-sm text-white font-semibold">
                  {entry.question}
                </p>
                <p className="text-xs text-slate-100">{entry.whyItMatters}</p>
                <textarea
                  value={answers[index] ?? ""}
                  onChange={(event) =>
                    handleAnswerChange(index, event.currentTarget.value)
                  }
                  className="w-full min-h-20 rounded-lg p-3 text-black bg-white/95 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-background-first"
                  placeholder="Add your answer..."
                />
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="button disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Refining..." : "Refine itinerary"}
              </button>
              <button
                type="button"
                className="button"
                onClick={handleSaveTrip}
                disabled={isSavingTrip}
              >
                {isSavingTrip ? "Saving..." : "Save Trip"}
              </button>
            </div>
            {saveNotice && (
              <div className="surface-chip rounded-md px-3 py-2 text-sm text-slate-50 flex flex-wrap items-center gap-2">
                <span>{saveNotice.message}</span>
                {saveNotice.status === "success" &&
                  saveNotice.showMyTripsLink && (
                    <Link
                      href="/my-trips"
                      className="font-semibold text-slate-50 transition-opacity hover:opacity-85"
                    >
                      View my trips
                    </Link>
                  )}
              </div>
            )}
          </form>
        </section>
      )}

      {!hasFollowUpQuestions && !readOnly && (
        <section className="surface-card rounded-2xl p-5 tablet:p-6 text-left">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="button"
              onClick={handleSaveTrip}
              disabled={isSavingTrip}
            >
              {isSavingTrip ? "Saving..." : "Save Trip"}
            </button>
          </div>
          {saveNotice && (
            <div className="surface-chip rounded-md px-3 py-2 mt-3 text-sm text-slate-50 flex flex-wrap items-center gap-2">
              <span>{saveNotice.message}</span>
              {saveNotice.status === "success" &&
                saveNotice.showMyTripsLink && (
                  <Link
                    href="/my-trips"
                    className="font-semibold text-slate-50 transition-opacity hover:opacity-85"
                  >
                    View my trips
                  </Link>
                )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
