import { NextResponse } from "next/server";

const ELFA_CHAT_URL = "https://api.elfa.ai/v2/chat";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, sessionId, sentimentContext } = body;

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

    let enrichedMessage = message.trim();
    if (Array.isArray(sentimentContext) && sentimentContext.length > 0) {
      const snapshot = sentimentContext
        .map(
          (t: {
            symbol: string;
            sentiment: string;
            sentimentScore: number;
            mentionCount: number;
            mentionChange: number;
            velocity: number;
            priceChange24h: number;
          }) =>
            `${t.symbol}: sentiment=${t.sentiment} score=${t.sentimentScore} mentions=${t.mentionCount} change=${t.mentionChange.toFixed(1)}% velocity=${t.velocity.toFixed(2)}/min price24h=${t.priceChange24h >= 0 ? "+" : ""}${t.priceChange24h.toFixed(2)}%`
        )
        .join("\n");
      enrichedMessage = `[Live Sentiment Data]\n${snapshot}\n\n[User Question]\n${enrichedMessage}`;
    }

    const payload: Record<string, unknown> = {
      message: enrichedMessage,
      analysisType: "chat",
    };

    if (sessionId && typeof sessionId === "string") {
      payload.sessionId = sessionId;
    }

    const elfaResponse = await fetch(ELFA_CHAT_URL, {
      method: "POST",
      headers: {
        "x-elfa-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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
