import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { roomName, participantName } = await req.json();

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return NextResponse.json(
        {
          error:
            "LiveKit credentials not configured. Please add LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_URL to your .env file.",
        },
        { status: 500 }
      );
    }

    if (!roomName) {
      return NextResponse.json(
        { error: "roomName is required." },
        { status: 400 }
      );
    }

    const identity = participantName
      ? `${participantName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Math.random().toString(36).slice(2, 6)}`
      : `candidate_${Math.random().toString(36).slice(2, 7)}`;

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name: participantName || "Candidate",
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      wsUrl,
      identity,
    });
  } catch (err) {
    console.error("LiveKit token generation error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate LiveKit token" },
      { status: 500 }
    );
  }
}

