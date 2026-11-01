import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import OpenAI from "openai";
import { supabase } from "@/services/supabaseClient";

const MODELS_TO_TRY = [
  process.env.OPENROUTER_MODEL,
  "openrouter/free",
  "liquid/lfm-2.5-2.6b:free",
  "nvidia/nemotron-3.5-lightning:free",
].filter(Boolean);

export async function POST(req) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let resumeText = "";
    let jobRole = "Software Engineer / Technical Specialist";
    let jobDescription = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      const roleFromForm = formData.get("jobRole");
      const descFromForm = formData.get("jobDescription");

      if (roleFromForm) jobRole = roleFromForm;
      if (descFromForm) jobDescription = descFromForm;

      if (!file) {
        return NextResponse.json(
          { error: "No PDF file provided." },
          { status: 400 }
        );
      }

      // Convert file to buffer and extract text
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      try {
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        resumeText = result?.text?.trim() || "";
      } catch (parseErr) {
        console.error("PDF parse error:", parseErr);
        return NextResponse.json(
          { error: "Failed to extract text from PDF. Ensure the PDF contains readable text." },
          { status: 422 }
        );
      }
    } else {
      // JSON body: { text, jobRole, jobDescription, cvFilePath }
      const body = await req.json();
      jobRole = body.jobRole || jobRole;
      jobDescription = body.jobDescription || "";

      if (body.text) {
        resumeText = body.text.trim();
      } else if (body.cvFilePath) {
        // Download from Supabase storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from("cv-uploads")
          .download(body.cvFilePath);

        if (downloadError || !fileData) {
          return NextResponse.json(
            { error: "Could not download resume from storage: " + (downloadError?.message || "File not found") },
            { status: 404 }
          );
        }

        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        resumeText = result?.text?.trim() || "";
      }
    }

    if (!resumeText || resumeText.length < 20) {
      return NextResponse.json(
        { error: "The uploaded PDF appears to be empty or contains scanned images without extractable text." },
        { status: 422 }
      );
    }

    // Call OpenRouter Free API to analyze and score resume
    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const SYSTEM_PROMPT = `You are an expert AI Technical Recruiter and ATS evaluation system.
Evaluate the candidate's resume against the specified target job role.

Target Job Role: ${jobRole}
${jobDescription ? `Job Description / Requirements: ${jobDescription}\n` : ""}

Resume Content:
${resumeText.slice(0, 7500)}

Evaluate objectively and return a valid JSON object matching this schema:
{
  "score": <integer from 0 to 100 representing role match>,
  "scoreBand": "<One of: 'Exceptional' | 'Strong Match' | 'Moderate Match' | 'Needs Improvement'>",
  "matchHeadline": "<One crisp sentence summarizing the candidate's alignment with the role>",
  "summary": "<2-3 sentence executive overview of candidate's background and experience>",
  "topSkills": ["<skill1>", "<skill2>", ... up to 10 skills found in resume],
  "matchingStrengths": [
    "<key strength directly aligned with the target role>",
    "<second strength>",
    "<third strength>"
  ],
  "skillGaps": [
    "<missing skill, keyword, or qualification commonly expected for this role>",
    "<second gap>"
  ],
  "actionableTips": [
    "<specific actionable tip to improve this resume for the target role>",
    "<second actionable tip>",
    "<third actionable tip>"
  ]
}

Respond ONLY with the JSON object. Do not wrap in markdown or add explanations.`;

    let completion = null;
    let lastError = null;

    for (const model of MODELS_TO_TRY) {
      try {
        completion = await openai.chat.completions.create({
          model,
          messages: [{ role: "user", content: SYSTEM_PROMPT }],
          temperature: 0.3,
        });

        if (completion?.choices?.[0]?.message?.content) {
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Resume scoring model ${model} failed, trying fallback:`, err?.message || err);
      }
    }

    if (!completion?.choices?.[0]?.message?.content) {
      throw lastError || new Error("All AI models failed to score resume.");
    }

    const rawContent = completion.choices[0].message.content.trim();
    let cleanJson = rawContent;

    // Remove markdown code fences if present
    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
    } else if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```\s*/, "").replace(/\s*```$/, "").trim();
    }

    let analysis;
    try {
      analysis = JSON.parse(cleanJson);
    } catch {
      // If parsing fails, extract JSON block via regex
      const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse AI evaluation response as JSON.");
      }
    }

    return NextResponse.json({
      success: true,
      text: resumeText,
      analysis,
      jobRole,
    });
  } catch (error) {
    console.error("Resume Parse & Score Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process resume." },
      { status: 500 }
    );
  }
}
