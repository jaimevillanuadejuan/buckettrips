"use client";

import React from "react";
import { motion } from "framer-motion";
import FlightResults from "@/components/FlightResults/FlightResults";
import Itinerary from "@/components/Itinerary/Itinerary";
import { normalizeTripItinerary } from "@/types/itinerary";
import type { SaveTripResult } from "@/types/saved-trip";

interface LoadingProps {
  location: string;
  response: unknown;
  isLoading: boolean;
  error: string | null;
  onSubmitFollowUpAnswers: (answers: string[]) => Promise<void> | void;
  onSaveTripClick?: () => Promise<SaveTripResult> | SaveTripResult;
  onRetry?: () => void;
  readOnly?: boolean;
  tripStartDate?: string;
  tripEndDate?: string;
  tripOriginCity?: string | null;
  tripFlightBudget?: { amount: number; currency: string } | null;
}

export default function Loading({
  location,
  response,
  isLoading,
  error,
  onSubmitFollowUpAnswers,
  onSaveTripClick,
  onRetry,
  readOnly = false,
  tripStartDate,
  tripEndDate,
  tripOriginCity,
  tripFlightBudget,
}: LoadingProps) {
  const responseText =
    typeof response === "string"
      ? response
      : response
      ? JSON.stringify(response, null, 2)
      : "";
  const itinerary = normalizeTripItinerary(response);
  const shouldCenterLoadingState = isLoading && !error && !response;

  return (
    <motion.div
      className={`w-full min-h-[calc(100vh-220px)] flex flex-col items-center text-center ${
        shouldCenterLoadingState ? "justify-center" : "justify-start pt-6"
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {isLoading && (
        <motion.div
          className="h-20 w-20 rounded-full border-4 border-t-4 border-background-first border-t-background-third animate-spin mb-8 shadow-lg shadow-background-first/30"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
        ></motion.div>
      )}

      <motion.p
        className="text-xl font-semibold text-background-fourth"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        {isLoading ? "Preparing your trip to " : "Trip itinerary for "}
        <span className="text-background-third font-bold">{location}</span>...
      </motion.p>

      {error && (
        <motion.div
          className="mt-4 max-w-2xl mx-auto px-4 flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <p className="text-sm text-red-300 text-center">{error}</p>
          {onRetry && (
            <button
              type="button"
              className="button"
              onClick={onRetry}
              disabled={isLoading}
            >
              {isLoading ? "Retrying..." : "Try again"}
            </button>
          )}
        </motion.div>
      )}

      {!error && !isLoading && itinerary && (
        <>
          {tripStartDate && tripEndDate && location && (
            <FlightResults
              destination={location}
              startDate={tripStartDate}
              endDate={tripEndDate}
              originCity={tripOriginCity}
              flightBudget={tripFlightBudget}
            />
          )}
          <Itinerary
            itinerary={itinerary}
            isSubmitting={isLoading}
            onSubmitFollowUpAnswers={onSubmitFollowUpAnswers}
            onSaveTripClick={onSaveTripClick}
            readOnly={readOnly}
          />
        </>
      )}

      {!error && !isLoading && !itinerary && responseText && (
        <pre className="text-left whitespace-pre-wrap text-sm text-slate-100 mt-6 w-full max-w-4xl mx-auto surface-card rounded-lg p-4 overflow-x-auto">
          {responseText}
        </pre>
      )}
    </motion.div>
  );
}
