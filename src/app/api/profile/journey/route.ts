import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json({ error: "wallet parameter required" }, { status: 400 });
    }

    const trades = await prisma.trade.findMany({
      where: { walletAddress: wallet },
      orderBy: { closedAt: "asc" },
      select: {
        pnlUsdc: true,
        pnlPct: true,
        symbol: true,
        direction: true,
        leverage: true,
        minutesAfterSignal: true,
        sentimentAligned: true,
        closedAt: true,
        createdAt: true,
      },
    });

    if (trades.length === 0) {
      return NextResponse.json({ journey: null });
    }

    const firstTrade = trades[0];
    const latestTrade = trades[trades.length - 1];

    let bestTrade = trades[0];
    let worstTrade = trades[0];
    let fastestSignal = trades[0];
    for (const t of trades) {
      if (t.pnlUsdc > bestTrade.pnlUsdc) bestTrade = t;
      if (t.pnlUsdc < worstTrade.pnlUsdc) worstTrade = t;
      if (t.minutesAfterSignal < fastestSignal.minutesAfterSignal) fastestSignal = t;
    }

    let currentStreak = 0;
    let longestStreak = 0;
    let streakStart: Date | null = null;
    let longestStreakStart: Date | null = null;
    let longestStreakEnd: Date | null = null;
    for (const t of trades) {
      if (t.pnlUsdc > 0) {
        if (currentStreak === 0) streakStart = t.closedAt;
        currentStreak++;
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
          longestStreakStart = streakStart;
          longestStreakEnd = t.closedAt;
        }
      } else {
        currentStreak = 0;
        streakStart = null;
      }
    }

    const sentimentAlignedCount = trades.filter((t) => t.sentimentAligned).length;
    const profitableTrades = trades.filter((t) => t.pnlUsdc > 0);
    const totalProfitFromWins = profitableTrades.reduce((s, t) => s + t.pnlUsdc, 0);

    const symbolCounts: Record<string, number> = {};
    for (const t of trades) {
      symbolCounts[t.symbol] = (symbolCounts[t.symbol] ?? 0) + 1;
    }
    const favoriteSymbol = Object.entries(symbolCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    const daysSinceFirst = Math.max(
      1,
      Math.round((latestTrade.closedAt.getTime() - firstTrade.createdAt.getTime()) / 86400000)
    );

    return NextResponse.json({
      journey: {
        firstTradeDate: firstTrade.createdAt.toISOString(),
        daysSinceFirst,
        totalTrades: trades.length,
        profitableTrades: profitableTrades.length,
        totalProfitFromWins: Math.round(totalProfitFromWins * 100) / 100,
        bestTrade: {
          symbol: bestTrade.symbol,
          direction: bestTrade.direction,
          pnlUsdc: Math.round(bestTrade.pnlUsdc * 100) / 100,
          pnlPct: Math.round(bestTrade.pnlPct * 100) / 100,
          leverage: bestTrade.leverage,
          date: bestTrade.closedAt.toISOString(),
        },
        worstTrade: {
          symbol: worstTrade.symbol,
          pnlUsdc: Math.round(worstTrade.pnlUsdc * 100) / 100,
          date: worstTrade.closedAt.toISOString(),
        },
        longestStreak,
        longestStreakPeriod: longestStreakStart && longestStreakEnd
          ? { start: longestStreakStart.toISOString(), end: longestStreakEnd.toISOString() }
          : null,
        currentStreak,
        fastestSignalResponse: Math.round(fastestSignal.minutesAfterSignal * 10) / 10,
        sentimentAlignedCount,
        sentimentAlignmentRate: trades.length > 0
          ? Math.round((sentimentAlignedCount / trades.length) * 100)
          : 0,
        favoriteSymbol,
        favoriteSymbolCount: favoriteSymbol ? symbolCounts[favoriteSymbol] : 0,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch journey";
    if (
      message.includes("localhost") ||
      message.includes("5432") ||
      message.includes("ECONNREFUSED") ||
      message.includes("Can't reach") ||
      message.includes("connect")
    ) {
      return NextResponse.json({ journey: null });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
