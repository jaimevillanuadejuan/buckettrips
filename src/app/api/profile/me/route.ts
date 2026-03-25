import { auth } from "@/auth";
import { NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BACKEND_URL ?? "http://localhost:8080";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY ?? "";

export async function GET() {
  const session = await auth();
  const profileId = session?.user?.profileId;
  if (!profileId) return NextResponse.json({ preferredCurrency: null });

  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/profile/me`, {
      headers: {
        "X-Profile-Id": profileId,
        "X-Api-Key": INTERNAL_API_KEY,
      },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ preferredCurrency: null });
    const data = (await res.json()) as { preferredCurrency?: string | null };
    return NextResponse.json({ preferredCurrency: data.preferredCurrency ?? null });
  } catch {
    return NextResponse.json({ preferredCurrency: null });
  }
}
