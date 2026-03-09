"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Loading from "@/components/Loading/Loading";
import { normalizeTripItinerary } from "@/types/itinerary";
import type { SaveTripResult } from "@/types/saved-trip";

interface ApiSuccessResponse {
  result?: unknown;
  provider?: string;
  model?: string;
}

interface ApiErrorResponse {
  error?: string;
  message?: string | string[];
}

const MAX_FOLLOW_UP_REFINEMENTS = 2;
const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080/api";

function getApiErrorMessage(
  payload: ApiErrorResponse,
  fallback: string
): string {
  if (typeof payload.error === "string" && payload.error.trim().length > 0) {
    return payload.error;
  }

  if (typeof payload.message === "string" && payload.message.trim().length > 0) {
    return payload.message;
  }

  if (Array.isArray(payload.message) && payload.message.length > 0) {
    return payload.message.join(", ");
  }

  return fallback;
}

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
  const [sourceProvider, setSourceProvider] = useState<string | undefined>(
    undefined
  );
  const [sourceModel, setSourceModel] = useState<string | undefined>(undefined);

  const fetchTripPlan = useCallback(
    async (answers: string[], signal?: AbortSignal): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(`${BACKEND_BASE_URL}/api-trips`, {
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
            getApiErrorMessage(data as ApiErrorResponse, "Failed to generate itinerary")
          );
        }

        setResponse("result" in data ? data.result ?? null : null);
        setSourceProvider("provider" in data ? data.provider : undefined);
        setSourceModel("model" in data ? data.model : undefined);
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
    const save = async (): Promise<SaveTripResult> => {
      const normalizedItinerary = normalizeTripItinerary(response);

      if (!normalizedItinerary) {
        return {
          status: "error" as const,
          message: "Cannot save: itinerary payload is not valid yet.",
        };
      }

      try {
        const saveRes = await fetch(`${BACKEND_BASE_URL}/trips`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location,
            startDate,
            endDate,
            theme,
            provider: sourceProvider,
            model: sourceModel,
            itinerary: normalizedItinerary,
          }),
        });

        if (!saveRes.ok) {
          const saveError = (await saveRes.json()) as ApiErrorResponse;
          return {
            status: "error" as const,
            message: getApiErrorMessage(
              saveError,
              "Failed to save trip. Please verify backend connection."
            ),
          };
        }

        return {
          status: "success" as const,
          message: "Trip saved successfully.",
          showMyTripsLink: true,
        };
      } catch {
        return {
          status: "error" as const,
          message: "Failed to save trip. Please verify backend connection.",
        };
      }
    };

    return save();
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
