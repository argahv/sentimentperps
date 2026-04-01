import { create } from "zustand";
import type { PacificaPosition, PacificaOrder } from "@/types/pacifica";

interface PositionsState {
  positions: PacificaPosition[];
  openOrders: PacificaOrder[];
  isLoading: boolean;
  error: string | null;

  setPositions: (positions: PacificaPosition[]) => void;
  setOpenOrders: (orders: PacificaOrder[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  getTotalUnrealizedPnl: () => number;
  getPositionByMarket: (marketId: string) => PacificaPosition | undefined;
}

export const usePositionsStore = create<PositionsState>((set, get) => ({
  positions: [],
  openOrders: [],
  isLoading: false,
  error: null,

  setPositions: (positions) => set({ positions }),
  setOpenOrders: (orders) => set({ openOrders: orders }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  getTotalUnrealizedPnl: () =>
    get().positions.reduce((sum, p) => sum + p.unrealized_pnl, 0),

  getPositionByMarket: (marketId) =>
    get().positions.find((p) => p.market_id === marketId),
}));
