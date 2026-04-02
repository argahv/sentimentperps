import { prisma } from "./prisma";
import type { BadgeType } from "@/types/app";

const LEVEL_THRESHOLDS = [0, 500, 1500, 3000, 6000, 10000, 20000, 50000];
const LEVEL_NAMES = ["Novice", "Apprentice", "Trader", "Analyst", "Strategist", "Expert", "Master", "Legend"];
const XP_PER_BADGE = 200;

interface TradeForEval {
  pnlUsdc: number;
  pnlPct: number;
  minutesAfterSignal: number;
  sentimentAligned: boolean;
  score: number;
}

export function computeLevel(xp: number): { level: number; name: string; xpForCurrent: number; xpForNext: number; progress: number } {
  let level = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i;
      break;
    }
  }
  const xpForCurrent = LEVEL_THRESHOLDS[level];
  const xpForNext = LEVEL_THRESHOLDS[level + 1] ?? LEVEL_THRESHOLDS[level] * 2;
  const range = xpForNext - xpForCurrent;
  const progress = range > 0 ? Math.min(1, (xp - xpForCurrent) / range) : 1;

  return {
    level,
    name: LEVEL_NAMES[level] ?? "Legend",
    xpForCurrent,
    xpForNext,
    progress,
  };
}

export function computeXpForTrade(score: number): number {
  return Math.max(0, Math.round(score * 100));
}

function getConsecutiveWinStreak(trades: Pick<TradeForEval, "pnlUsdc">[]): number {
  let streak = 0;
  for (let i = trades.length - 1; i >= 0; i--) {
    if (trades[i].pnlUsdc > 0) streak++;
    else break;
  }
  return streak;
}

export async function evaluateBadges(walletAddress: string): Promise<BadgeType[]> {
  const trades = await prisma.trade.findMany({
    where: { walletAddress },
    orderBy: { closedAt: "asc" },
    select: {
      pnlUsdc: true,
      pnlPct: true,
      minutesAfterSignal: true,
      sentimentAligned: true,
      score: true,
    },
  });

  if (trades.length === 0) return [];

  const newBadges: BadgeType[] = [];
  const totalTrades = trades.length;
  const latestTrade = trades[totalTrades - 1];

  if (totalTrades >= 1) {
    newBadges.push("first_mover");
  }

  if (latestTrade.minutesAfterSignal <= 1) {
    newBadges.push("speed_demon");
  }

  const hasWhaleHunter = trades.some((t) => t.pnlUsdc > 1000);
  if (hasWhaleHunter) {
    newBadges.push("whale_hunter");
  }

  const streak = getConsecutiveWinStreak(trades);
  if (streak >= 10) {
    newBadges.push("streak_10");
    newBadges.push("streak_5");
    newBadges.push("streak_3");
  } else if (streak >= 5) {
    newBadges.push("streak_5");
    newBadges.push("streak_3");
  } else if (streak >= 3) {
    newBadges.push("streak_3");
  }

  const alignedTrades = trades.filter((t) => t.sentimentAligned);
  if (alignedTrades.length >= 20) {
    const alignedWins = alignedTrades.filter((t) => t.pnlUsdc > 0).length;
    const winRate = alignedWins / alignedTrades.length;
    if (winRate >= 0.8) {
      newBadges.push("sentiment_guru");
    }
  }

  const hasContrarian = trades.some((t) => !t.sentimentAligned && t.pnlUsdc > 0);
  if (hasContrarian) {
    newBadges.push("contrarian");
  }

  return [...new Set(newBadges)];
}

export async function persistBadges(walletAddress: string, badges: BadgeType[]): Promise<number> {
  let newCount = 0;
  for (const badgeType of badges) {
    await prisma.badge.upsert({
      where: { walletAddress_badgeType: { walletAddress, badgeType } },
      update: {},
      create: { walletAddress, badgeType },
    });
    newCount++;
  }
  return newCount;
}

export async function updateUserProgress(walletAddress: string, tradeScore: number, newBadgeCount: number): Promise<void> {
  const tradeXp = computeXpForTrade(tradeScore);
  const badgeXp = newBadgeCount * XP_PER_BADGE;
  const totalXpGain = tradeXp + badgeXp;

  if (totalXpGain <= 0) return;

  const existing = await prisma.userProgress.findUnique({
    where: { walletAddress },
  });

  const newXp = (existing?.xp ?? 0) + totalXpGain;
  const { level } = computeLevel(newXp);

  await prisma.userProgress.upsert({
    where: { walletAddress },
    update: { xp: newXp, level },
    create: { walletAddress, xp: newXp, level },
  });
}

export async function evaluateAndPersist(walletAddress: string, tradeScore: number): Promise<{ badges: BadgeType[]; xpGained: number }> {
  const existingBadges = await prisma.badge.findMany({
    where: { walletAddress },
    select: { badgeType: true },
  });
  const existingSet = new Set(existingBadges.map((b) => b.badgeType));

  const allEarned = await evaluateBadges(walletAddress);
  const newBadges = allEarned.filter((b) => !existingSet.has(b));

  await persistBadges(walletAddress, newBadges);
  await updateUserProgress(walletAddress, tradeScore, newBadges.length);

  const tradeXp = computeXpForTrade(tradeScore);
  const badgeXp = newBadges.length * XP_PER_BADGE;

  return { badges: newBadges, xpGained: tradeXp + badgeXp };
}
