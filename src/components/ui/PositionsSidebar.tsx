"use client";

import { useState } from "react";
import { usePositionsStore } from "@/stores/positions";
import { ArrowUpRight, ArrowDownRight, Wallet, X, Loader2 } from "lucide-react";
import type { TradeDirection } from "@/types/app";

function formatPnl(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

interface PositionsSidebarProps {
  onClosePosition?: (
    marketId: string,
    side: TradeDirection,
    size: number,
    positionMeta?: { entryPrice: number; markPrice: number; leverage: number; pnlUsdc: number }
  ) => Promise<void>;
}

export function PositionsSidebar({ onClosePosition }: PositionsSidebarProps) {
  const { positions, closedPositions, isLoading } = usePositionsStore();
  const totalPnl = usePositionsStore((s) => s.getTotalUnrealizedPnl());
  const [closingId, setClosingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open');

  const handleClose = async (positionId: string, marketId: string, side: "long" | "short", size: number) => {
    if (!onClosePosition) return;
    setClosingId(positionId);
    try {
      const pos = positions.find((p) => p.position_id === positionId);
      const meta = pos
        ? { entryPrice: pos.entry_price, markPrice: pos.mark_price, leverage: pos.leverage, pnlUsdc: pos.unrealized_pnl }
        : undefined;
      await onClosePosition(marketId, side, size, meta);
    } finally {
      setClosingId(null);
    }
  };

  return (
    <div className="swiss-card rounded-lg industrial-screws flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="swiss-icon-well flex h-8 w-8 items-center justify-center">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-sm font-bold font-display uppercase tracking-widest">Positions</h2>
        </div>
        {activeTab === 'open' && positions.length > 0 && (
          <span
            className={`tabular-nums text-sm font-semibold ${
              totalPnl >= 0 ? "text-success" : "text-danger"
            }`}
          >
            {formatPnl(totalPnl)}
          </span>
        )}
      </div>

      <div className="border border-border-muted flex p-1 w-full rounded-md">
        <button
          onClick={() => setActiveTab('open')}
          className={`flex-1 px-3 py-1.5 text-xs font-semibold transition-all ${
            activeTab === 'open' ? 'border border-primary bg-primary-muted text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Open
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 px-3 py-1.5 text-xs font-semibold transition-all ${
            activeTab === 'history' ? 'border border-primary bg-primary-muted text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          History
        </button>
      </div>

      {activeTab === 'open' ? (
        positions.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            {isLoading
              ? "Loading positions..."
              : "No open positions. Start trading to see them here."}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {positions.map((pos) => {
              const isLong = pos.side === "long";
              const pnlPositive = pos.unrealized_pnl >= 0;
              const isClosing = closingId === pos.position_id;

              return (
                <div
                  key={pos.position_id}
                  className="border border-border-muted flex items-center justify-between px-3 py-2.5 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        isLong
                          ? "bg-success/15 text-success"
                          : "bg-danger/15 text-danger"
                      }`}
                    >
                      {pos.side}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{pos.symbol}</span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {pos.leverage}x · {pos.size} contracts
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end">
                      <span
                        className={`tabular-nums flex items-center gap-0.5 text-sm font-semibold ${
                          pnlPositive ? "text-success" : "text-danger"
                        }`}
                      >
                        {pnlPositive ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {formatPnl(pos.unrealized_pnl)}
                      </span>
                      <span className="tabular-nums text-[10px] text-muted-foreground">
                        Entry: ${pos.entry_price.toFixed(2)}
                      </span>
                    </div>

                    {onClosePosition && (
                      <button
                        onClick={() => handleClose(pos.position_id, pos.symbol, pos.side, pos.size)}
                        disabled={isClosing}
                        className="border border-border-muted p-1.5 text-muted-foreground transition-all hover:border-danger hover:text-danger disabled:opacity-50"
                        title="Close position"
                      >
                        {isClosing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        (!closedPositions || closedPositions.length === 0) ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No trade history yet
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {closedPositions.map((pos) => {
              const isLong = pos.side === "long";
              const pnlPositive = pos.realized_pnl >= 0;

              return (
                <div
                  key={pos.position_id}
                  className="border border-border-muted flex flex-col gap-2 px-3 py-2.5 opacity-80 rounded-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          isLong
                            ? "bg-success/15 text-success"
                            : "bg-danger/15 text-danger"
                        }`}
                      >
                        {pos.side}
                      </span>
                      <span className="text-sm font-medium">{pos.symbol}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(pos.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        In: ${pos.entry_price.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        Out: ${pos.mark_price.toFixed(2)}
                      </span>
                    </div>
                    <span
                      className={`tabular-nums flex items-center gap-0.5 text-sm font-semibold ${
                        pnlPositive ? "text-success" : "text-danger"
                      }`}
                    >
                      {pnlPositive ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {formatPnl(pos.realized_pnl)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
