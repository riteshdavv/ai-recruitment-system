import { NextResponse } from "next/server";
import { sendInterviewInviteEmail } from "@/lib/mail";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      interview_id,
      candidates,
      jobPosition = "Technical Specialist",
      jobDescription = "",
      duration = "15 Min",
      customMessage = "",
      companyName = "RecruitAI Team",
    } = body;

    if (!interview_id) {
      return NextResponse.json(
        { error: "interview_id is required." },
        { status: 400 }
      );
    }

    if (!candidates || (Array.isArray(candidates) && candidates.length === 0)) {
      return NextResponse.json(
        { error: "At least one candidate email is required." },
        { status: 400 }
      );
    }

    // Normalize candidates into an array of { email, name }
    let candidateList = [];
    if (typeof candidates === "string") {
      // Split by comma, semicolon, space, or newline
      candidateList = candidates
        .split(/[\s,;]+/)
        .map((e) => e.trim())
        .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
        .map((email) => ({ email, name: "" }));
    } else if (Array.isArray(candidates)) {
      candidateList = candidates
        .map((item) => {
          if (typeof item === "string") {
            const clean = item.trim();
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)
              ? { email: clean, name: "" }
              : null;
          }
          if (item && item.email) {
            const clean = item.email.trim();
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)
              ? { email: clean, name: item.name || "" }
              : null;
          }
          return null;
        })
        .filter(Boolean);
    }

    if (candidateList.length === 0) {
      return NextResponse.json(
        { error: "No valid email addresses found." },
        { status: 400 }
      );
    }

    // Determine the host URL
    const host =
      process.env.NEXT_PUBLIC_HOST_URL ||
      req.headers.get("origin") ||
      req.headers.get("host") ||
      "http://localhost:3000";
    const baseUrl = host.startsWith("http") ? host : `http://${host}`;
    const cleanBaseUrl = baseUrl.replace(/\/$/, "");
    const interviewUrl = `${cleanBaseUrl}/interview/${interview_id}`;

    const results = [];
    const previewUrls = [];

    for (const cand of candidateList) {
      try {
        const sendRes = await sendInterviewInviteEmail({
          candidateEmail: cand.email,
          candidateName: cand.name,
          jobPosition,
          jobDescription,
          duration,
          interviewUrl,
          customMessage,
          companyName,
        });

        results.push({
          email: cand.email,
          status: "sent",
          messageId: sendRes.messageId,
          isTest: sendRes.isTest,
        });

        if (sendRes.previewUrl) {
          previewUrls.push({
            email: cand.email,
            previewUrl: sendRes.previewUrl,
          });
        }
      } catch (err) {
        console.error(`Failed to send invite email to ${cand.email}:`, err);
        results.push({
          email: cand.email,
          status: "failed",
          error: err.message,
        });
      }
    }

    const sentCount = results.filter((r) => r.status === "sent").length;
    const failedCount = results.filter((r) => r.status === "failed").length;

    return NextResponse.json({
      success: sentCount > 0,
      sentCount,
      failedCount,
      totalCount: candidateList.length,
      results,
      previewUrls,
      interviewUrl,
    });
  } catch (err) {
    console.error("Error in /api/interview/send-invite:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process interview invites." },
      { status: 500 }
    );
  }
}

