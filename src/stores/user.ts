import { create } from "zustand";
import type { User, UserBadge, LeaderboardEntry } from "@/types/app";

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  badges: UserBadge[];
  leaderboardEntry: LeaderboardEntry | null;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  setAuthenticated: (auth: boolean) => void;
  setBadges: (badges: UserBadge[]) => void;
  setLeaderboardEntry: (entry: LeaderboardEntry | null) => void;
  setLoading: (loading: boolean) => void;

  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isAuthenticated: false,
  badges: [],
  leaderboardEntry: null,
  isLoading: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setAuthenticated: (auth) => set({ isAuthenticated: auth }),
  setBadges: (badges) => set({ badges }),
  setLeaderboardEntry: (entry) => set({ leaderboardEntry: entry }),
  setLoading: (loading) => set({ isLoading: loading }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      badges: [],
      leaderboardEntry: null,
    }),
}));
