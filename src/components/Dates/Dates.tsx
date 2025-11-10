"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Dates() {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const location = searchParams.get("location") || "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }
    setError(null);

    // Navigate to the Theme step, passing current data as URL params
    router.push(
      `/new-trip/theme?location=${encodeURIComponent(location)}&startDate=${
        startDate.toISOString().split("T")[0]
      }&endDate=${endDate.toISOString().split("T")[0]}`
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background-second text-center w-full">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 bg-white/10 p-8 rounded-lg shadow-lg w-full max-w-md items-center"
      >
        <p className="text-lg font-semibold text-white">
          Select your travel dates for{" "}
          <span className="text-background-first">{location}</span>
        </p>

        <label className="text-white text-sm w-full text-left">
          Start Date:
          <input
            type="date"
            value={startDate ? startDate.toISOString().split("T")[0] : ""}
            onChange={(e) => setStartDate(new Date(e.target.value))}
            className="w-full p-3 mt-1 rounded-md text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-background-first"
          />
        </label>

        <label className="text-white text-sm w-full text-left">
          End Date:
          <input
            type="date"
            value={endDate ? endDate.toISOString().split("T")[0] : ""}
            onChange={(e) => setEndDate(new Date(e.target.value))}
            className="w-full p-3 mt-1 rounded-md text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-background-first"
          />
        </label>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          className="button mt-4 hover:scale-[1.05] transition-transform duration-300"
        >
          Next
        </button>
      </form>
    </div>
  );
}
