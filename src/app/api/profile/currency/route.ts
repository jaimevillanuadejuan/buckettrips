import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BACKEND_URL ?? "http://localhost:8080";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY ?? "";

export async function POST(req: NextRequest) {
  const session = await auth();
  const profileId = session?.user?.profileId;
  if (!profileId) return NextResponse.json({ ok: false }, { status: 401 });

  const { currency } = (await req.json()) as { currency?: string };
  if (!currency) return NextResponse.json({ ok: false }, { status: 400 });

  const res = await fetch(`${BACKEND_BASE_URL}/api/profile/currency`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Profile-Id": profileId,
      "X-Api-Key": INTERNAL_API_KEY,
    },
    body: JSON.stringify({ currency }),
    cache: "no-store",
  });

  return NextResponse.json({ ok: res.ok });
}
