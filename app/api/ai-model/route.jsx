import { QUESTIONS_PROMPT } from "@/services/Constants";
import { NextResponse } from "next/server";
import OpenAI from "openai";

// Models to try in order of preference (using free models on OpenRouter)
const MODELS_TO_TRY = [
  process.env.OPENROUTER_MODEL,
  "openrouter/free",
  "liquid/lfm-2.5-2.6b:free",
  "nvidia/nemotron-3.5-lightning:free",
].filter(Boolean);

export async function POST(req) {
  try {
    const { jobPosition, jobDescription, duration, type } = await req.json();
    const FINAL_PROMPT = QUESTIONS_PROMPT
      .replace('{{jobTitle}}', jobPosition)
      .replace('{{jobDescription}}', jobDescription)
      .replace('{{duration}}', duration)
      .replace('{{type}}', type);

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
        console.warn(`Model ${model} failed, trying next fallback:`, err?.message || err);
      }
    }

    if (!completion?.choices?.[0]?.message) {
      throw lastError || new Error("All AI models failed to generate questions.");
    }

    const message = completion.choices[0].message;
    const content = message?.content || message?.Content || message;
    return NextResponse.json({ content });
  } catch (e) {
    console.error("AI Model Route Error:", e);
    return NextResponse.json(
      { error: e?.message || "Failed to generate interview questions" },
      { status: 500 }
    );
  }
}