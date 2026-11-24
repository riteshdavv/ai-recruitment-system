import { NextResponse } from "next/server";
import { sendCandidateDecisionEmail } from "@/lib/mail";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client (service role not needed — anon key is fine for UPDATE with matching email)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      candidateEmail,
      candidateName = "Candidate",
      jobPosition = "Position Specialist",
      interviewId,          // optional: used to scope the DB update
      decisionType = "selected",
      subject,
      message,
      companyName = "RecruitAI Hiring Team",
    } = body;

    if (!candidateEmail || !candidateEmail.trim()) {
      return NextResponse.json(
        { error: "Candidate email address is required." },
        { status: 400 }
      );
    }

    const cleanEmail = candidateEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Invalid candidate email address format." },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Email message body cannot be empty." },
        { status: 400 }
      );
    }

    // --- Persist the recruiter's decision to interview_results ---
    // Map decisionType to a canonical status visible on the candidate dashboard
    const decisionStatusMap = {
      selected: "Advanced",
      reevaluate: "Follow-up Required",
      rejected: "Rejected",
    };
    const recruiterDecision = decisionStatusMap[decisionType] || decisionType;

    try {
      let query = supabase
        .from("interview_results")
        .update({ recruiter_decision: recruiterDecision })
        .eq("email", cleanEmail);

      // Scope to specific interview if ID provided, otherwise update most recent
      if (interviewId) {
        query = query.eq("interview_id", interviewId);
      } else {
        query = query.order("completed_at", { ascending: false }).limit(1);
      }

      const { error: updateError } = await query;
      if (updateError) {
        console.warn("Could not persist recruiter_decision to DB:", updateError.message);
        // Non-fatal — email still sends even if DB update fails
      }
    } catch (dbErr) {
      console.warn("DB update error (non-fatal):", dbErr?.message);
    }

    const result = await sendCandidateDecisionEmail({
      candidateEmail: cleanEmail,
      candidateName: candidateName.trim(),
      jobPosition: jobPosition.trim(),
      decisionType,
      subject: subject?.trim(),
      message: message.trim(),
      companyName: companyName.trim(),
    });

    return NextResponse.json({
      success: true,
      email: cleanEmail,
      messageId: result.messageId,
      previewUrl: result.previewUrl,
      isTest: result.isTest,
    });
  } catch (err) {
    console.error("Error in /api/interview/send-decision:", err);
    return NextResponse.json(
      { error: err.message || "Failed to dispatch decision email." },
      { status: 500 }
    );
  }
}

