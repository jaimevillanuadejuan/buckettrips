"use client";

import { useSearchParams } from "next/navigation";
import Loading from "@/components/Loading/Loading";

export default function TripLoadingPage() {
  const searchParams = useSearchParams();
  const location = searchParams.get("location") || "your destination";
  const theme = searchParams.get("theme") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  const response = null; // Later you’ll replace this with OpenAI data

  return <Loading location={`${location} (${theme})`} response={response} />;
}
