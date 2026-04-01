import { NextResponse } from "next/server";
import {
  getTrendingTokens,
  getTopMentions,
  toSentimentSignals,
} from "@/lib/elfa";
import type { ElfaTopMentionsResponse } from "@/types/elfa";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeWindow = searchParams.get("timeWindow") || "24h";
    const limit = Number(searchParams.get("limit") || "20");

    const trending = await getTrendingTokens(timeWindow, 1, limit);

    const trendingTokens = trending.data?.data ?? [];
    const tokens = trendingTokens.slice(0, 10);
    const mentionsMap = new Map<string, ElfaTopMentionsResponse>();

    const mentionResults = await Promise.allSettled(
      tokens.map((t) => {
        const symbol = typeof t.token === "string" ? t.token.toUpperCase() : t.token.token_symbol;
        return getTopMentions(symbol, timeWindow, 1, 5);
      }),
    );

    tokens.forEach((t, i) => {
      const symbol = typeof t.token === "string" ? t.token.toUpperCase() : t.token.token_symbol;
      const result = mentionResults[i];
      if (result.status === "fulfilled") {
        mentionsMap.set(symbol, result.value);
      }
    });

    const signals = toSentimentSignals(trendingTokens, mentionsMap);

    return NextResponse.json({ signals, updatedAt: new Date().toISOString() });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch sentiment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
