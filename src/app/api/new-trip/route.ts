import { NextResponse } from "next/server";

// Legacy route — trip generation is now handled by the NestJS backend
// via /api/trips/confirm (conversational flow). This route is kept as a
// fallback for URL-param based flows only.

interface NewTripRequestBody {
  location?: string;
  startDate?: string;
  endDate?: string;
  followUpAnswers?: string[];
}

interface OpenRouterErrorPayload {
  error?: {
    message?: string;
    code?: number | string;
  };
}

interface OpenRouterSuccessPayload {
  choices?: Array<{
    message?: {
      content?:
        | string
        | Array<{
            type?: string;
            text?: string;
          }>;
    };
  }>;
}

const DEFAULT_OPENROUTER_MODEL = "openrouter/free";
const MAX_FOLLOW_UP_ANSWERS = 8;

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function getInclusiveTripDays(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  return Math.floor((end - start) / (24 * 60 * 60 * 1000)) + 1;
}

function stripCodeFence(value: string): string {
  return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function extractOpenRouterText(payload: OpenRouterSuccessPayload): string {
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) return content.map((p) => p.text ?? "").join("").trim();
  return "";
}

export async function POST(req: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "Missing OPENROUTER_API_KEY server configuration" },
      { status: 500 }
    );
  }

  try {
    const body = (await req.json()) as NewTripRequestBody;
    const location = body.location?.trim() ?? "";
    const startDate = body.startDate?.trim() ?? "";
    const endDate = body.endDate?.trim() ?? "";
    const followUpAnswers = (
      Array.isArray(body.followUpAnswers)
        ? body.followUpAnswers.filter(
            (a): a is string => typeof a === "string" && a.trim().length > 0
          )
        : []
    ).slice(0, MAX_FOLLOW_UP_ANSWERS);

    if (!location || !startDate || !endDate) {
      return NextResponse.json(
        { error: "location, startDate and endDate are required" },
        { status: 400 }
      );
    }

    if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
      return NextResponse.json({ error: "Dates must use YYYY-MM-DD format" }, { status: 400 });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return NextResponse.json(
        { error: "startDate must be before or equal to endDate" },
        { status: 400 }
      );
    }

    const tripDays = getInclusiveTripDays(startDate, endDate);
    const model = process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL;
    const priorAnswers =
      followUpAnswers.length > 0
        ? followUpAnswers.map((a) => `- ${a}`).join("\n")
        : "- none yet";

    const userPrompt = `Create a full travel plan:
- Destination: ${location}
- Dates: ${startDate} to ${endDate}
- Trip length: ${tripDays} day(s)
- Prior follow-up answers:\n${priorAnswers}

Return this exact JSON shape:
{
  "tripOverview": { "destination": "string", "travelWindow": "string", "planningStyle": "string", "keyAssumptions": ["string"] },
  "dailyItinerary": [{ "day": 1, "date": "YYYY-MM-DD", "focus": "string", "morning": ["string"], "afternoon": ["string"], "evening": ["string"], "estimatedBudgetEur": { "low": 0, "high": 0 }, "budgetTips": ["string"], "logisticsNotes": ["string"], "reservationAlerts": ["string"] }],
  "overallBudgetEstimateEur": { "low": 0, "high": 0, "notes": ["string"] },
  "followUpQuestions": [{ "question": "string", "whyItMatters": "string" }]
}`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_APP_NAME ?? "BucketTrips",
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          { role: "system", content: "You are a senior travel advisor. Output valid JSON only, no markdown fences, no extra prose." },
          { role: "user", content: userPrompt },
        ],
      }),
      cache: "no-store",
    });

    const json = (await res.json()) as OpenRouterErrorPayload | OpenRouterSuccessPayload;

    if (!res.ok) {
      const msg = "error" in json && json.error?.message ? json.error.message : "OpenRouter request failed";
      return NextResponse.json({ error: `OpenRouter API error: ${msg}` }, { status: res.status });
    }

    const rawText = extractOpenRouterText(json as OpenRouterSuccessPayload);
    if (!rawText) {
      return NextResponse.json({ error: "OpenRouter did not return a valid response" }, { status: 502 });
    }

    let result: unknown = stripCodeFence(rawText);
    try { result = JSON.parse(result as string); } catch { /* keep raw */ }

    return NextResponse.json({ result, model, provider: "openrouter", generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Failed to generate trip itinerary:", error);
    return NextResponse.json({ error: "Failed to generate trip itinerary" }, { status: 500 });
  }
}
