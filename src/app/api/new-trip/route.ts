import { NextResponse } from "next/server";

// If you want to use OpenAI's modern SDK:
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  // try {
  //   const { prompt } = await req.json();
  //   const completion = await openai.responses.create({
  //     model: "gpt-4o-mini",
  //     input: `Trip idea: ${prompt}\nGive a short trip plan summary.`,
  //   });
  //   // const text =
  //   //   completion.output_text ??
  //   //   completion.output?.[0]?.content?.[0]?.text ??
  //   //   "No content";
  //   return NextResponse.json({ result: text });
  // } catch (err: any) {
  //   console.error(err);
  //   return NextResponse.json(
  //     { error: "Failed to generate trip" },
  //     { status: 500 }
  //   );
  // }
}
