import { NextResponse } from "next/server";
import { getTrendingTokens, getTopMentions, toSentimentSignals } from "@/lib/elfa";
import type { ElfaTopMentionsResponse } from "@/types/elfa";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeWindow = searchParams.get("timeWindow") || "24h";
    const limit = Number(searchParams.get("limit") || "20");

    const trending = await getTrendingTokens(timeWindow, 1, limit);

    const tokens = trending.data.slice(0, 10);
    const mentionsMap = new Map<string, ElfaTopMentionsResponse>();

    const mentionResults = await Promise.allSettled(
      tokens.map((t) => getTopMentions(t.token.token_symbol, timeWindow, 1, 5))
    );

    tokens.forEach((t, i) => {
      const result = mentionResults[i];
      if (result.status === "fulfilled") {
        mentionsMap.set(t.token.token_symbol, result.value);
      }
    });

    const signals = toSentimentSignals(trending.data, mentionsMap);

    return NextResponse.json({ signals, updatedAt: new Date().toISOString() });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch sentiment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
