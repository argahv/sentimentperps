import { create } from "zustand";
import type { LeaderboardEntry, LeaderboardPeriod } from "@/types/app";

interface LeaderboardAggregates {
  totalTraders: number;
  totalTradesAllTime: number;
  totalPnlUsdc: number;
}

interface LeaderboardState {
  entries: LeaderboardEntry[];
  period: LeaderboardPeriod;
  isLoading: boolean;
  error: string | null;
  aggregates: LeaderboardAggregates;

  setPeriod: (period: LeaderboardPeriod) => void;
  setEntries: (entries: LeaderboardEntry[]) => void;
  setLoading: (loading: boolean) => void;
  fetchLeaderboard: (period?: LeaderboardPeriod) => Promise<void>;
}

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  entries: [],
  period: "daily",
  isLoading: false,
  error: null,
  aggregates: { totalTraders: 0, totalTradesAllTime: 0, totalPnlUsdc: 0 },

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

      const { entries, aggregates } = await res.json();
      set({
        entries: entries ?? [],
        aggregates: aggregates ?? get().aggregates,
        isLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch leaderboard";
      set({ error: message, isLoading: false });
    }
  },
}));
