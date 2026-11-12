import { NextResponse } from "next/server";
import { sendCandidateDecisionEmail } from "@/lib/mail";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      candidateEmail,
      candidateName = "Candidate",
      jobPosition = "Position Specialist",
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

