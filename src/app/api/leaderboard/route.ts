import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { LeaderboardPeriod } from "@/types/app";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") ?? "daily") as LeaderboardPeriod;

    const now = new Date();
    let dateFilter: Date | undefined;

    if (period === "daily") {
      dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "weekly") {
      const dayOfWeek = now.getDay();
      dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    }

    const whereClause = dateFilter ? { closedAt: { gte: dateFilter } } : {};

    const tradeAggregates = await prisma.trade.groupBy({
      by: ["walletAddress"],
      where: whereClause,
      _count: { id: true },
      _sum: { pnlUsdc: true, score: true },
      _avg: { minutesAfterSignal: true, pnlPct: true },
      _max: { pnlUsdc: true },
    });

    if (tradeAggregates.length === 0) {
      return NextResponse.json({ entries: [] });
    }

    const walletAddresses = tradeAggregates.map((a) => a.walletAddress);

    const [winCounts, sentimentWins, sentimentTotalCounts, allBadges] = await Promise.all([
      prisma.trade.groupBy({
        by: ["walletAddress"],
        where: {
          ...whereClause,
          walletAddress: { in: walletAddresses },
          pnlUsdc: { gt: 0 },
        },
        _count: { id: true },
      }),
      prisma.trade.groupBy({
        by: ["walletAddress"],
        where: {
          ...whereClause,
          walletAddress: { in: walletAddresses },
          sentimentAligned: true,
          pnlUsdc: { gt: 0 },
        },
        _count: { id: true },
      }),
      prisma.trade.groupBy({
        by: ["walletAddress"],
        where: {
          ...whereClause,
          walletAddress: { in: walletAddresses },
          sentimentAligned: true,
        },
        _count: { id: true },
      }),
      prisma.badge.findMany({
        where: { walletAddress: { in: walletAddresses } },
        select: { walletAddress: true, badgeType: true },
      }),
    ]);

    const winCountMap = new Map(winCounts.map((w) => [w.walletAddress, w._count.id]));
    const sentimentWinMap = new Map(sentimentWins.map((s) => [s.walletAddress, s._count.id]));
    const sentimentTotalMap = new Map(sentimentTotalCounts.map((s) => [s.walletAddress, s._count.id]));

    const badgesByWallet = new Map<string, string[]>();
    for (const b of allBadges) {
      const existing = badgesByWallet.get(b.walletAddress) ?? [];
      existing.push(b.badgeType);
      badgesByWallet.set(b.walletAddress, existing);
    }

    const entries = tradeAggregates
      .map((agg) => {
        const totalTrades = agg._count.id;
        const wins = winCountMap.get(agg.walletAddress) ?? 0;
        const winRate = totalTrades > 0 ? wins / totalTrades : 0;
        const totalScore = Math.round(agg._sum.score ?? 0);
        const bestCallPnl = Math.round(agg._max.pnlUsdc ?? 0);
        const avgResponseTime = Math.round((agg._avg.minutesAfterSignal ?? 0) * 10) / 10;

        const sentimentAlignedWins = sentimentWinMap.get(agg.walletAddress) ?? 0;
        const sentimentAlignedTotal = sentimentTotalMap.get(agg.walletAddress) ?? 0;
        const sentimentAccuracy =
          sentimentAlignedTotal > 0
            ? Math.round((sentimentAlignedWins / sentimentAlignedTotal) * 100 * 10) / 10
            : 0;

        // sentimentScore = avgPnlPct * (1 / avgResponseTime) * 3.5, clamped [0, 100]
        const avgPnlPct = agg._avg.pnlPct ?? 0;
        const rawSentimentScore =
          avgResponseTime > 0
            ? avgPnlPct * (1 / avgResponseTime)
            : 0;
        const sentimentScore = Math.min(100, Math.max(0, Math.round(rawSentimentScore * 3.5)));

        const addr = agg.walletAddress;
        const username =
          addr.length > 10
            ? `${addr.slice(0, 4)}...${addr.slice(-4)}`
            : addr;

        return {
          id: `lb-${period}-${agg.walletAddress}`,
          userId: agg.walletAddress,
          username,
          period,
          rank: 0,
          totalScore,
          winRate: Math.round(winRate * 100) / 100,
          totalTrades,
          bestCallPnl,
          updatedAt: new Date(),
          sentimentScore,
          avgResponseTime,
          sentimentAccuracy,
          badges: badgesByWallet.get(agg.walletAddress) ?? [],
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((entry, i) => ({
        ...entry,
        rank: i + 1,
      }));

    // Aggregate social proof stats (all-time, regardless of period filter)
    const allTimeAgg = await prisma.trade.aggregate({
      _count: { id: true },
      _sum: { pnlUsdc: true },
    });
    const uniqueTraders = await prisma.trade.groupBy({ by: ["walletAddress"] });

    const aggregates = {
      totalTraders: uniqueTraders.length,
      totalTradesAllTime: allTimeAgg._count.id,
      totalPnlUsdc: Math.round(allTimeAgg._sum.pnlUsdc ?? 0),
    };

    return NextResponse.json({ entries, aggregates });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch leaderboard";
    console.error("[leaderboard] GET error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
