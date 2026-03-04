"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Loading from "@/components/Loading/Loading";

interface ApiSuccessResponse {
  result?: unknown;
}

interface ApiErrorResponse {
  error?: string;
}

const MAX_FOLLOW_UP_REFINEMENTS = 2;

export default function TripLoadingPage() {
  const searchParams = useSearchParams();
  const location = searchParams.get("location") || "";
  const theme = searchParams.get("theme") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const locationLabel = location || "your destination";
  const [response, setResponse] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followUpAnswers, setFollowUpAnswers] = useState<string[]>([]);
  const [refinementCount, setRefinementCount] = useState(0);

  const fetchTripPlan = useCallback(
    async (answers: string[], signal?: AbortSignal): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch("/api/new-trip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal,
          body: JSON.stringify({
            location,
            startDate,
            endDate,
            theme,
            followUpAnswers: answers,
          }),
        });

        const data = (await res.json()) as ApiSuccessResponse | ApiErrorResponse;

        if (!res.ok) {
          throw new Error(
            "error" in data && data.error
              ? data.error
              : "Failed to generate itinerary"
          );
        }

        setResponse("result" in data ? data.result ?? null : null);
        return true;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return false;
        }
        setError(
          err instanceof Error ? err.message : "Failed to generate itinerary"
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [location, startDate, endDate, theme]
  );

  useEffect(() => {
    if (!location || !theme || !startDate || !endDate) {
      setError("Missing trip criteria in URL parameters.");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setFollowUpAnswers([]);
    setRefinementCount(0);

    // In React strict mode dev remounts, this timeout avoids extra immediate calls.
    const timer = window.setTimeout(() => {
      void fetchTripPlan([], controller.signal);
    }, 50);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [location, theme, startDate, endDate, fetchTripPlan]);

  const handleSubmitFollowUpAnswers = async (answers: string[]) => {
    if (isLoading) {
      return;
    }

    if (refinementCount >= MAX_FOLLOW_UP_REFINEMENTS) {
      setError(
        `Maximum follow-up refinements reached (${MAX_FOLLOW_UP_REFINEMENTS}).`
      );
      return;
    }

    const validAnswers = answers
      .map((answer) => answer.trim())
      .filter((answer) => answer.length > 0);

    if (validAnswers.length === 0) {
      setError("Add at least one follow-up answer before refining.");
      return;
    }

    const combinedAnswers = [...followUpAnswers, ...validAnswers];
    const success = await fetchTripPlan(combinedAnswers);

    if (success) {
      setFollowUpAnswers(combinedAnswers);
      setRefinementCount((count) => count + 1);
    }
  };

  const handleSaveTripClick = () => {
    // Frontend-only placeholder. Persistence is part of a separate change.
  };

  return (
    <Loading
      location={`${locationLabel}${theme ? ` (${theme})` : ""}`}
      response={response}
      isLoading={isLoading}
      error={error}
      onSubmitFollowUpAnswers={handleSubmitFollowUpAnswers}
      onSaveTripClick={handleSaveTripClick}
    />
  );
}
