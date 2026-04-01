import { create } from "zustand";
import type { LeaderboardEntry, LeaderboardPeriod, BadgeType } from "@/types/app";

interface LeaderboardState {
  entries: LeaderboardEntry[];
  period: LeaderboardPeriod;
  isLoading: boolean;

  setPeriod: (period: LeaderboardPeriod) => void;
  setEntries: (entries: LeaderboardEntry[]) => void;
  setLoading: (loading: boolean) => void;
}

const DEMO_NAMES = [
  "solwhale.sol",
  "degentrader",
  "sigmabrain",
  "sentimentoor",
  "perpmaxi",
  "alphadev",
  "moonhunter",
  "rektproof",
  "volhunter",
  "deltaneutral",
  "chadwick.sol",
  "memecoinrich",
  "signalking",
  "trendfrend",
  "levermann",
];

const BADGE_POOL: BadgeType[] = [
  "first_mover",
  "contrarian",
  "streak_3",
  "streak_5",
  "whale_hunter",
  "sentiment_guru",
  "speed_demon",
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function generateDemoEntries(period: LeaderboardPeriod): LeaderboardEntry[] {
  const seed = period === "daily" ? 42 : period === "weekly" ? 137 : 999;
  const rng = seededRandom(seed);

  const count = period === "daily" ? 10 : period === "weekly" ? 12 : 15;
  const now = new Date();

  return Array.from({ length: count }, (_, i) => {
    const totalTrades = Math.floor(rng() * 80) + 5;
    const winRate = 0.35 + rng() * 0.5;
    const totalScore = Math.floor((1000 - i * 60) * (0.8 + rng() * 0.4));
    const bestCallPnl = Math.floor(rng() * 2000) + 50;

    return {
      id: `lb-${period}-${i}`,
      userId: `user-${i}`,
      username: DEMO_NAMES[i % DEMO_NAMES.length],
      period,
      rank: i + 1,
      totalScore: Math.max(totalScore, 10),
      winRate: Math.round(winRate * 100) / 100,
      totalTrades,
      bestCallPnl,
      updatedAt: now,
    };
  }).sort((a, b) => b.totalScore - a.totalScore)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

function getDemoBadges(userId: string): BadgeType[] {
  const rng = seededRandom(userId.charCodeAt(userId.length - 1) * 31);
  const count = Math.floor(rng() * 4);
  const shuffled = [...BADGE_POOL].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  entries: generateDemoEntries("daily"),
  period: "daily",
  isLoading: false,

  setPeriod: (period) =>
    set({
      period,
      entries: generateDemoEntries(period),
    }),

  setEntries: (entries) => set({ entries }),
  setLoading: (loading) => set({ isLoading: loading }),
}));

export { getDemoBadges };
