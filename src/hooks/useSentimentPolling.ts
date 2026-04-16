"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSentimentStore } from "@/stores/sentiment";
import { pushVelocity } from "@/stores/velocityHistory";
import type { SentimentSignal } from "@/types/elfa";
import type { TokenCardData } from "@/types/app";

// Module-level singleton: only one polling loop runs at a time.
// When multiple components mount useSentimentPolling (e.g. layout + page),
// the second instance skips starting its own interval if one is already active.
let _activeInstances = 0;

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function computeSentimentScores(signals: SentimentSignal[]): Map<string, number> {
  const scores = new Map<string, number>();
  if (signals.length === 0) return scores;

  const maxVelocity = Math.max(...signals.map((s) => s.velocity), 0.001);
  const maxMentions = Math.max(...signals.map((s) => s.mentionCount), 1);

  for (const s of signals) {
    const sentimentBase = s.sentiment === "positive" ? 15 : s.sentiment === "negative" ? -15 : 0;
    const velocityPts = (s.velocity / maxVelocity) * 40;
    const momentumPts = clamp(s.mentionChange, -100, 100) / 100 * 30;
    const volumePts = (s.mentionCount / maxMentions) * 30;

    const raw = 50 + sentimentBase + velocityPts + momentumPts + volumePts;
    scores.set(s.symbol, Math.round(clamp(raw, 5, 95)));
  }

  return scores;
}

function signalsToTokenCards(signals: SentimentSignal[]): TokenCardData[] {
  const scores = computeSentimentScores(signals);

  return signals.map((signal) => ({
    symbol: signal.symbol,
    name: signal.name,
    price: 0,
    priceChange24h: 0,
    sentiment: signal.sentiment,
    sentimentScore: scores.get(signal.symbol) ?? 50,
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
  }));
}

export function useSentimentPolling(intervalMs: number = 180_000) {
  const hasFetchedRef = useRef(false);
  const setSignals = useSentimentStore((s) => s.setSignals);
  const setTokenCards = useSentimentStore((s) => s.setTokenCards);
  const setLoading = useSentimentStore((s) => s.setLoading);
  const setError = useSentimentStore((s) => s.setError);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isOwnerRef = useRef(false); // true if THIS instance owns the active interval

  const fetchSentiment = useCallback(async () => {
    try {
      // Skip initial loading indicator if data is already fresh (< 45 s old)
      const { lastUpdated } = useSentimentStore.getState();
      const dataFresh = lastUpdated && Date.now() - lastUpdated.getTime() < 45_000;

      if (!hasFetchedRef.current && !dataFresh) {
        setLoading(true);
      }
      setError(null);

      // If store already has fresh data, skip the fetch entirely (stale guard)
      if (dataFresh && hasFetchedRef.current) return;

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
      setTokenCards(signalsToTokenCards(signals));

      for (const signal of signals) {
        pushVelocity(signal.symbol, signal.velocity);
      }

      hasFetchedRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch sentiment");
    } finally {
      setLoading(false);
    }
  }, [setSignals, setTokenCards, setLoading, setError]);

  useEffect(() => {
    _activeInstances++;
    isOwnerRef.current = _activeInstances === 1; // only first mount owns the interval

    // Always do an initial fetch (will skip if data is fresh)
    fetchSentiment();

    if (isOwnerRef.current) {
      intervalRef.current = setInterval(fetchSentiment, intervalMs);
    }

    return () => {
      _activeInstances = Math.max(0, _activeInstances - 1);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isOwnerRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchSentiment, intervalMs]);

  return { refetch: fetchSentiment };
}
