"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSentimentStore } from "@/stores/sentiment";
import type { SentimentSignal } from "@/types/elfa";
import type { TokenCardData } from "@/types/app";

function sentimentToScore(sentiment: "positive" | "negative" | "neutral"): number {
  switch (sentiment) {
    case "positive": return 75;
    case "negative": return 25;
    case "neutral": return 50;
  }
}

function signalToTokenCard(signal: SentimentSignal): TokenCardData {
  return {
    symbol: signal.symbol,
    name: signal.name,
    price: 0,
    priceChange24h: 0,
    sentiment: signal.sentiment,
    sentimentScore: sentimentToScore(signal.sentiment),
    mentionCount: signal.mentionCount,
    mentionChange: signal.mentionChange,
    velocity: signal.velocity,
    topMention: signal.topMentions[0]
      ? {
          content: signal.topMentions[0].content,
          author: signal.topMentions[0].author.username,
          engagement:
            signal.topMentions[0].engagement.like_count +
            signal.topMentions[0].engagement.retweet_count,
        }
      : undefined,
  };
}

export function useSentimentPolling(intervalMs: number = 60_000) {
  const { setSignals, setTokenCards, setLoading, setError } = useSentimentStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSentiment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/sentiment?timeWindow=24h&limit=20");
      if (!res.ok) throw new Error(`Sentiment fetch failed: ${res.status}`);

      const data = await res.json();
      const signals: SentimentSignal[] = data.signals.map(
        (s: SentimentSignal) => ({
          ...s,
          updatedAt: new Date(s.updatedAt),
        })
      );

      setSignals(signals);
      setTokenCards(signals.map(signalToTokenCard));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch sentiment");
    } finally {
      setLoading(false);
    }
  }, [setSignals, setTokenCards, setLoading, setError]);

  useEffect(() => {
    fetchSentiment();

    intervalRef.current = setInterval(fetchSentiment, intervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchSentiment, intervalMs]);

  return { refetch: fetchSentiment };
}
