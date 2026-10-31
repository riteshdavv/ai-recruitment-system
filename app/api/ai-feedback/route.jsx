import OpenAI from "openai";
import { FEEDBACK_PROMPT } from "@/services/Constants";
import { NextResponse } from "next/server";

const MODELS_TO_TRY = [
  process.env.OPENROUTER_MODEL,
  "openrouter/free",
  "liquid/lfm-2.5-2.6b:free",
  "nvidia/nemotron-3.5-lightning:free",
].filter(Boolean);

export async function POST(req) {
  try {
    const { conversation } = await req.json();
    const FINAL_PROMPT = FEEDBACK_PROMPT.replace("{{conversation}}", JSON.stringify(conversation));

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    let completion = null;
    let lastError = null;

    for (const model of MODELS_TO_TRY) {
      try {
        completion = await openai.chat.completions.create({
          model,
          messages: [{ role: "user", content: FINAL_PROMPT }],
        });

        if (completion?.choices?.[0]?.message) {
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Feedback model ${model} failed, trying next fallback:`, err?.message || err);
      }
    }

    if (!completion?.choices?.[0]?.message) {
      throw lastError || new Error("All AI models failed to generate feedback.");
    }

    return NextResponse.json(completion.choices[0].message);
  } catch (e) {
    console.error("AI Feedback Route Error:", e);
    return NextResponse.json(
      { error: e?.message || "Failed to generate interview feedback" },
      { status: 500 }
    );
  }
}