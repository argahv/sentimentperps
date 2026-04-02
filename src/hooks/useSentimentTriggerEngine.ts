"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSentimentStore } from "@/stores/sentiment";
import { useNotificationStore } from "@/stores/notifications";
import { useSentimentTriggersStore } from "@/stores/sentimentTriggers";

const POLL_INTERVAL = 10_000;
const MAX_AUTO_TRADES_PER_HOUR = 5;
const COOLDOWN_MS = 60_000;

interface AutoTradeCallback {
  (params: { symbol: string; direction: "long" | "short"; size: number; leverage: number }): Promise<void>;
}

export function useSentimentTriggerEngine(options?: {
  autoExecute?: boolean;
  onAutoTrade?: AutoTradeCallback;
}) {
  const signals = useSentimentStore((s) => s.signals);
  const tokenCards = useSentimentStore((s) => s.tokenCards);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const { getActiveTriggers, updateTriggerStatus, cleanExpired } = useSentimentTriggersStore();

  const intervRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoTradeCountRef = useRef(0);
  const lastAutoTradeRef = useRef(0);
  const hourResetRef = useRef(Date.now());

  const resetHourlyCount = useCallback(() => {
    const now = Date.now();
    if (now - hourResetRef.current > 3600000) {
      autoTradeCountRef.current = 0;
      hourResetRef.current = now;
    }
  }, []);

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

        const shouldAutoExecute =
          options?.autoExecute &&
          options?.onAutoTrade &&
          autoTradeCountRef.current < MAX_AUTO_TRADES_PER_HOUR &&
          Date.now() - lastAutoTradeRef.current > COOLDOWN_MS;

        if (shouldAutoExecute && options?.onAutoTrade) {
          resetHourlyCount();
          autoTradeCountRef.current++;
          lastAutoTradeRef.current = Date.now();

          addNotification({
            type: "info",
            title: `Auto-Executing — ${trigger.symbol}`,
            message: `${trigger.direction.toUpperCase()} ${trigger.size} USDC @ ${trigger.leverage}x`,
            duration: 5000,
          });

          options.onAutoTrade({
            symbol: trigger.symbol,
            direction: trigger.direction,
            size: trigger.size,
            leverage: trigger.leverage,
          }).catch(() => {
            addNotification({
              type: "error",
              title: `Auto-Trade Failed — ${trigger.symbol}`,
              message: "Trade execution failed. Please try manually.",
              duration: 8000,
            });
          });
        } else {
          addNotification({
            type: "success",
            title: `Trigger Fired — ${trigger.symbol}`,
            message: `Sentiment ${trigger.condition} ${trigger.threshold}: ${trigger.direction.toUpperCase()} ${trigger.size} USDC @ ${trigger.leverage}x`,
            duration: 8000,
          });
        }
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

          const shouldAutoExecute =
            options?.autoExecute &&
            options?.onAutoTrade &&
            autoTradeCountRef.current < MAX_AUTO_TRADES_PER_HOUR &&
            Date.now() - lastAutoTradeRef.current > COOLDOWN_MS;

          if (shouldAutoExecute && options?.onAutoTrade) {
            resetHourlyCount();
            autoTradeCountRef.current++;
            lastAutoTradeRef.current = Date.now();

            addNotification({
              type: "info",
              title: `Auto-Executing — ${trigger.symbol}`,
              message: `${trigger.direction.toUpperCase()} ${trigger.size} USDC @ ${trigger.leverage}x`,
              duration: 5000,
            });

            options.onAutoTrade({
              symbol: trigger.symbol,
              direction: trigger.direction,
              size: trigger.size,
              leverage: trigger.leverage,
            }).catch(() => {
              addNotification({
                type: "error",
                title: `Auto-Trade Failed — ${trigger.symbol}`,
                message: "Trade execution failed. Please try manually.",
                duration: 8000,
              });
            });
          } else {
            addNotification({
              type: "success",
              title: `Trigger Fired — ${trigger.symbol}`,
              message: `Sentiment ${trigger.condition} ${trigger.threshold}: ${trigger.direction.toUpperCase()} ${trigger.size} USDC @ ${trigger.leverage}x`,
              duration: 8000,
            });
          }
        }
      }
    };
  }, [signals, tokenCards, getActiveTriggers, updateTriggerStatus, cleanExpired, addNotification, options, resetHourlyCount]);

  useEffect(() => {
    intervRef.current = setInterval(() => {
      checkTriggers.current();
    }, POLL_INTERVAL);

    return () => {
      if (intervRef.current) clearInterval(intervRef.current);
    };
  }, []);
}
