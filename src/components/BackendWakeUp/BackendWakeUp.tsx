"use client";

import { useEffect } from "react";

export default function BackendWakeUp() {
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/health`, {
      method: "GET",
      cache: "no-store",
    }).catch(() => {
      // silently ignore — just waking up the server
    });
  }, []);

  return null;
}
