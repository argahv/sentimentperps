import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/dashboard/recent-wins — recent profitable sentiment-aligned trades */
export async function GET() {
  try {
    const recentWins = await prisma.trade.findMany({
      where: {
        sentimentAligned: true,
        pnlUsdc: { gt: 0 },
      },
      orderBy: { closedAt: "desc" },
      take: 10,
      select: {
        id: true,
        symbol: true,
        direction: true,
        leverage: true,
        pnlUsdc: true,
        pnlPct: true,
        sentimentScoreAtEntry: true,
        closedAt: true,
        walletAddress: true,
      },
    });

    const wins = recentWins.map((trade) => {
      const addr = trade.walletAddress;
      const displayWallet =
        addr.length > 10 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;

      return {
        id: trade.id,
        symbol: trade.symbol,
        direction: trade.direction,
        leverage: trade.leverage,
        pnlUsdc: Math.round(trade.pnlUsdc * 100) / 100,
        pnlPct: Math.round(trade.pnlPct * 100) / 100,
        sentimentScore: Math.round(trade.sentimentScoreAtEntry),
        closedAt: trade.closedAt.toISOString(),
        trader: displayWallet,
      };
    });

    return NextResponse.json({ wins });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch recent wins";
    console.error("[dashboard/recent-wins] GET error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
