import { create } from "zustand";
import type { SentimentSignal } from "@/types/elfa";
import type { TokenCardData } from "@/types/app";

interface SentimentState {
  signals: SentimentSignal[];
  tokenCards: TokenCardData[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  setSignals: (signals: SentimentSignal[]) => void;
  setTokenCards: (cards: TokenCardData[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  getSignalBySymbol: (symbol: string) => SentimentSignal | undefined;
  getHotTokens: () => TokenCardData[];
}

export const useSentimentStore = create<SentimentState>((set, get) => ({
  signals: [],
  tokenCards: [],
  isLoading: false,
  error: null,
  lastUpdated: null,

  setSignals: (signals) => set({ signals, lastUpdated: new Date() }),
  setTokenCards: (cards) => set({ tokenCards: cards }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  getSignalBySymbol: (symbol) =>
    get().signals.find((s) => s.symbol === symbol),

  getHotTokens: () =>
    [...get().tokenCards].sort((a, b) => b.velocity - a.velocity).slice(0, 10),
}));
