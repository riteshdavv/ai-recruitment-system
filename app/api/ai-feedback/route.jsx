import OpenAI from "openai";
import { FEEDBACK_PROMPT } from "@/services/Constants";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { conversation } = await req.json();
    const FINAL_PROMPT = FEEDBACK_PROMPT.replace("{{conversation}}", JSON.stringify(conversation || []));

    let completion = null;

    // 1. Primary: Groq (ultra-fast, supports json_object response_format, no rate-limits)
    if (process.env.GROQ_API_KEY) {
      try {
        const groq = new OpenAI({
          baseURL: "https://api.groq.com/openai/v1",
          apiKey: process.env.GROQ_API_KEY,
        });

        completion = await groq.chat.completions.create({
          model: "openai/gpt-oss-120b",
          messages: [{ role: "user", content: FINAL_PROMPT }],
          response_format: { type: "json_object" },
          temperature: 0.2,
        });
      } catch (groqErr) {
        console.warn("Groq feedback generation failed, trying OpenRouter fallback:", groqErr?.message || groqErr);
      }
    }

    // 2. Fallback: OpenRouter
    if (!completion?.choices?.[0]?.message && process.env.OPENROUTER_API_KEY) {
      const openrouter = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY,
      });

      const MODELS_TO_TRY = [
        process.env.OPENROUTER_MODEL,
        "openrouter/free",
        "liquid/lfm-2.5-2.6b:free",
        "nvidia/nemotron-3.5-lightning:free",
      ].filter(Boolean);

      for (const model of MODELS_TO_TRY) {
        try {
          completion = await openrouter.chat.completions.create({
            model,
            messages: [{ role: "user", content: FINAL_PROMPT }],
          });

          if (completion?.choices?.[0]?.message) {
            break;
          }
        } catch (err) {
          console.warn(`OpenRouter model ${model} failed:`, err?.message || err);
        }
      }
    }

    if (!completion?.choices?.[0]?.message) {
      throw new Error("All AI providers failed to generate evaluation feedback.");
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