import { NextResponse } from "next/server";
import {
  getTrendingTokens,
  getTopMentions,
  toSentimentSignals,
} from "@/lib/elfa";
import type { ElfaTopMentionsResponse, SentimentSignal } from "@/types/elfa";

const STALE_MS = 3 * 60 * 1000;
const MAX_TTL_MS = 10 * 60 * 1000;

interface CacheEntry {
  signals: SentimentSignal[];
  updatedAt: string;
  fetchedAt: number;
}

let cache: CacheEntry | null = null;
let refreshInProgress = false;

function isFresh(): boolean {
  return !!cache && Date.now() - cache.fetchedAt < STALE_MS;
}

function isExpired(): boolean {
  return !cache || Date.now() - cache.fetchedAt > MAX_TTL_MS;
}

async function fetchFromElfa(timeWindow: string): Promise<CacheEntry> {
  const trending = await getTrendingTokens(timeWindow, 1, 10);

  const trendingTokens = trending.data?.data ?? [];
  const mentionsMap = new Map<string, ElfaTopMentionsResponse>();

  const mentionResults = await Promise.allSettled(
    trendingTokens.map((t) => {
      const symbol =
        typeof t.token === "string"
          ? t.token.toUpperCase()
          : t.token.token_symbol;
      return getTopMentions(symbol, timeWindow, 1, 5);
    }),
  );

  trendingTokens.forEach((t, i) => {
    const symbol =
      typeof t.token === "string"
        ? t.token.toUpperCase()
        : t.token.token_symbol;
    const result = mentionResults[i];
    if (result.status === "fulfilled") {
      mentionsMap.set(symbol, result.value);
    }
  });

  const signals = toSentimentSignals(trendingTokens, mentionsMap);

  return {
    signals,
    updatedAt: new Date().toISOString(),
    fetchedAt: Date.now(),
  };
}

/** Single background refresh at a time — prevents ELFA call stampedes */
function triggerBackgroundRefresh(timeWindow: string): void {
  if (refreshInProgress) return;
  refreshInProgress = true;

  fetchFromElfa(timeWindow)
    .then((entry) => {
      cache = entry;
    })
    .catch(() => {})
    .finally(() => {
      refreshInProgress = false;
    });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeWindow = searchParams.get("timeWindow") || "24h";

    if (isFresh() && cache) {
      return NextResponse.json({
        signals: cache.signals,
        updatedAt: cache.updatedAt,
        cached: true,
      });
    }

    if (!isExpired() && cache) {
      triggerBackgroundRefresh(timeWindow);
      return NextResponse.json({
        signals: cache.signals,
        updatedAt: cache.updatedAt,
        cached: true,
      });
    }

    const entry = await fetchFromElfa(timeWindow);
    cache = entry;

    return NextResponse.json({
      signals: entry.signals,
      updatedAt: entry.updatedAt,
      cached: false,
    });
  } catch (error) {
    if (cache) {
      return NextResponse.json({
        signals: cache.signals,
        updatedAt: cache.updatedAt,
        cached: true,
        stale: true,
      });
    }

    const message =
      error instanceof Error ? error.message : "Failed to fetch sentiment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
