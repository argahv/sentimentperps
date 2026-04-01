"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TradeConfirmationModal } from "@/components/ui/TradeConfirmationModal";
import type { TradeDirection } from "@/types/app";

const LEVERAGE_OPTIONS = [1, 2, 5, 10, 20] as const;

interface OrderFormProps {
  symbol: string;
  marketId: string;
  currentPrice?: number;
  isSubmitting?: boolean;
  onSubmit?: (data: {
    symbol: string;
    marketId: string;
    direction: TradeDirection;
    size: number;
    leverage: number;
    takeProfit?: number;
    stopLoss?: number;
  }) => void;
}

export function OrderForm({ symbol, marketId, currentPrice, isSubmitting, onSubmit }: OrderFormProps) {
  const [direction, setDirection] = useState<TradeDirection>("long");
  const [size, setSize] = useState("");
  const [leverage, setLeverage] = useState(5);
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [showTpSl, setShowTpSl] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const sizeNum = Number(size);
  const isValid = size && sizeNum > 0;

  const tpNum = takeProfit ? Number(takeProfit) : undefined;
  const slNum = stopLoss ? Number(stopLoss) : undefined;

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValid) return;
    setShowModal(true);
  };

  const handleConfirm = () => {
    setShowModal(false);
    onSubmit?.({
      symbol,
      marketId,
      direction,
      size: sizeNum,
      leverage,
      ...(tpNum && { takeProfit: tpNum }),
      ...(slNum && { stopLoss: slNum }),
    });
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="neu-extruded flex flex-col gap-4 rounded-[32px] bg-background p-4">
        <h3 className="text-sm font-semibold font-display">Place Order — {symbol}</h3>

        <div className="neu-inset grid grid-cols-2 gap-1 rounded-2xl p-1">
          <button
            type="button"
            onClick={() => setDirection("long")}
            disabled={isSubmitting}
            className={`rounded-xl py-2 text-sm font-semibold transition-all ${
              direction === "long"
                ? "neu-extruded-sm bg-success text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Long
          </button>
          <button
            type="button"
            onClick={() => setDirection("short")}
            disabled={isSubmitting}
            className={`rounded-xl py-2 text-sm font-semibold transition-all ${
              direction === "short"
                ? "neu-extruded-sm bg-danger text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Short
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="size" className="text-xs text-muted-foreground">
            Size (USDC)
          </label>
          <input
            id="size"
            type="number"
            min="0"
            step="0.01"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="0.00"
            disabled={isSubmitting}
            className="neu-input rounded-2xl bg-background px-3 py-2.5 text-sm placeholder:text-muted disabled:opacity-50"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">
            Leverage — {leverage}x
          </span>
          <div className="flex gap-1.5">
            {LEVERAGE_OPTIONS.map((lev) => (
              <button
                key={lev}
                type="button"
                onClick={() => setLeverage(lev)}
                disabled={isSubmitting}
                className={`flex-1 rounded-xl py-1.5 text-xs font-medium transition-all ${
                  leverage === lev
                    ? "neu-extruded-sm bg-primary text-white"
                    : "neu-inset-sm text-muted-foreground hover:text-foreground"
                }`}
              >
                {lev}x
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowTpSl((prev) => !prev)}
          className="flex items-center gap-1 self-start text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {showTpSl ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Hide TP / SL
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Add TP / SL
            </>
          )}
        </button>

        {showTpSl && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="takeProfit" className="text-xs text-muted-foreground">
                Take Profit ($)
              </label>
              <input
                id="takeProfit"
                type="number"
                min="0"
                step="0.01"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="—"
                disabled={isSubmitting}
                className="neu-input rounded-2xl bg-background px-3 py-2 text-sm placeholder:text-muted disabled:opacity-50"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="stopLoss" className="text-xs text-muted-foreground">
                Stop Loss ($)
              </label>
              <input
                id="stopLoss"
                type="number"
                min="0"
                step="0.01"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="—"
                disabled={isSubmitting}
                className="neu-input rounded-2xl bg-background px-3 py-2 text-sm placeholder:text-muted disabled:opacity-50"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={`neu-btn flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed ${
            direction === "long"
              ? "bg-success"
              : "bg-danger"
          }`}
        >
          {direction === "long" ? "Open Long" : "Open Short"} {symbol}
        </button>
      </form>

      <TradeConfirmationModal
        isOpen={showModal}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        isSubmitting={isSubmitting ?? false}
        direction={direction}
        symbol={symbol}
        size={sizeNum}
        leverage={leverage}
        currentPrice={currentPrice ?? 0}
        takeProfit={tpNum}
        stopLoss={slNum}
      />
    </>
  );
}
