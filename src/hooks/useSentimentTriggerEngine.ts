"use client";

import { useEffect, useRef } from "react";
import { useSentimentStore } from "@/stores/sentiment";
import { useNotificationStore } from "@/stores/notifications";
import { useSentimentTriggersStore } from "@/stores/sentimentTriggers";

const POLL_INTERVAL = 10_000;

export function useSentimentTriggerEngine() {
  const signals = useSentimentStore((s) => s.signals);
  const tokenCards = useSentimentStore((s) => s.tokenCards);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const { getActiveTriggers, updateTriggerStatus, cleanExpired } = useSentimentTriggersStore();

  const intervRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkTriggers = useRef(() => {
    cleanExpired();

    const active = getActiveTriggers();
    if (!active.length) return;

    for (const trigger of active) {
      const signal = signals.find(
        (s) => s.symbol.toUpperCase() === trigger.symbol.toUpperCase()
      );
      const card = tokenCards.find(
        (c) => c.symbol.toUpperCase() === trigger.symbol.toUpperCase()
      );

      const sentimentScore = card?.sentimentScore ?? signal?.mentionCount ?? null;
      if (sentimentScore === null) continue;

      const fired =
        (trigger.condition === "above" && sentimentScore >= trigger.threshold) ||
        (trigger.condition === "below" && sentimentScore <= trigger.threshold);

      if (fired) {
        updateTriggerStatus(trigger.id, "triggered", new Date());
        addNotification({
          type: "success",
          title: `Trigger Fired — ${trigger.symbol}`,
          message: `Sentiment ${trigger.condition} ${trigger.threshold}: ${trigger.direction.toUpperCase()} ${trigger.size} USDC @ ${trigger.leverage}x`,
          duration: 8000,
        });
      }
    }
  });

  useEffect(() => {
    checkTriggers.current = () => {
      cleanExpired();

      const active = getActiveTriggers();
      if (!active.length) return;

      for (const trigger of active) {
        const signal = signals.find(
          (s) => s.symbol.toUpperCase() === trigger.symbol.toUpperCase()
        );
        const card = tokenCards.find(
          (c) => c.symbol.toUpperCase() === trigger.symbol.toUpperCase()
        );

        const sentimentScore = card?.sentimentScore ?? (signal ? signal.mentionCount : null);
        if (sentimentScore === null) continue;

        const fired =
          (trigger.condition === "above" && sentimentScore >= trigger.threshold) ||
          (trigger.condition === "below" && sentimentScore <= trigger.threshold);

        if (fired) {
          updateTriggerStatus(trigger.id, "triggered", new Date());
          addNotification({
            type: "success",
            title: `Trigger Fired — ${trigger.symbol}`,
            message: `Sentiment ${trigger.condition} ${trigger.threshold}: ${trigger.direction.toUpperCase()} ${trigger.size} USDC @ ${trigger.leverage}x`,
            duration: 8000,
          });
        }
      }
    };
  }, [signals, tokenCards, getActiveTriggers, updateTriggerStatus, cleanExpired, addNotification]);

  useEffect(() => {
    intervRef.current = setInterval(() => {
      checkTriggers.current();
    }, POLL_INTERVAL);

    return () => {
      if (intervRef.current) clearInterval(intervRef.current);
    };
  }, []);
}
