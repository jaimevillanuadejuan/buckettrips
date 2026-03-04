"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import type { TripItinerary } from "@/types/itinerary";

interface ItineraryProps {
  itinerary: TripItinerary;
  isSubmitting: boolean;
  onSubmitFollowUpAnswers: (answers: string[]) => Promise<void> | void;
  onSaveTripClick?: () => void;
}

function formatEur(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
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
}: ItineraryProps) {
  const [answers, setAnswers] = useState<string[]>(
    itinerary.followUpQuestions.map(() => "")
  );
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
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
    onSaveTripClick?.();
    setSaveNotice("Save Trip will be enabled when My Trips backend is live.");

    if (saveNoticeTimerRef.current !== null) {
      window.clearTimeout(saveNoticeTimerRef.current);
    }

    saveNoticeTimerRef.current = window.setTimeout(() => {
      setSaveNotice(null);
      saveNoticeTimerRef.current = null;
    }, 3000);
  };

  const hasFollowUpQuestions = itinerary.followUpQuestions.length > 0;

  return (
    <div className="w-full mt-6 space-y-6">
      <section className="surface-card rounded-2xl p-5 md:p-6 text-left">
        <h3 className="text-lg font-bold text-white">
          {itinerary.tripOverview.destination}
        </h3>
        <p className="text-sm text-slate-100">{itinerary.tripOverview.travelWindow}</p>
        <p className="text-sm text-slate-100 mt-2">
          Theme:{" "}
          <span className="font-semibold text-background-first">
            {itinerary.tripOverview.theme}
          </span>
        </p>
        <p className="text-sm text-slate-100 mt-1">
          Style: {itinerary.tripOverview.planningStyle}
        </p>

        {itinerary.tripOverview.keyAssumptions.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-background-first">
              Assumptions
            </h4>
            <ul className="mt-2 space-y-2">
              {itinerary.tripOverview.keyAssumptions.map((assumption, index) => (
                <li
                  key={`assumption-${index}`}
                  className="surface-chip text-sm text-slate-100 rounded-md p-2"
                >
                  {assumption}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="surface-card rounded-2xl p-5 md:p-6 text-left">
        <h3 className="text-base font-bold text-white">Budget Snapshot</h3>
        <p className="text-sm text-slate-100 mt-1">
          {formatEur(itinerary.overallBudgetEstimateEur.low)} -{" "}
          {formatEur(itinerary.overallBudgetEstimateEur.high)}
        </p>
        {itinerary.overallBudgetEstimateEur.notes.length > 0 && (
          <ul className="mt-3 space-y-2">
            {itinerary.overallBudgetEstimateEur.notes.map((note, index) => (
              <li
                key={`budget-note-${index}`}
                className="surface-chip text-sm text-slate-100 rounded-md p-2"
              >
                {note}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 text-left">
        {itinerary.dailyItinerary.map((day) => (
          <article
            key={`${day.day}-${day.date}`}
            className="surface-card rounded-2xl p-5 md:p-6 space-y-4"
          >
            <header>
              <h3 className="text-base font-bold text-white">
                Day {day.day}: {day.date}
              </h3>
              <p className="text-sm text-background-first mt-1">{day.focus}</p>
            </header>

            <SectionList title="Morning" items={day.morning} />
            <SectionList title="Afternoon" items={day.afternoon} />
            <SectionList title="Evening" items={day.evening} />
            <SectionList title="Budget Tips" items={day.budgetTips} />
            <SectionList title="Logistics Notes" items={day.logisticsNotes} />
            <SectionList title="Reservation Alerts" items={day.reservationAlerts} />

            <p className="text-sm text-slate-100">
              Estimated daily budget:{" "}
              <span className="font-semibold">
                {formatEur(day.estimatedBudgetEur.low)} -{" "}
                {formatEur(day.estimatedBudgetEur.high)}
              </span>
            </p>
          </article>
        ))}
      </section>

      {hasFollowUpQuestions && (
        <section className="surface-card rounded-2xl p-5 md:p-6 text-left">
          <h3 className="text-base font-bold text-white">
            Refine this plan with follow-up answers
          </h3>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {itinerary.followUpQuestions.map((entry, index) => (
              <div key={`follow-up-${index}`} className="space-y-2">
                <p className="text-sm text-white font-semibold">{entry.question}</p>
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
              >
                Save Trip
              </button>
            </div>
            {saveNotice && (
              <p className="surface-chip rounded-md px-3 py-2 text-sm text-slate-50">
                {saveNotice}
              </p>
            )}
          </form>
        </section>
      )}
    </div>
  );
}
