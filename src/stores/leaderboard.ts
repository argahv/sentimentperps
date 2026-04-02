import { create } from "zustand";
import type { LeaderboardEntry, LeaderboardPeriod, BadgeType } from "@/types/app";

interface LeaderboardState {
  entries: LeaderboardEntry[];
  period: LeaderboardPeriod;
  isLoading: boolean;
  error: string | null;

  setPeriod: (period: LeaderboardPeriod) => void;
  setEntries: (entries: LeaderboardEntry[]) => void;
  setLoading: (loading: boolean) => void;
  fetchLeaderboard: (period?: LeaderboardPeriod) => Promise<void>;
}

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

function getDemoBadges(userId: string): BadgeType[] {
  const rng = seededRandom(userId.charCodeAt(userId.length - 1) * 31);
  const count = Math.floor(rng() * 4);
  const shuffled = [...BADGE_POOL].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  entries: [],
  period: "daily",
  isLoading: false,
  error: null,

  setPeriod: (period) => {
    set({ period });
    get().fetchLeaderboard(period);
  },

  setEntries: (entries) => set({ entries }),
  setLoading: (loading) => set({ isLoading: loading }),

  fetchLeaderboard: async (period?: LeaderboardPeriod) => {
    const activePeriod = period ?? get().period;
    set({ isLoading: true, error: null });

    try {
      const res = await fetch(`/api/leaderboard?period=${activePeriod}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to fetch leaderboard");
      }

      const { entries } = await res.json();
      set({ entries: entries ?? [], isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch leaderboard";
      set({ error: message, isLoading: false });
    }
  },
}));

export { getDemoBadges };
