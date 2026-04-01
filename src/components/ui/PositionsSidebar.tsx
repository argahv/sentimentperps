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
  onClosePosition?: (marketId: string, side: TradeDirection, size: number) => Promise<void>;
}

export function PositionsSidebar({ onClosePosition }: PositionsSidebarProps) {
  const { positions, isLoading } = usePositionsStore();
  const totalPnl = usePositionsStore((s) => s.getTotalUnrealizedPnl());
  const [closingId, setClosingId] = useState<string | null>(null);

  const handleClose = async (positionId: string, marketId: string, side: "long" | "short", size: number) => {
    if (!onClosePosition) return;
    setClosingId(positionId);
    try {
      await onClosePosition(marketId, side, size);
    } finally {
      setClosingId(null);
    }
  };

  return (
    <div className="neu-extruded flex flex-col gap-4 rounded-[32px] bg-background p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="neu-icon-well flex h-8 w-8 items-center justify-center">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-sm font-semibold font-display">Open Positions</h2>
        </div>
        {positions.length > 0 && (
          <span
            className={`text-sm font-semibold ${
              totalPnl >= 0 ? "text-success" : "text-danger"
            }`}
          >
            {formatPnl(totalPnl)}
          </span>
        )}
      </div>

      {positions.length === 0 ? (
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
                className="neu-inset-sm flex items-center justify-between rounded-xl px-3 py-2.5"
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
                    <span className="text-[10px] text-muted-foreground">
                      {pos.leverage}x · {pos.size} contracts
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end">
                    <span
                      className={`flex items-center gap-0.5 text-sm font-semibold ${
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
                    <span className="text-[10px] text-muted-foreground">
                      Entry: ${pos.entry_price.toFixed(2)}
                    </span>
                  </div>

                  {onClosePosition && (
                    <button
                      onClick={() => handleClose(pos.position_id, pos.market_id, pos.side, pos.size)}
                      disabled={isClosing}
                      className="neu-extruded-sm rounded-xl p-1.5 text-muted-foreground transition-all hover:text-danger hover:shadow-neu-hover disabled:opacity-50"
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
      )}
    </div>
  );
}
