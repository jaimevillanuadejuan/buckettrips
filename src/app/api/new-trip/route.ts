import { NextResponse } from "next/server";

type TripTheme = "nature" | "historic";

interface NewTripRequestBody {
  location?: string;
  startDate?: string;
  endDate?: string;
  theme?: string;
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function getInclusiveTripDays(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((end - start) / msPerDay) + 1;
}

function stripCodeFence(value: string): string {
  const withoutStart = value.replace(/^```(?:json)?\s*/i, "");
  return withoutStart.replace(/\s*```$/i, "").trim();
}

function extractOpenRouterText(payload: OpenRouterSuccessPayload): string {
  const content = payload.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => part.text ?? "")
      .join("")
      .trim();
  }

  return "";
}

function buildSystemPrompt(): string {
  return [
    "You are a senior travel agency advisor who produces practical, detailed itineraries.",
    "Prioritize budget-friendly planning, realistic logistics, and activities aligned with the client's chosen theme.",
    "You must adapt recommendations to the provided destination and travel dates.",
    "Always include an iterative discovery flow by asking focused follow-up questions that uncover missing preferences.",
    "Output must be valid JSON only, with no markdown fences and no extra prose.",
  ].join(" ");
}

function buildUserPrompt(params: {
  location: string;
  startDate: string;
  endDate: string;
  theme: TripTheme;
  tripDays: number;
  followUpAnswers: string[];
}): string {
  const themeFocus =
    params.theme === "nature"
      ? "nature-based attractions, parks, scenic routes, outdoor experiences"
      : "historic landmarks, museums, old towns, heritage walks, cultural sites";

  const priorAnswers =
    params.followUpAnswers.length > 0
      ? params.followUpAnswers.map((answer) => `- ${answer}`).join("\n")
      : "- none yet";

  return `Create a full travel plan for these client criteria:
- Destination: ${params.location}
- Dates: ${params.startDate} to ${params.endDate}
- Theme: ${params.theme}
- Trip length: ${params.tripDays} day(s)
- Prior follow-up answers:
${priorAnswers}

Planning requirements:
1) Build a day-by-day itinerary that covers morning, afternoon, and evening.
2) Keep arrival and departure days lighter and budget-friendly.
3) Include attractions and activities strongly matched to ${themeFocus}.
4) Recommend budget-conscious food, local transport, and free/low-cost alternatives each day.
5) Flag reservation-critical items (tickets, timed entries, seasonal constraints).
6) Include practical pacing; avoid unrealistic travel times or overpacked schedules.
7) Make any assumptions explicit when information is missing.
8) Add 3-5 high-value follow-up questions for iterative refinement.

Return this exact JSON shape:
{
  "tripOverview": {
    "destination": "string",
    "travelWindow": "string",
    "theme": "nature | historic",
    "planningStyle": "string",
    "keyAssumptions": ["string"]
  },
  "dailyItinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "focus": "string",
      "morning": ["string"],
      "afternoon": ["string"],
      "evening": ["string"],
      "estimatedBudgetEur": {
        "low": 0,
        "high": 0
      },
      "budgetTips": ["string"],
      "logisticsNotes": ["string"],
      "reservationAlerts": ["string"]
    }
  ],
  "overallBudgetEstimateEur": {
    "low": 0,
    "high": 0,
    "notes": ["string"]
  },
  "followUpQuestions": [
    {
      "question": "string",
      "whyItMatters": "string"
    }
  ]
}`;
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
    const theme = body.theme?.trim() ?? "";
    const followUpAnswers = (
      Array.isArray(body.followUpAnswers)
        ? body.followUpAnswers.filter(
            (answer): answer is string =>
              typeof answer === "string" && answer.trim().length > 0
          )
        : []
    ).slice(0, MAX_FOLLOW_UP_ANSWERS);

    if (!location || !startDate || !endDate || !theme) {
      return NextResponse.json(
        { error: "location, startDate, endDate and theme are required" },
        { status: 400 }
      );
    }

    if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
      return NextResponse.json(
        { error: "Dates must use YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    if (new Date(startDate) > new Date(endDate)) {
      return NextResponse.json(
        { error: "startDate must be before or equal to endDate" },
        { status: 400 }
      );
    }

    if (theme !== "nature" && theme !== "historic") {
      return NextResponse.json(
        { error: "theme must be either nature or historic" },
        { status: 400 }
      );
    }

    const tripDays = getInclusiveTripDays(startDate, endDate);
    const model = process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL;
    const endpoint = "https://openrouter.ai/api/v1/chat/completions";

    const openRouterRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer":
          process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_APP_NAME ?? "BucketTrips",
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          { role: "system", content: buildSystemPrompt() },
          {
            role: "user",
            content: buildUserPrompt({
              location,
              startDate,
              endDate,
              theme,
              tripDays,
              followUpAnswers,
            }),
          },
        ],
      }),
      cache: "no-store",
    });

    const openRouterJson = (await openRouterRes.json()) as
      | OpenRouterErrorPayload
      | OpenRouterSuccessPayload;

    if (!openRouterRes.ok) {
      const errorMessage =
        "error" in openRouterJson && openRouterJson.error?.message
          ? openRouterJson.error.message
          : "OpenRouter request failed";

      return NextResponse.json(
        { error: `OpenRouter API error: ${errorMessage}` },
        { status: openRouterRes.status }
      );
    }

    const rawText = extractOpenRouterText(
      openRouterJson as OpenRouterSuccessPayload
    );

    if (!rawText) {
      return NextResponse.json(
        { error: "OpenRouter did not return a valid itinerary response" },
        { status: 502 }
      );
    }

    const cleaned = stripCodeFence(rawText);
    let result: unknown = cleaned;

    try {
      result = JSON.parse(cleaned);
    } catch {
      // Keep raw text if parsing fails.
    }

    return NextResponse.json({
      result,
      model,
      provider: "openrouter",
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to generate trip itinerary:", error);
    return NextResponse.json(
      { error: "Failed to generate trip itinerary" },
      { status: 500 }
    );
  }
}
