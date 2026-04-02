"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  ArrowRightLeft,
  ChevronDown,
  Loader2,
  ExternalLink,
  Check,
} from "lucide-react";

interface Chain {
  id: string;
  name: string;
  symbol: string;
}

interface BridgeToken {
  symbol: string;
  name: string;
}

const CHAINS: Chain[] = [
  { id: "ethereum", name: "Ethereum", symbol: "ETH" },
  { id: "arbitrum", name: "Arbitrum", symbol: "ARB" },
  { id: "polygon", name: "Polygon", symbol: "MATIC" },
  { id: "optimism", name: "Optimism", symbol: "OP" },
  { id: "base", name: "Base", symbol: "BASE" },
];

const TOKENS: BridgeToken[] = [
  { symbol: "USDC", name: "USD Coin" },
  { symbol: "USDT", name: "Tether" },
  { symbol: "ETH", name: "Ethereum" },
];

type BridgeStep = "input" | "bridging" | "complete";

interface DepositBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DepositBridgeModal({ isOpen, onClose }: DepositBridgeModalProps) {
  const [sourceChain, setSourceChain] = useState<Chain>(CHAINS[0]);
  const [token, setToken] = useState<BridgeToken>(TOKENS[0]);
  const [amount, setAmount] = useState("");
  const [showChainSelect, setShowChainSelect] = useState(false);
  const [showTokenSelect, setShowTokenSelect] = useState(false);
  const [step, setStep] = useState<BridgeStep>("input");

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && step !== "bridging") onClose();
    },
    [onClose, step]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    if (!isOpen) {
      setStep("input");
      setAmount("");
    }
  }, [isOpen]);

  const handleBridge = () => {
    setStep("bridging");
    setTimeout(() => setStep("complete"), 3000);
  };

  if (!isOpen) return null;

  const amountNum = Number(amount);
  const isValid = amount && amountNum > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== "bridging") onClose();
      }}
    >
      <div className="absolute inset-0 bg-background/80" />

      <div className="swiss-card rounded-lg industrial-screws relative w-full max-w-sm p-5">
        <button
          onClick={onClose}
          disabled={step === "bridging"}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="swiss-icon-well flex h-9 w-9 items-center justify-center text-primary">
            <ArrowRightLeft className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold font-display uppercase tracking-widest">Cross-Chain Deposit</h3>
            <p className="text-xs text-muted-foreground">Powered by Rhinofi</p>
          </div>
        </div>

        {step === "input" && (
          <>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground uppercase tracking-widest">From Chain</span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => { setShowChainSelect((v) => !v); setShowTokenSelect(false); }}
                    className="swiss-input flex w-full items-center justify-between bg-surface px-3 py-2.5 text-sm transition-all"
                  >
                    <span className="font-medium">{sourceChain.name}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                  {showChainSelect && (
                    <div className="border border-border-muted bg-surface absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden">
                      {CHAINS.map((chain) => (
                        <button
                          key={chain.id}
                          onClick={() => { setSourceChain(chain); setShowChainSelect(false); }}
                          className={`flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-foreground/5 ${
                            chain.id === sourceChain.id ? "text-primary font-medium" : "text-foreground"
                          }`}
                        >
                          {chain.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="border border-border-muted bg-surface flex h-8 w-8 items-center justify-center">
                  <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground rotate-90" />
                </div>
              </div>

              <div className="border border-border-muted bg-surface px-3 py-2.5">
                <span className="text-xs text-muted-foreground uppercase tracking-widest">To</span>
                <p className="text-sm font-medium">Pacifica (Solana)</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground uppercase tracking-widest">Token</span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => { setShowTokenSelect((v) => !v); setShowChainSelect(false); }}
                    className="swiss-input flex w-full items-center justify-between bg-surface px-3 py-2.5 text-sm transition-all"
                  >
                    <span className="font-medium">{token.symbol} — {token.name}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                  {showTokenSelect && (
                    <div className="border border-border-muted bg-surface absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden">
                      {TOKENS.map((t) => (
                        <button
                          key={t.symbol}
                          onClick={() => { setToken(t); setShowTokenSelect(false); }}
                          className={`flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-foreground/5 ${
                            t.symbol === token.symbol ? "text-primary font-medium" : "text-foreground"
                          }`}
                        >
                          {t.symbol} — {t.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="bridge-amount" className="text-xs text-muted-foreground uppercase tracking-widest">
                  Amount
                </label>
                <input
                  id="bridge-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="swiss-input bg-surface px-3 py-2.5 text-sm placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <button
              onClick={handleBridge}
              disabled={!isValid}
              className="swiss-btn-accent mt-4 w-full bg-primary py-3 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Bridge & Deposit
            </button>

            <p className="mt-3 text-center text-[10px] text-muted-foreground">
              Cross-chain bridging powered by{" "}
              <a
                href="https://rhinofi.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Rhinofi
              </a>
            </p>
          </>
        )}

        {step === "bridging" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-sm font-semibold font-display uppercase tracking-widest">Bridging in progress...</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Moving {amountNum} {token.symbol} from {sourceChain.name} to Pacifica
              </p>
            </div>
            <div className="border border-border-muted bg-surface flex items-center gap-2 px-3 py-2 text-[10px] text-muted-foreground">
              <span>Estimated time: ~2 min</span>
            </div>
          </div>
        )}

        {step === "complete" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="swiss-icon-well flex h-12 w-12 items-center justify-center text-success">
              <Check className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold font-display uppercase tracking-widest">Deposit Complete</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {amountNum} {token.symbol} is now available for trading on Pacifica
              </p>
            </div>
            <a
              href="https://rhinofi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View on Rhinofi <ExternalLink className="h-3 w-3" />
            </a>
            <button
              onClick={onClose}
              className="swiss-btn-accent w-full bg-primary py-2.5 text-sm font-semibold text-white"
            >
              Start Trading
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
