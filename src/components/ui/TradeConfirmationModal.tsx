"use client";

import { useEffect, useCallback, useRef } from "react";
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
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    },
    [onClose, isSubmitting]
  );

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    
    if (cancelBtnRef.current) {
      cancelBtnRef.current.focus();
    } else {
      requestAnimationFrame(() => {
        if (cancelBtnRef.current) cancelBtnRef.current.focus();
      });
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
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
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-heading"
      ref={modalRef}
    >
      <div className="absolute inset-0 bg-background/80" />

      <div className="swiss-card bg-surface rounded-lg industrial-screws relative w-full max-w-sm p-5">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div
            className={`swiss-icon-well flex h-9 w-9 items-center justify-center ${
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
            <h3 id="modal-heading" className="text-sm font-semibold font-display uppercase tracking-widest">
              Confirm {isLong ? "Long" : "Short"}
            </h3>
            <p className="text-xs text-muted-foreground">{symbol}/USDC PERP</p>
          </div>
        </div>

        <div className="border border-border-muted flex flex-col rounded-md gap-2.5 p-3 mb-4">
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
          Powered by Pacifica Exchange
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="swiss-btn-outline bg-surface py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`swiss-btn-accent flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${
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
