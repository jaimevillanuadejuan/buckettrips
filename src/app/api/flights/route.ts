import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL =
  process.env.BACKEND_URL ?? "http://localhost:8080";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY ?? "";

// Flights are not user-specific — no auth required
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const backendUrl = new URL(`${BACKEND_BASE_URL}/api/flights/search`);
  searchParams.forEach((value, key) => backendUrl.searchParams.set(key, value));

  const res = await fetch(backendUrl.toString(), {
    headers: {
      "X-Api-Key": INTERNAL_API_KEY,
    },
    cache: "no-store",
  });

  const data = (await res.json()) as unknown;
  return NextResponse.json(data, { status: res.status });
}
