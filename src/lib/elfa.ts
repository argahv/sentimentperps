// Elfa AI API Client
// Docs: https://go.elfa.ai/dev

import type {
  ElfaTrendingResponse,
  ElfaTopMentionsResponse,
  ElfaKeywordMentionsResponse,
  SentimentSignal,
  ElfaTrendingToken,
} from "@/types/elfa";

const ELFA_BASE_URL = "https://api.elfa.ai/v2";

function headers(): HeadersInit {
  const key = process.env.ELFA_API_KEY;
  if (!key) throw new Error("ELFA_API_KEY not configured");
  return {
    "x-elfa-api-key": key,
    "Content-Type": "application/json",
  };
}

export async function getTrendingTokens(
  timeWindow: string = "24h",
  page: number = 1,
  pageSize: number = 20,
  minMentions: number = 5,
): Promise<ElfaTrendingResponse> {
  const params = new URLSearchParams({
    timeWindow,
    page: String(page),
    pageSize: String(pageSize),
    minMentions: String(minMentions),
  });

  const res = await fetch(
    `${ELFA_BASE_URL}/aggregations/trending-tokens?${params}`,
    { headers: headers(), next: { revalidate: 60 } },
  );

  if (!res.ok) throw new Error(`Elfa trending failed: ${res.status}`);
  return res.json();
}

export async function getTopMentions(
  ticker: string,
  timeWindow: string = "24h",
  page: number = 1,
  pageSize: number = 10,
): Promise<ElfaTopMentionsResponse> {
  const params = new URLSearchParams({
    ticker,
    timeWindow,
    page: String(page),
    pageSize: String(pageSize),
  });

  const res = await fetch(`${ELFA_BASE_URL}/data/top-mentions?${params}`, {
    headers: headers(),
    next: { revalidate: 120 },
  });

  if (!res.ok) throw new Error(`Elfa top mentions failed: ${res.status}`);
  return res.json();
}

export async function getKeywordMentions(
  keywords: string[],
  from?: number,
  to?: number,
  limit: number = 20,
  cursor?: string,
): Promise<ElfaKeywordMentionsResponse> {
  const params = new URLSearchParams({
    keywords: keywords.join(","),
    limit: String(limit),
  });
  if (from) params.set("from", String(from));
  if (to) params.set("to", String(to));
  if (cursor) params.set("cursor", cursor);

  const res = await fetch(`${ELFA_BASE_URL}/data/keyword-mentions?${params}`, {
    headers: headers(),
  });

  if (!res.ok) throw new Error(`Elfa keyword mentions failed: ${res.status}`);
  return res.json();
}

export function toSentimentSignals(
  trending: ElfaTrendingToken[],
  mentionsMap: Map<string, ElfaTopMentionsResponse>,
): SentimentSignal[] {
  return trending
    .map((t) => {
      const tokenData = typeof t.token === "string" ? { token_symbol: t.token.toUpperCase(), token_name: t.token.toUpperCase() } : t.token;
      const symbol = tokenData.token_symbol;
      const mentions = mentionsMap.get(symbol);
      const topMentions = (mentions?.data?.mentions ?? []).slice(0, 5);

      const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
      for (const m of topMentions) {
        if (m.sentiment) sentimentCounts[m.sentiment]++;
      }
      const dominantSentiment =
        sentimentCounts.positive >= sentimentCounts.negative
          ? sentimentCounts.positive > 0
            ? "positive"
            : "neutral"
          : "negative";

      return {
        symbol,
        name: tokenData.token_name,
        sentiment: dominantSentiment as "positive" | "negative" | "neutral",
        mentionCount: t.current_count,
        mentionChange: t.change_percent,
        velocity: t.current_count / 1440,
        topMentions,
        updatedAt: new Date(),
      };
    })
    .filter((s) => Boolean(s.symbol));
}
