"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Country {
  country: string;
  cities: string[];
}

export default function NewTrip() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();

  // Load countries once
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch(
          "https://countriesnow.space/api/v0.1/countries"
        );
        const json = await res.json();
        setCountries(json.data || []);
      } catch (err) {
        console.error("Error fetching countries:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCountries();
  }, []);

  // Handle input change
  const handleLocation = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocation(value);

    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const search = value.toLowerCase();
    const matches: string[] = [];

    for (const c of countries) {
      if (c.country.toLowerCase().includes(search)) matches.push(c.country);

      for (const city of c.cities) {
        if (city.toLowerCase().includes(search)) matches.push(city);
        if (matches.length >= 8) break;
      }
      if (matches.length >= 8) break;
    }

    setSuggestions(matches);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (value: string) => {
    setLocation(value);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const found = countries.some(
      (c) =>
        c.country.toLowerCase() === location.toLowerCase() ||
        c.cities.some((city) => city.toLowerCase() === location.toLowerCase())
    );

    if (found) {
      router.push(`/new-trip/dates?location=${encodeURIComponent(location)}`);
    } else {
      alert("Please introduce a valid location");
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-background-second text-center w-full">
      <form
        onSubmit={handleSubmit}
        className="relative flex flex-col items-center gap-4 p-6 bg-white/10 rounded-lg shadow-lg w-full max-w-sm select-none"
      >
        <p className="text-lg font-semibold text-white">
          Introduce your desired location
        </p>

        <div className="relative w-full">
          <input
            type="text"
            name="location"
            value={location}
            onChange={handleLocation}
            placeholder="Search destination..."
            onFocus={() => location && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="w-full rounded-lg p-3 text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-background-first shadow-md transition-all duration-300"
          />

          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-20 w-full bg-background-third text-white rounded-md mt-2 shadow-xl overflow-hidden max-h-64 overflow-y-auto animate-fadeIn">
              {suggestions.map((s, i) => (
                <li
                  key={i}
                  onClick={() => handleSuggestionClick(s)}
                  className="px-4 py-2 text-left cursor-pointer hover:bg-background-first hover:text-white transition-colors"
                >
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          className="button mt-3 hover:scale-[1.05] transition-transform duration-300"
        >
          Next
        </button>

        {loading && (
          <p className="text-sm text-gray-300 mt-2 animate-pulse">
            Loading country data...
          </p>
        )}
      </form>
    </div>
  );
}
