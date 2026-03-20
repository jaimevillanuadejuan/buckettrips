"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Loading from "@/components/Loading/Loading";
import type { SaveTripResult } from "@/types/saved-trip";
import { normalizeTripItinerary } from "@/types/itinerary";
import type { TripContext } from "@/types/trip-context";
import { apiFetch } from "@/lib/api";

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
  fallback: string,
): string {
  if (typeof payload.error === "string" && payload.error.trim().length > 0) {
    return payload.error;
  }
  if (
    typeof payload.message === "string" &&
    payload.message.trim().length > 0
  ) {
    return payload.message;
  }
  if (Array.isArray(payload.message) && payload.message.length > 0) {
    return payload.message.join(", ");
  }
  return fallback;
}

export default function TripLoadingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const profileId = session?.user?.profileId;
  const location = searchParams.get("location") || "";
  const theme = searchParams.get("theme") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  // ✅ Ref instead of state — changes don't trigger re-renders or dependency cascades
  const tripContextRef = useRef<TripContext | null>(null);

  const [locationLabel, setLocationLabel] = useState("your destination");
  const [response, setResponse] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followUpAnswers, setFollowUpAnswers] = useState<string[]>([]);
  const [refinementCount, setRefinementCount] = useState(0);
  const [sourceProvider, setSourceProvider] = useState<string | undefined>(
    undefined,
  );
  const [sourceModel, setSourceModel] = useState<string | undefined>(undefined);

  // ✅ No longer depends on tripContext state — reads from ref directly
  const fetchTripPlan = useCallback(
    async (
      answers: string[],
      signal?: AbortSignal,
      contextOverride?: TripContext | null,
    ): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        const activeContext = contextOverride ?? tripContextRef.current;

        if (
          activeContext?.travel_dates.exact_start &&
          activeContext?.travel_dates.exact_end
        ) {
          const confirmRes = await fetch(`${BACKEND_BASE_URL}/trips/confirm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal,
            body: JSON.stringify({
              tripContext: activeContext,
              exactStartDate: activeContext.travel_dates.exact_start,
              exactEndDate: activeContext.travel_dates.exact_end,
              followUpAnswers: answers,
            }),
          });

          const confirmData = (await confirmRes.json()) as
            | ApiSuccessResponse
            | ApiErrorResponse;

          if (!confirmRes.ok) {
            throw new Error(
              getApiErrorMessage(
                confirmData as ApiErrorResponse,
                "Failed to generate itinerary",
              ),
            );
          }

          setResponse(
            "result" in confirmData ? (confirmData.result ?? null) : null,
          );
          setSourceProvider(
            "provider" in confirmData ? confirmData.provider : undefined,
          );
          setSourceModel("model" in confirmData ? confirmData.model : undefined);
          return true;
        }

        // Legacy URL-based flow
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

        const data = (await res.json()) as
          | ApiSuccessResponse
          | ApiErrorResponse;

        if (!res.ok) {
          throw new Error(
            getApiErrorMessage(
              data as ApiErrorResponse,
              "Failed to generate itinerary",
            ),
          );
        }

        setResponse("result" in data ? (data.result ?? null) : null);
        setSourceProvider("provider" in data ? data.provider : undefined);
        setSourceModel("model" in data ? data.model : undefined);
        return true;
      } catch (caughtError) {
        if (caughtError instanceof Error && caughtError.name === "AbortError") {
          return false;
        }
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Failed to generate itinerary",
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    // ✅ Only truly external values — ref is stable, no tripContext state here
    [location, theme, startDate, endDate],
  );

  useEffect(() => {
    const controller = new AbortController();
    setFollowUpAnswers([]);
    setRefinementCount(0);

    const timer = window.setTimeout(() => {
      const rawTripContext = sessionStorage.getItem("tripContext");

      if (rawTripContext) {
        try {
          const parsed = JSON.parse(rawTripContext) as TripContext;
          // ✅ Write to ref, not state — no re-render, no dep cascade
          tripContextRef.current = parsed;
          setLocationLabel(
            parsed.destination.resolved_region ||
              parsed.destination.raw_input ||
              "your destination",
          );
          void fetchTripPlan([], controller.signal, parsed);
          return;
        } catch {
          // Fallback to legacy URL-based flow
        }
      }

      if (!location || !theme || !startDate || !endDate) {
        setError("Missing trip criteria in URL parameters.");
        setIsLoading(false);
        return;
      }

      setLocationLabel(location);
      void fetchTripPlan([], controller.signal, null);
    }, 50);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // ✅ fetchTripPlan is now stable — this effect runs exactly once on mount
  }, [location, theme, startDate, endDate, fetchTripPlan]);

  const handleSubmitFollowUpAnswers = async (answers: string[]) => {
    if (isLoading) return;

    if (refinementCount >= MAX_FOLLOW_UP_REFINEMENTS) {
      setError(
        `Maximum follow-up refinements reached (${MAX_FOLLOW_UP_REFINEMENTS}).`,
      );
      return;
    }

    const validAnswers = answers
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    if (validAnswers.length === 0) {
      setError("Add at least one follow-up answer before refining.");
      return;
    }

    const combinedAnswers = [...followUpAnswers, ...validAnswers];
    const success = await fetchTripPlan(combinedAnswers);

    if (success) {
      setFollowUpAnswers(combinedAnswers);
      setRefinementCount((c) => c + 1);
    }
  };

  const handleSaveTripClick = () => {
    const save = async (): Promise<SaveTripResult> => {
      const normalizedItinerary = normalizeTripItinerary(response);

      if (!normalizedItinerary) {
        return {
          status: "error",
          message: "Cannot save: itinerary payload is not valid yet.",
        };
      }

      const exactStart =
        tripContextRef.current?.travel_dates.exact_start ?? "";
      const exactEnd = tripContextRef.current?.travel_dates.exact_end ?? "";
      const saveStartDate = exactStart || startDate;
      const saveEndDate = exactEnd || endDate;

      if (!saveStartDate || !saveEndDate) {
        return {
          status: "error",
          message: "Cannot save: missing trip dates.",
        };
      }

      const saveLocation =
        normalizedItinerary.tripOverview.destination || locationLabel;

      try {
        const saveRes = await apiFetch('/trips', {
          method: 'POST',
          body: JSON.stringify({
            location: saveLocation,
            startDate: saveStartDate,
            endDate: saveEndDate,
            provider: sourceProvider,
            model: sourceModel,
            itinerary: normalizedItinerary,
          }),
        }, profileId);

        if (!saveRes.ok) {
          const saveError = (await saveRes.json()) as ApiErrorResponse;
          console.error('[save-trip] 400 error:', JSON.stringify(saveError));
          return {
            status: "error",
            message: getApiErrorMessage(
              saveError,
              "Failed to save trip. Please verify backend connection.",
            ),
          };
        }

        router.push("/my-trips");
        return {
          status: "success",
          message: "Trip saved successfully.",
          showMyTripsLink: true,
        };
      } catch {
        return {
          status: "error",
          message: "Failed to save trip. Please verify backend connection.",
        };
      }
    };

    return save();
  };

  const handleRetry = () => {
    void fetchTripPlan(followUpAnswers);
  };

  return (
    <Loading
      location={locationLabel}
      response={response}
      isLoading={isLoading}
      error={error}
      onSubmitFollowUpAnswers={handleSubmitFollowUpAnswers}
      onSaveTripClick={handleSaveTripClick}
      onRetry={handleRetry}
    />
  );
}
