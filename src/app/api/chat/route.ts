import { NextResponse } from "next/server";

const ELFA_CHAT_URL = "https://api.elfa.ai/v2/chat";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "message is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ELFA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ELFA_API_KEY not configured" },
        { status: 500 }
      );
    }

    const elfaResponse = await fetch(ELFA_CHAT_URL, {
      method: "POST",
      headers: {
        "x-elfa-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: message.trim() }),
    });

    if (!elfaResponse.ok) {
      const errorText = await elfaResponse.text().catch(() => "Unknown error");
      return NextResponse.json(
        { error: `Elfa AI error: ${elfaResponse.status} — ${errorText}` },
        { status: elfaResponse.status }
      );
    }

    const data = await elfaResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process chat request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
