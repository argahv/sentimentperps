import { create } from "zustand";
import type { PacificaPosition, PacificaOrder } from "@/types/pacifica";

interface PositionsState {
  positions: PacificaPosition[];
  closedPositions: PacificaPosition[];
  openOrders: PacificaOrder[];
  isLoading: boolean;
  error: string | null;

  setPositions: (positions: PacificaPosition[]) => void;
  setClosedPositions: (positions: PacificaPosition[]) => void;
  addClosedPosition: (position: PacificaPosition) => void;
  setOpenOrders: (orders: PacificaOrder[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  getTotalUnrealizedPnl: () => number;
  getPositionByMarket: (marketId: string) => PacificaPosition | undefined;
}

export const usePositionsStore = create<PositionsState>((set, get) => ({
  positions: [],
  closedPositions: [],
  openOrders: [],
  isLoading: false,
  error: null,

  setPositions: (positions) => set({ positions }),
  setClosedPositions: (positions) => set({ closedPositions: positions }),
  addClosedPosition: (position) => set((state) => ({ closedPositions: [...state.closedPositions, position] })),
  setOpenOrders: (orders) => set({ openOrders: orders }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  getTotalUnrealizedPnl: () =>
    get().positions.reduce((sum, p) => sum + p.unrealized_pnl, 0),

  getPositionByMarket: (marketId) =>
    get().positions.find((p) => p.symbol === marketId),
}));
