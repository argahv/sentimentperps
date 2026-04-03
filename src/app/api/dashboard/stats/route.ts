import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { SentimentSignal } from "@/types/elfa";

const COINGECKO_TOKEN_MAP: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  DOGE: "dogecoin",
  ARB: "arbitrum",
  AVAX: "avalanche-2",
  MATIC: "matic-network",
  LINK: "chainlink",
  UNI: "uniswap",
  AAVE: "aave",
};

interface PriceData {
  usd: number;
  usd_24h_change: number | null;
}

async function fetchSentimentSignals(): Promise<SentimentSignal[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/sentiment?timeWindow=24h`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.signals ?? [];
  } catch {
    return [];
  }
}

async function fetchPriceChanges(): Promise<
  Record<string, PriceData>
> {
  try {
    const ids = Object.values(COINGECKO_TOKEN_MAP).join(",");
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      { next: { revalidate: 300 }, headers: { Accept: "application/json" } },
    );
    if (!res.ok) return {};
    return (await res.json()) as Record<string, PriceData>;
  } catch {
    return {};
  }
}

function computeSignalAccuracy(
  signals: SentimentSignal[],
  prices: Record<string, PriceData>,
): { accuracy: number; total: number; correct: number } {
  let correct = 0;
  let total = 0;

  for (const signal of signals) {
    const geckoId = COINGECKO_TOKEN_MAP[signal.symbol];
    if (!geckoId) continue;

    const priceData = prices[geckoId];
    if (!priceData || priceData.usd_24h_change === null) continue;

    const priceDirection = priceData.usd_24h_change >= 0 ? "positive" : "negative";
    const sentimentDirection = signal.sentiment;

    if (sentimentDirection === "neutral") continue;

    total++;
    if (sentimentDirection === priceDirection) correct++;
  }

  const accuracy = total > 0 ? (correct / total) * 100 : 0;
  return { accuracy, total, correct };
}

async function fetchDbStats() {
  try {
    const [aggregates, totalWins, sentimentAlignedWins, sentimentAlignedTotal, traderGroups] =
      await Promise.all([
        prisma.trade.aggregate({
          _sum: { pnlUsdc: true },
          _count: { id: true },
          _avg: { pnlPct: true },
        }),
        prisma.trade.count({ where: { pnlUsdc: { gt: 0 } } }),
        prisma.trade.count({ where: { sentimentAligned: true, pnlUsdc: { gt: 0 } } }),
        prisma.trade.count({ where: { sentimentAligned: true } }),
        prisma.trade.groupBy({ by: ["walletAddress"], _count: { id: true } }),
      ]);

    const totalTrades = aggregates._count.id;

    if (totalTrades === 0) return null;

    return {
      totalPnl: aggregates._sum.pnlUsdc ?? 0,
      totalTrades,
      totalWins,
      winRate: totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0,
      avgPnlPct: aggregates._avg.pnlPct ?? 0,
      totalTraders: traderGroups.length,
      dbSentimentAccuracy:
        sentimentAlignedTotal > 0
          ? (sentimentAlignedWins / sentimentAlignedTotal) * 100
          : null,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const [dbStats, signals, prices] = await Promise.all([
      fetchDbStats(),
      fetchSentimentSignals(),
      fetchPriceChanges(),
    ]);

    const liveAccuracy = computeSignalAccuracy(signals, prices);

    if (dbStats) {
      const sentimentAccuracy = dbStats.dbSentimentAccuracy ?? liveAccuracy.accuracy;

      return NextResponse.json({
        totalPnl: Math.round(dbStats.totalPnl * 100) / 100,
        totalTrades: dbStats.totalTrades,
        totalWins: dbStats.totalWins,
        winRate: Math.round(dbStats.winRate * 10) / 10,
        sentimentAccuracy: Math.round(sentimentAccuracy * 10) / 10,
        avgPnlPct: Math.round(dbStats.avgPnlPct * 100) / 100,
        totalTraders: dbStats.totalTraders,
        source: "database",
      });
    }

    return NextResponse.json({
      totalPnl: 0,
      totalTrades: 0,
      totalWins: 0,
      winRate: 0,
      sentimentAccuracy: Math.round(liveAccuracy.accuracy * 10) / 10,
      avgPnlPct: 0,
      totalTraders: 0,
      signalsCounted: liveAccuracy.total,
      signalsCorrect: liveAccuracy.correct,
      source: "live",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch dashboard stats";
    console.error("[dashboard/stats] GET error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
