import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
    if (!res.ok) throw new Error("ipapi failed");
    const data = (await res.json()) as { currency?: string; country_code?: string };
    return NextResponse.json({ currency: data.currency ?? null, countryCode: data.country_code ?? null });
  } catch {
    try {
      const res2 = await fetch("https://ipwho.is/", { cache: "no-store" });
      if (!res2.ok) throw new Error("ipwho failed");
      const data2 = (await res2.json()) as { currency?: { code?: string }; country_code?: string };
      return NextResponse.json({ currency: data2.currency?.code ?? null, countryCode: data2.country_code ?? null });
    } catch {
      return NextResponse.json({ currency: null, countryCode: null });
    }
  }
}
