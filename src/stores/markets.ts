import { create } from "zustand";
import type { PacificaMarket } from "@/types/pacifica";

interface MarketsState {
  markets: PacificaMarket[];
  isLoading: boolean;

  setMarkets: (markets: PacificaMarket[]) => void;
  setLoading: (loading: boolean) => void;
  getMarketBySymbol: (symbol: string) => PacificaMarket | undefined;
  getMarketId: (symbol: string) => string | null;
}

export const useMarketsStore = create<MarketsState>((set, get) => ({
  markets: [],
  isLoading: false,

  setMarkets: (markets) => set({ markets }),
  setLoading: (loading) => set({ isLoading: loading }),

  getMarketBySymbol: (symbol) => {
    const upper = symbol.toUpperCase();
    return get().markets.find((m) => m.symbol.toUpperCase() === upper);
  },

  getMarketId: (symbol) => {
    const market = get().getMarketBySymbol(symbol);
    return market?.symbol ?? null;
  },
}));
