"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, ArrowUpRight } from "lucide-react";
import type { ElfaNarrative } from "@/types/elfa";

function NarrativeSkeleton() {
  return (
    <div className="flat-card rounded-md p-3 flex flex-col gap-2 animate-pulse">
      <div className="h-3.5 w-3/4 rounded bg-surface-elevated" />
      <div className="h-2.5 w-full rounded bg-surface-elevated" />
      <div className="h-2.5 w-5/6 rounded bg-surface-elevated" />
      <div className="flex gap-1.5 mt-1">
        <div className="h-4 w-8 rounded bg-surface-elevated" />
        <div className="h-4 w-8 rounded bg-surface-elevated" />
      </div>
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 flex-1 rounded-full bg-surface-elevated overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-[10px] text-muted-foreground tabular-nums w-7 text-right">
        {pct}%
      </span>
    </div>
  );
}

function NarrativeCard({ narrative, index }: { narrative: ElfaNarrative; index: number }) {
  const borderColor =
    narrative.sentiment === "positive"
      ? "border-l-success"
      : narrative.sentiment === "negative"
      ? "border-l-danger"
      : "border-l-warning";

  const ledClass =
    narrative.sentiment === "positive"
      ? "led-green"
      : narrative.sentiment === "negative"
      ? "led-red"
      : "led-yellow";

  const sentimentColor =
    narrative.sentiment === "positive"
      ? "text-success"
      : narrative.sentiment === "negative"
      ? "text-danger"
      : "text-warning";

  return (
    <div
      className={`flat-card rounded-md p-3 border-l-2 ${borderColor} flex flex-col gap-2 card-entrance`}
      style={{ animationDelay: `calc(${index} * var(--stagger-base))` }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold leading-snug text-foreground line-clamp-1">
          {narrative.title}
        </p>
        <span className={`${ledClass} shrink-0 mt-0.5`} />
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
        {narrative.summary}
      </p>

      <ConfidenceBar value={narrative.confidence} />

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {narrative.tokens.slice(0, 4).map((token) => (
            <Link
              key={token}
              href={`/trade?symbol=${token}`}
              className="inline-flex items-center gap-0.5 rounded bg-surface-elevated px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors duration-150"
            >
              {token}
              <ArrowUpRight className="h-2.5 w-2.5" />
            </Link>
          ))}
        </div>
        <span className={`font-mono text-[10px] uppercase tracking-wide font-semibold ${sentimentColor}`}>
          {narrative.sentiment}
        </span>
      </div>

      <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
        <span>{narrative.mention_count.toLocaleString()} mentions</span>
        <span className="text-border-bright">·</span>
        <span>{narrative.source_count} sources</span>
      </div>
    </div>
  );
}

export function TrendingNarratives() {
  const [narratives, setNarratives] = useState<ElfaNarrative[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const load = () => {
    setIsLoading(true);
    setIsError(false);
    fetch("/api/narratives")
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json() as Promise<{ narratives: ElfaNarrative[] }>;
      })
      .then((data) => {
        setNarratives(data.narratives.slice(0, 4));
        setIsLoading(false);
      })
      .catch(() => {
        setIsError(true);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="swiss-card rounded-lg p-4 industrial-screws flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="swiss-icon-well flex h-7 w-7 items-center justify-center">
            <TrendingUp className="h-3.5 w-3.5 text-success" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-foreground">
              Trending Narratives
            </h2>
            <p className="text-[10px] text-muted-foreground">Powered by Elfa AI</p>
          </div>
        </div>
        <span className="led-green" />
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <NarrativeSkeleton />
          <NarrativeSkeleton />
          <NarrativeSkeleton />
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 py-4">
          <p className="text-xs text-muted-foreground">Failed to load narratives</p>
          <button
            onClick={load}
            className="swiss-btn-outline px-3 py-1.5 text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="flex flex-col gap-2">
          {narratives.map((narrative, i) => (
            <NarrativeCard key={narrative.title} narrative={narrative} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
