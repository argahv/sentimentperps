"use client";

import { useEffect, useCallback } from "react";
import { Loader2, ArrowUpRight, ArrowDownRight, X } from "lucide-react";
import type { TradeDirection } from "@/types/app";

interface TradeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  direction: TradeDirection;
  symbol: string;
  size: number;
  leverage: number;
  currentPrice: number;
  takeProfit?: number;
  stopLoss?: number;
}

function calcPnlPct(
  entry: number,
  target: number,
  leverage: number,
  direction: TradeDirection
): number {
  if (entry === 0) return 0;
  const raw = direction === "long"
    ? (target - entry) / entry
    : (entry - target) / entry;
  return raw * leverage * 100;
}

export function TradeConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  direction,
  symbol,
  size,
  leverage,
  currentPrice,
  takeProfit,
  stopLoss,
}: TradeConfirmationModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    },
    [onClose, isSubmitting]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const isLong = direction === "long";

  const tpPct = takeProfit ? calcPnlPct(currentPrice, takeProfit, leverage, direction) : null;
  const slPct = stopLoss ? calcPnlPct(currentPrice, stopLoss, leverage, direction) : null;

  const tpDollar = tpPct !== null ? (size * tpPct) / 100 : null;
  const slDollar = slPct !== null ? (size * slPct) / 100 : null;

  const formattedPrice = currentPrice >= 1000
    ? currentPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })
    : currentPrice >= 1
      ? currentPrice.toFixed(2)
      : currentPrice.toFixed(4);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      <div className="neu-extruded relative w-full max-w-sm rounded-[32px] bg-background p-5">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div
            className={`neu-icon-well flex h-9 w-9 items-center justify-center ${
              isLong ? "text-success" : "text-danger"
            }`}
          >
            {isLong ? (
              <ArrowUpRight className="h-5 w-5" />
            ) : (
              <ArrowDownRight className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold font-display">
              Confirm {isLong ? "Long" : "Short"}
            </h3>
            <p className="text-xs text-muted-foreground">{symbol}/USDC PERP</p>
          </div>
        </div>

        <div className="neu-inset flex flex-col gap-2.5 rounded-2xl p-3 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Entry Price</span>
            <span className="font-medium">${formattedPrice}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Size</span>
            <span className="font-medium">{size} USDC</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Leverage</span>
            <span className="font-medium">{leverage}x</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Notional</span>
            <span className="font-medium">${(size * leverage).toLocaleString("en-US")}</span>
          </div>

          {takeProfit != null && (
            <>
              <div className="h-px bg-foreground/10" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Take Profit</span>
                <span className="font-medium text-success">
                  ${takeProfit.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                </span>
              </div>
              {tpPct !== null && tpDollar !== null && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Est. Profit</span>
                  <span className="font-medium text-success">
                    +${tpDollar.toFixed(2)} ({tpPct > 0 ? "+" : ""}{tpPct.toFixed(1)}%)
                  </span>
                </div>
              )}
            </>
          )}

          {stopLoss != null && (
            <>
              <div className="h-px bg-foreground/10" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Stop Loss</span>
                <span className="font-medium text-danger">
                  ${stopLoss.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                </span>
              </div>
              {slPct !== null && slDollar !== null && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Est. Loss</span>
                  <span className="font-medium text-danger">
                    {slDollar.toFixed(2)} ({slPct.toFixed(1)}%)
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <p className="mb-4 text-center text-[10px] text-muted-foreground">
          0.05% builder fee via SENTPERPS
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="neu-btn rounded-2xl bg-background py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`neu-btn flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${
              isLong
                ? "bg-success"
                : "bg-danger"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Signing...
              </>
            ) : (
              "Confirm"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
