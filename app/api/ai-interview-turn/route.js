import { NextResponse } from "next/server";
import OpenAI from "openai";

const MODELS_TO_TRY = [
  process.env.OPENROUTER_MODEL,
  "openrouter/free",
  "liquid/lfm-2.5-2.6b:free",
  "nvidia/nemotron-3.5-lightning:free",
].filter(Boolean);

export async function POST(req) {
  try {
    const {
      jobPosition,
      jobDescription,
      candidateName = "Candidate",
      conversationHistory = [],
      questionList = [],
      turnCount = 1,
    } = await req.json();

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const isNearEnd = turnCount >= 5;

    const SYSTEM_PROMPT = `You are an expert Executive AI Technical Interviewer conducting a live, adaptive voice screening for the position of "${jobPosition}".
Candidate Name: ${candidateName}
${jobDescription ? `Job Context & Requirements: ${jobDescription}` : ""}
Baseline Curriculum Topics: ${JSON.stringify(questionList)}

CURRENT STATUS:
- Turn Number: ${turnCount} of 5.
${isNearEnd ? "- THIS IS THE FINAL TURN: Wrap up the interview gracefully, thank the candidate warmly, and state that their interview has concluded and responses are recorded." : "- INTERVIEW IN PROGRESS: Evaluate the candidate's last response and ask the next adaptive question."}

YOUR CORE DIRECTIVE - ADAPTIVE DYNAMIC INTERVIEWING:
Do NOT follow a static script. Evaluate the candidate's responses in real-time and dynamically adjust the difficulty, depth, and direction:
1. IF THE CANDIDATE GIVES A STRONG / QUALIFIED ANSWER:
   - Acknowledge their technical point briefly in half a sentence.
   - Elevate the challenge. Ask a technical follow-up exploring architecture trade-offs, edge cases, failure recovery, or scalability.
2. IF THE CANDIDATE GIVES A VAGUE OR BUZZWORD-HEAVY ANSWER:
   - Ask for a concrete practical implementation example from their real work experience.
3. IF THE CANDIDATE STRUGGLES:
   - Pivot warmly to another core competency area so they can demonstrate their strengths.

CONVERSATIONAL VOICE CONSTRAINTS:
- Keep your entire response under 2 to 3 sentences maximum.
- Ask exactly ONE question at a time.
- Sound conversational, friendly, professional, and natural.
- Output ONLY what the interviewer should speak out loud. No markdown, no role prefixes like "Interviewer:".`;

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory.slice(-8), // Keep context window focused
    ];

    let completion = null;
    let lastError = null;

    for (const model of MODELS_TO_TRY) {
      try {
        completion = await openai.chat.completions.create({
          model,
          messages,
          temperature: 0.4,
          max_tokens: 150,
        });

        if (completion?.choices?.[0]?.message?.content) {
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Turn model ${model} failed, trying fallback:`, err?.message || err);
      }
    }

    if (!completion?.choices?.[0]?.message?.content) {
      throw lastError || new Error("Failed to generate adaptive interview response.");
    }

    const message = completion.choices[0].message.content.trim();
    const isConcluded = isNearEnd || message.toLowerCase().includes("interview has concluded") || message.toLowerCase().includes("thank you for your time");

    return NextResponse.json({
      message,
      isConcluded,
      turnCount: turnCount + 1,
    });
  } catch (error) {
    console.error("AI Interview Turn Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process interview turn" },
      { status: 500 }
    );
  }
}

