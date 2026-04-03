import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface QuestDef {
  id: string;
  title: string;
  description: string;
  category: "trading" | "social" | "achievement";
  xpReward: number;
  target: number;
  metric: string;
}

const QUESTS: QuestDef[] = [
  { id: "first_trade", title: "First Blood", description: "Complete your first trade", category: "trading", xpReward: 100, target: 1, metric: "totalTrades" },
  { id: "trade_10", title: "Getting Started", description: "Complete 10 trades", category: "trading", xpReward: 300, target: 10, metric: "totalTrades" },
  { id: "trade_50", title: "Seasoned Trader", description: "Complete 50 trades", category: "trading", xpReward: 1000, target: 50, metric: "totalTrades" },
  { id: "profit_100", title: "First Hundred", description: "Earn $100 in total profit", category: "trading", xpReward: 500, target: 100, metric: "totalProfit" },
  { id: "profit_1000", title: "Thousandaire", description: "Earn $1,000 in total profit", category: "trading", xpReward: 2000, target: 1000, metric: "totalProfit" },
  { id: "win_streak_3", title: "Hat Trick", description: "Win 3 trades in a row", category: "achievement", xpReward: 300, target: 3, metric: "winStreak" },
  { id: "win_streak_5", title: "On Fire", description: "Win 5 trades in a row", category: "achievement", xpReward: 700, target: 5, metric: "winStreak" },
  { id: "refer_1", title: "Networker", description: "Refer your first friend", category: "social", xpReward: 200, target: 1, metric: "referrals" },
  { id: "refer_5", title: "Ambassador", description: "Refer 5 friends", category: "social", xpReward: 1000, target: 5, metric: "referrals" },
  { id: "sentiment_ace", title: "Sentiment Ace", description: "Achieve 70%+ sentiment accuracy over 10+ trades", category: "achievement", xpReward: 800, target: 70, metric: "sentimentAccuracy" },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json({ error: "wallet parameter required" }, { status: 400 });
    }

    const [trades, referralCount] = await Promise.all([
      prisma.trade.findMany({
        where: { walletAddress: wallet },
        orderBy: { closedAt: "asc" },
        select: { pnlUsdc: true, sentimentAligned: true },
      }),
      prisma.referral.count({ where: { referrerWallet: wallet } }),
    ]);

    const totalTrades = trades.length;
    const totalProfit = trades.reduce((sum, t) => sum + Math.max(0, t.pnlUsdc), 0);

    let winStreak = 0;
    let maxStreak = 0;
    for (const t of trades) {
      if (t.pnlUsdc > 0) {
        winStreak++;
        maxStreak = Math.max(maxStreak, winStreak);
      } else {
        winStreak = 0;
      }
    }

    const alignedTrades = trades.filter((t) => t.sentimentAligned);
    const alignedWins = alignedTrades.filter((t) => t.pnlUsdc > 0).length;
    const sentimentAccuracy = alignedTrades.length >= 10
      ? Math.round((alignedWins / alignedTrades.length) * 100)
      : 0;

    const metrics: Record<string, number> = {
      totalTrades,
      totalProfit: Math.round(totalProfit * 100) / 100,
      winStreak: maxStreak,
      referrals: referralCount,
      sentimentAccuracy,
    };

    const quests = QUESTS.map((q) => {
      const current = metrics[q.metric] ?? 0;
      const progress = Math.min(1, current / q.target);
      return {
        id: q.id,
        title: q.title,
        description: q.description,
        category: q.category,
        xpReward: q.xpReward,
        target: q.target,
        current: Math.min(current, q.target),
        progress: Math.round(progress * 100),
        completed: progress >= 1,
      };
    });

    return NextResponse.json({ quests });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch quests";
    if (
      message.includes("localhost") ||
      message.includes("5432") ||
      message.includes("ECONNREFUSED") ||
      message.includes("Can't reach") ||
      message.includes("connect")
    ) {
      const quests = QUESTS.map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        category: q.category,
        xpReward: q.xpReward,
        target: q.target,
        current: 0,
        progress: 0,
        completed: false,
      }));
      return NextResponse.json({ quests });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
