import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json(
        { error: "Missing required parameter: wallet" },
        { status: 400 }
      );
    }

    const [aggregates, winCount, tradeCount] = await Promise.all([
      prisma.trade.aggregate({
        where: { walletAddress: wallet },
        _sum: { pnlUsdc: true, score: true },
        _avg: { pnlPct: true, minutesAfterSignal: true },
        _max: { pnlUsdc: true },
        _count: { id: true },
      }),
      prisma.trade.count({
        where: { walletAddress: wallet, pnlUsdc: { gt: 0 } },
      }),
      prisma.trade.count({
        where: { walletAddress: wallet, sentimentAligned: true, pnlUsdc: { gt: 0 } },
      }),
    ]);

    const totalTrades = aggregates._count.id;
    const winRate = totalTrades > 0 ? winCount / totalTrades : 0;
    const totalPnl = aggregates._sum.pnlUsdc ?? 0;
    const bestTrade = aggregates._max.pnlUsdc ?? 0;
    const totalScore = Math.round(aggregates._sum.score ?? 0);
    const avgResponseTime = Math.round((aggregates._avg.minutesAfterSignal ?? 0) * 10) / 10;

    const sentimentAlignedTotal = await prisma.trade.count({
      where: { walletAddress: wallet, sentimentAligned: true },
    });

    const sentimentAccuracy =
      sentimentAlignedTotal > 0
        ? Math.round((tradeCount / sentimentAlignedTotal) * 100 * 10) / 10
        : 0;

    const allTraders = await prisma.trade.groupBy({
      by: ["walletAddress"],
      _sum: { score: true },
    });

    const sortedTraders = allTraders
      .map((t) => ({ wallet: t.walletAddress, score: Math.round(t._sum.score ?? 0) }))
      .sort((a, b) => b.score - a.score);

    const rankEntry = sortedTraders.findIndex((t) => t.wallet === wallet);
    const rank = rankEntry >= 0 ? rankEntry + 1 : null;
    const totalTraders = sortedTraders.length;

    return NextResponse.json({
      stats: {
        totalTrades,
        winRate: Math.round(winRate * 100),
        totalPnl: Math.round(totalPnl * 100) / 100,
        bestTrade: Math.round(bestTrade * 100) / 100,
        totalScore,
        avgResponseTime,
        sentimentAccuracy,
        rank,
        totalTraders,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch profile stats";
    console.error("[profile/stats] GET error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
