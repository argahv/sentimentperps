import { create } from "zustand";

const MAX_HISTORY = 20;
const EMPTY: number[] = [];

interface VelocityHistoryState {
  history: Record<string, number[]>;
  pushVelocity: (symbol: string, velocity: number) => void;
  getHistory: (symbol: string) => number[];
}

export const useVelocityHistoryStore = create<VelocityHistoryState>((set, get) => ({
  history: {},

  pushVelocity: (symbol, velocity) => {
    const prev = get().history[symbol] ?? [];
    const next = [...prev, velocity].slice(-MAX_HISTORY);
    set((state) => ({
      history: { ...state.history, [symbol]: next },
    }));
  },

  getHistory: (symbol) => get().history[symbol] ?? EMPTY,
}));

export function pushVelocity(symbol: string, velocity: number) {
  useVelocityHistoryStore.getState().pushVelocity(symbol, velocity);
}

export function getHistory(symbol: string): number[] {
  return useVelocityHistoryStore.getState().getHistory(symbol);
}
