"use client";

import { CheckCircle2, Clock, X, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { useSentimentTriggersStore, type SentimentTrigger } from "@/stores/sentimentTriggers";

function formatTimeRemaining(expiresAt: Date): string {
  const ms = expiresAt.getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function TriggerRow({ trigger }: { trigger: SentimentTrigger }) {
  const updateTriggerStatus = useSentimentTriggersStore((s) => s.updateTriggerStatus);

  const isActive = trigger.status === "active";
  const isTriggered = trigger.status === "triggered";
  const isDim = trigger.status === "cancelled" || trigger.status === "expired";

  return (
    <div
      className={`neu-extruded-sm flex flex-col gap-2 rounded-2xl bg-background p-3 transition-all duration-300 ${
        isDim ? "opacity-40" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="font-display text-sm font-bold">{trigger.symbol}</span>
          {trigger.direction === "long" ? (
            <TrendingUp className="h-3.5 w-3.5 text-success" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-danger" />
          )}
          <span
            className={`text-xs font-medium ${
              trigger.direction === "long" ? "text-success" : "text-danger"
            }`}
          >
            {trigger.direction.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isTriggered && (
            <span className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
              <CheckCircle2 className="h-3 w-3" />
              Triggered!
            </span>
          )}
          {isActive && (
            <button
              onClick={() => updateTriggerStatus(trigger.id, "cancelled")}
              className="neu-btn rounded-xl p-1 text-muted-foreground hover:text-danger transition-all duration-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          Sentiment{" "}
          <span className="font-medium text-foreground">
            {trigger.condition} {trigger.threshold}
          </span>
        </span>
        <span>·</span>
        <span>
          <span className="font-medium text-foreground">${trigger.size}</span> @ {trigger.leverage}x
        </span>
        {isActive && (
          <>
            <span>·</span>
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {formatTimeRemaining(trigger.expiresAt)}
            </span>
          </>
        )}
        {trigger.status === "expired" && <span className="text-warning">Expired</span>}
        {trigger.status === "cancelled" && <span>Cancelled</span>}
      </div>
    </div>
  );
}

export function ActiveTriggers() {
  const triggers = useSentimentTriggersStore((s) => s.triggers);

  const sorted = [...triggers].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="neu-extruded flex flex-col gap-3 rounded-[32px] bg-background p-4">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm font-semibold">Active Triggers</h3>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          No triggers set yet. Use the form above to create one.
        </p>
      </div>
    );
  }

  return (
    <div className="neu-extruded flex flex-col gap-3 rounded-[32px] bg-background p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm font-semibold">Triggers</h3>
        </div>
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
          {triggers.filter((t) => t.status === "active").length} active
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {sorted.map((trigger) => (
          <TriggerRow key={trigger.id} trigger={trigger} />
        ))}
      </div>
    </div>
  );
}
