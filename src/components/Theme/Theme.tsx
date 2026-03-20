"use client";

import { useRouter } from "next/navigation";

// Theme selection is no longer part of the trip creation flow.
// Trip planning is handled entirely through the conversational VoiceTripBuilder.
export default function Theme() {
  const router = useRouter();
  router.replace("/new-trip");
  return null;
}
