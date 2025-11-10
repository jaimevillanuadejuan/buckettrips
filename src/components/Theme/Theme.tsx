"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import nature from "../../assets/images/nature.jpg";
import historic from "../../assets/images/historic.jpg";

export default function Theme() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const location = searchParams.get("location") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  const [themeChoice, setThemeChoice] = React.useState("");

  const handleChoice = (event: React.MouseEvent<HTMLImageElement>) => {
    const chosen = event.currentTarget.getAttribute("data-theme") || "";
    setThemeChoice(chosen);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!themeChoice) {
      alert(`Please choose a theme for your trip to ${location}`);
      return;
    }

    // Navigate to loading screen with full trip details
    router.push(
      `/new-trip/loading?location=${encodeURIComponent(
        location
      )}&startDate=${startDate}&endDate=${endDate}&theme=${themeChoice}`
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background-second text-center">
      <form
        className="flex flex-col items-center justify-center gap-8 p-10 bg-white/10 rounded-2xl shadow-2xl w-full max-w-lg backdrop-blur-sm"
        onSubmit={handleSubmit}
      >
        <p className="text-xl font-semibold text-white">
          Choose a theme for your trip to{" "}
          <span className="text-background-first">{location}</span>
        </p>

        <div className="flex flex-wrap justify-center items-center gap-8">
          <div
            className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg border-4 ${
              themeChoice === "nature"
                ? "border-background-first shadow-background-first/50 scale-105"
                : "border-transparent hover:border-background-third"
            }`}
          >
            <img
              src={nature.src}
              alt="Nature theme"
              data-theme="nature"
              onClick={handleChoice}
              className="w-44 h-44 object-cover rounded-xl"
            />
            <span className="absolute bottom-0 left-0 w-full bg-black/50 text-white py-1 text-sm font-semibold">
              Nature
            </span>
          </div>

          <div
            className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg border-4 ${
              themeChoice === "historic"
                ? "border-background-first shadow-background-first/50 scale-105"
                : "border-transparent hover:border-background-third"
            }`}
          >
            <img
              src={historic.src}
              alt="Historic theme"
              data-theme="historic"
              onClick={handleChoice}
              className="w-44 h-44 object-cover rounded-xl"
            />
            <span className="absolute bottom-0 left-0 w-full bg-black/50 text-white py-1 text-sm font-semibold">
              Historic
            </span>
          </div>
        </div>

        <button
          type="submit"
          className="button mt-4 hover:scale-105 transition-transform duration-300"
        >
          Next
        </button>
      </form>
    </div>
  );
}
