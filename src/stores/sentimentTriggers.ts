import { create } from "zustand";

export interface SentimentTrigger {
  id: string;
  symbol: string;
  condition: "above" | "below";
  threshold: number;
  direction: "long" | "short";
  size: number;
  leverage: number;
  status: "active" | "triggered" | "expired" | "cancelled";
  createdAt: Date;
  triggeredAt?: Date;
  expiresAt: Date;
}

interface SentimentTriggersState {
  triggers: SentimentTrigger[];
  addTrigger: (trigger: Omit<SentimentTrigger, "id" | "createdAt" | "expiresAt" | "status">) => void;
  removeTrigger: (id: string) => void;
  updateTriggerStatus: (id: string, status: SentimentTrigger["status"], triggeredAt?: Date) => void;
  getActiveTriggers: () => SentimentTrigger[];
  cleanExpired: () => void;
}

let triggerCounter = 0;

export const useSentimentTriggersStore = create<SentimentTriggersState>((set, get) => ({
  triggers: [],

  addTrigger: (trigger) => {
    const id = `trigger_${++triggerCounter}_${Date.now()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    set((state) => ({
      triggers: [
        ...state.triggers,
        { ...trigger, id, status: "active", createdAt: now, expiresAt },
      ],
    }));
  },

  removeTrigger: (id) =>
    set((state) => ({
      triggers: state.triggers.filter((t) => t.id !== id),
    })),

  updateTriggerStatus: (id, status, triggeredAt) =>
    set((state) => ({
      triggers: state.triggers.map((t) =>
        t.id === id ? { ...t, status, ...(triggeredAt ? { triggeredAt } : {}) } : t
      ),
    })),

  getActiveTriggers: () =>
    get().triggers.filter((t) => t.status === "active"),

  cleanExpired: () => {
    const now = new Date();
    set((state) => ({
      triggers: state.triggers.map((t) =>
        t.status === "active" && t.expiresAt <= now ? { ...t, status: "expired" } : t
      ),
    }));
  },
}));
