import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/dashboard/stats — platform-wide aggregate stats (no wallet filter) */
export async function GET() {
  try {
    const [
      platformAggregates,
      totalWins,
      sentimentAlignedWins,
      sentimentAlignedTotal,
      traderCount,
    ] = await Promise.all([
      prisma.trade.aggregate({
        _sum: { pnlUsdc: true },
        _count: { id: true },
        _avg: { pnlPct: true },
      }),
      prisma.trade.count({
        where: { pnlUsdc: { gt: 0 } },
      }),
      prisma.trade.count({
        where: { sentimentAligned: true, pnlUsdc: { gt: 0 } },
      }),
      prisma.trade.count({
        where: { sentimentAligned: true },
      }),
      prisma.trade.groupBy({
        by: ["walletAddress"],
        _count: { id: true },
      }),
    ]);

    const totalPnl = platformAggregates._sum.pnlUsdc ?? 0;
    const totalTrades = platformAggregates._count.id;
    const avgPnlPct = platformAggregates._avg.pnlPct ?? 0;
    const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;

    const sentimentAccuracy =
      sentimentAlignedTotal > 0
        ? (sentimentAlignedWins / sentimentAlignedTotal) * 100
        : 0;

    return NextResponse.json({
      totalPnl: Math.round(totalPnl * 100) / 100,
      totalTrades,
      totalWins,
      winRate: Math.round(winRate * 10) / 10,
      sentimentAccuracy: Math.round(sentimentAccuracy * 10) / 10,
      avgPnlPct: Math.round(avgPnlPct * 100) / 100,
      totalTraders: traderCount.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch dashboard stats";
    console.error("[dashboard/stats] GET error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
