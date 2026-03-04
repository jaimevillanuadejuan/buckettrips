"use client";

import React from "react";
import { motion } from "framer-motion";
import Itinerary from "@/components/Itinerary/Itinerary";
import { isTripItinerary } from "@/types/itinerary";

interface LoadingProps {
  location: string;
  response: unknown;
  isLoading: boolean;
  error: string | null;
  onSubmitFollowUpAnswers: (answers: string[]) => Promise<void> | void;
  onSaveTripClick?: () => void;
}

export default function Loading({
  location,
  response,
  isLoading,
  error,
  onSubmitFollowUpAnswers,
  onSaveTripClick,
}: LoadingProps) {
  const responseText =
    typeof response === "string"
      ? response
      : response
      ? JSON.stringify(response, null, 2)
      : "";
  const itinerary = isTripItinerary(response) ? response : null;

  return (
    <motion.div
      className="w-full min-h-[calc(100vh-220px)] flex flex-col items-center justify-start text-center pt-6"
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
        <motion.p
          className="text-sm text-red-300 mt-4 max-w-2xl mx-auto px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {error}
        </motion.p>
      )}

      {!error && !isLoading && itinerary && (
        <Itinerary
          itinerary={itinerary}
          isSubmitting={isLoading}
          onSubmitFollowUpAnswers={onSubmitFollowUpAnswers}
          onSaveTripClick={onSaveTripClick}
        />
      )}

      {!error && !isLoading && !itinerary && responseText && (
        <pre className="text-left whitespace-pre-wrap text-sm text-slate-100 mt-6 w-full max-w-4xl mx-auto surface-card rounded-lg p-4 overflow-x-auto">
          {responseText}
        </pre>
      )}
    </motion.div>
  );
}
