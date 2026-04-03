"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  ArrowRightLeft,
  ChevronDown,
  Loader2,
  ExternalLink,
  Check,
  AlertTriangle,
  Clock,
  ArrowRight,
  Zap,
} from "lucide-react";
import {
  SUPPORTED_SOURCE_CHAINS,
  BRIDGE_TOKEN,
  buildRhinoBridgeUrl,
  formatEstimatedTime,
} from "@/lib/rhino";
import type { BridgeQuote, SupportedChainId } from "@/lib/rhino";

type BridgeStep = "input" | "quoting" | "confirm" | "bridging" | "complete";

interface DepositBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUOTE_TTL_MS = 55_000;

export function DepositBridgeModal({ isOpen, onClose }: DepositBridgeModalProps) {
  const [sourceChainId, setSourceChainId] = useState<SupportedChainId>("ETHEREUM");
  const [amount, setAmount] = useState("");
  const [showChainSelect, setShowChainSelect] = useState(false);
  const [step, setStep] = useState<BridgeStep>("input");
  const [quote, setQuote] = useState<BridgeQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteSecondsLeft, setQuoteSecondsLeft] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sourceChain = SUPPORTED_SOURCE_CHAINS.find((c) => c.id === sourceChainId) ?? SUPPORTED_SOURCE_CHAINS[0];

  const stopCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(
    (expiresAt: number) => {
      stopCountdown();
      const tick = () => {
        const remaining = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
        setQuoteSecondsLeft(remaining);
        if (remaining === 0) {
          stopCountdown();
          setStep("input");
          setQuote(null);
          setQuoteError("Quote expired. Please request a new quote.");
        }
      };
      tick();
      countdownRef.current = setInterval(tick, 1000);
    },
    [stopCountdown]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && step !== "bridging") {
        stopCountdown();
        onClose();
      }
    },
    [onClose, step, stopCountdown]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    if (!isOpen) {
      stopCountdown();
      setStep("input");
      setAmount("");
      setQuote(null);
      setQuoteError(null);
      setShowChainSelect(false);
    }
  }, [isOpen, stopCountdown]);

  useEffect(() => {
    return () => stopCountdown();
  }, [stopCountdown]);

  const handleGetQuote = async () => {
    setStep("quoting");
    setQuoteError(null);
    setQuote(null);

    try {
      const res = await fetch("/api/bridge/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: BRIDGE_TOKEN,
          chainIn: sourceChainId,
          chainOut: "SOLANA",
          amount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Quote request failed");
      }

      const expiresAt = data.expiresAt ?? Date.now() + QUOTE_TTL_MS;
      setQuote({ ...data, expiresAt });
      startCountdown(expiresAt);
      setStep("confirm");
    } catch (err) {
      setQuoteError(err instanceof Error ? err.message : "Failed to fetch quote");
      setStep("input");
    }
  };

  const handleConfirm = () => {
    stopCountdown();
    setStep("bridging");
  };

  const handleClose = () => {
    if (step === "bridging") return;
    stopCountdown();
    onClose();
  };

  const rhinoUrl = buildRhinoBridgeUrl({
    token: BRIDGE_TOKEN,
    chainIn: sourceChainId,
    chainOut: "SOLANA",
    amount,
  });

  if (!isOpen) return null;

  const amountNum = Number(amount);
  const isValid = amount.trim() !== "" && amountNum > 0 && !isNaN(amountNum);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== "bridging") handleClose();
      }}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      <div className="swiss-card rounded-lg industrial-screws relative w-full max-w-sm p-5 card-entrance">
        <button
          onClick={handleClose}
          disabled={step === "bridging"}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors duration-150"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="swiss-icon-well flex h-9 w-9 items-center justify-center text-primary">
            <ArrowRightLeft className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold font-display uppercase tracking-widest">
              Cross-Chain Deposit
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="led-indicator led-green" />
              Powered by{" "}
              <a
                href="https://rhino.fi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Rhino.fi
              </a>
            </p>
          </div>
        </div>

        {step === "input" && (
          <InputStep
            sourceChain={sourceChain}
            sourceChainId={sourceChainId}
            onSelectChain={(id) => { setSourceChainId(id); setShowChainSelect(false); }}
            showChainSelect={showChainSelect}
            onToggleChainSelect={() => setShowChainSelect((v) => !v)}
            amount={amount}
            onAmountChange={setAmount}
            isValid={isValid}
            onGetQuote={handleGetQuote}
            error={quoteError}
          />
        )}

        {step === "quoting" && <QuotingStep chainName={sourceChain.name} amount={amount} />}

        {step === "confirm" && quote && (
          <ConfirmStep
            quote={quote}
            sourceChainName={sourceChain.name}
            secondsLeft={quoteSecondsLeft}
            onConfirm={handleConfirm}
            onBack={() => { stopCountdown(); setStep("input"); }}
          />
        )}

        {step === "bridging" && quote && (
          <BridgingStep
            quote={quote}
            sourceChainName={sourceChain.name}
            rhinoUrl={rhinoUrl}
            onDone={() => setStep("complete")}
          />
        )}

        {step === "complete" && (
          <CompleteStep amount={amount} onClose={onClose} rhinoUrl={rhinoUrl} />
        )}
      </div>
    </div>
  );
}

interface InputStepProps {
  sourceChain: (typeof SUPPORTED_SOURCE_CHAINS)[number];
  sourceChainId: SupportedChainId;
  onSelectChain: (id: SupportedChainId) => void;
  showChainSelect: boolean;
  onToggleChainSelect: () => void;
  amount: string;
  onAmountChange: (v: string) => void;
  isValid: boolean;
  onGetQuote: () => void;
  error: string | null;
}

function InputStep({
  sourceChain,
  sourceChainId,
  onSelectChain,
  showChainSelect,
  onToggleChainSelect,
  amount,
  onAmountChange,
  isValid,
  onGetQuote,
  error,
}: InputStepProps) {
  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground uppercase tracking-widest">
            From Chain
          </span>
          <div className="relative">
            <button
              type="button"
              onClick={onToggleChainSelect}
              className="swiss-input flex w-full items-center justify-between bg-surface px-3 py-2.5 text-sm transition-all"
            >
              <span className="font-medium">{sourceChain.name}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
            {showChainSelect && (
              <div className="border border-border-muted bg-surface absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-md shadow-[var(--shadow-neu)]">
                {SUPPORTED_SOURCE_CHAINS.map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => onSelectChain(chain.id)}
                    className={`flex w-full items-center px-3 py-2 text-sm transition-colors duration-150 hover:bg-foreground/5 ${
                      chain.id === sourceChainId
                        ? "text-primary font-medium"
                        : "text-foreground"
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
          <div className="border border-border-muted bg-surface flex h-8 w-8 items-center justify-center rounded-md">
            <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground rotate-90" />
          </div>
        </div>

        <div className="border border-border-muted bg-surface px-3 py-2.5 rounded-md opacity-60">
          <span className="text-xs text-muted-foreground uppercase tracking-widest">To</span>
          <p className="text-sm font-medium">Pacifica (Solana)</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground uppercase tracking-widest">
            Token
          </span>
          <div className="border border-border-muted bg-surface px-3 py-2.5 rounded-md opacity-60">
            <p className="text-sm font-medium font-mono">USDC — USD Coin</p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="bridge-amount"
            className="text-xs text-muted-foreground uppercase tracking-widest"
          >
            Amount (USDC)
          </label>
          <input
            id="bridge-amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="0.00"
            className="swiss-input bg-surface px-3 py-2.5 text-sm placeholder:text-muted-foreground w-full"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger-muted px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 text-danger flex-shrink-0" />
            <p className="text-xs text-danger">{error}</p>
          </div>
        )}
      </div>

      <button
        onClick={onGetQuote}
        disabled={!isValid}
        className="swiss-btn-accent mt-4 w-full py-3 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Get Bridge Quote
      </button>

      <p className="mt-3 text-center text-[10px] text-muted-foreground">
        Real-time quotes via{" "}
        <a
          href="https://rhino.fi"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Rhino.fi
        </a>{" "}
        · No API key required
      </p>
    </>
  );
}

function QuotingStep({ chainName, amount }: { chainName: string; amount: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="relative">
        <div className="swiss-icon-well flex h-12 w-12 items-center justify-center text-primary">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold font-display uppercase tracking-widest">
          Fetching Quote
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Getting real-time rates for {amount} USDC from {chainName}
        </p>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border-muted bg-surface-muted">
        <div className="led-indicator led-yellow" />
        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
          Contacting Rhino.fi
        </span>
      </div>
    </div>
  );
}

interface ConfirmStepProps {
  quote: BridgeQuote;
  sourceChainName: string;
  secondsLeft: number;
  onConfirm: () => void;
  onBack: () => void;
}

function ConfirmStep({ quote, sourceChainName, secondsLeft, onConfirm, onBack }: ConfirmStepProps) {
  const urgency = secondsLeft < 15 ? "text-danger" : secondsLeft < 30 ? "text-warning" : "text-muted-foreground";
  const ledClass = secondsLeft < 15 ? "led-red" : secondsLeft < 30 ? "led-yellow" : "led-green";

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between rounded-md border border-border-muted bg-surface-muted px-3 py-2">
          <span className="text-xs text-muted-foreground uppercase tracking-widest">Route</span>
          <div className="flex items-center gap-2 text-sm font-medium">
            <span>{sourceChainName}</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-primary">Solana</span>
          </div>
        </div>

        <div className="rounded-md border border-border-muted bg-surface-muted p-3 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">You send</span>
            <span className="font-mono text-sm font-semibold">
              {Number(quote.payAmount).toFixed(2)} USDC
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">You receive</span>
            <span className="font-mono text-sm font-semibold text-success">
              {Number(quote.receiveAmount).toFixed(2)} USDC
            </span>
          </div>
          <div className="w-full h-px bg-border-muted" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Bridge fee</span>
            <span className="font-mono text-xs text-muted-foreground">
              ${quote.fees.bridgeFeeUsd.toFixed(2)}
            </span>
          </div>
          {(quote.fees.gasFeeUsd ?? 0) > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Gas fee</span>
              <span className="font-mono text-xs text-muted-foreground">
                ${(quote.fees.gasFeeUsd ?? 0).toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total fees</span>
            <span className="font-mono text-xs font-medium">
              ${quote.fees.totalFeeUsd.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border border-border-muted bg-surface-muted px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Est. time</span>
          </div>
          <span className="font-mono text-xs font-medium">
            {formatEstimatedTime(quote.estimatedTime)}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-md border border-border-muted bg-surface-muted px-3 py-2">
          <div className={`flex items-center gap-1.5 text-xs ${urgency}`}>
            <div className={`led-indicator ${ledClass}`} />
            <span>Quote expires</span>
          </div>
          <span className={`font-mono text-xs font-semibold ${urgency}`}>
            {secondsLeft}s
          </span>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={onBack}
          className="swiss-btn-outline flex-1 py-2.5 text-sm font-semibold"
        >
          Back
        </button>
        <button
          onClick={onConfirm}
          className="swiss-btn-accent flex-1 py-2.5 text-sm font-semibold text-white"
        >
          Confirm
        </button>
      </div>

      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        Quote ID: <span className="font-mono">{quote.quoteId.slice(0, 12)}…</span>
      </p>
    </>
  );
}

interface BridgingStepProps {
  quote: BridgeQuote;
  sourceChainName: string;
  rhinoUrl: string;
  onDone: () => void;
}

function BridgingStep({ quote, sourceChainName, rhinoUrl, onDone }: BridgingStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 py-4">
        <div className="swiss-icon-well flex h-12 w-12 items-center justify-center text-primary">
          <Zap className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold font-display uppercase tracking-widest text-center">
          Ready to Bridge
        </p>
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          Complete your deposit on Rhino.fi. Your USDC will arrive on Solana{" "}
          {formatEstimatedTime(quote.estimatedTime)}.
        </p>
      </div>

      <div className="rounded-md border border-border-muted bg-surface-muted p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Sending</span>
          <span className="font-mono font-semibold">{Number(quote.payAmount).toFixed(2)} USDC</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">From</span>
          <span className="font-medium">{sourceChainName}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">You receive</span>
          <span className="font-mono font-semibold text-success">
            {Number(quote.receiveAmount).toFixed(2)} USDC on Solana
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Est. arrival</span>
          <span className="font-mono">{formatEstimatedTime(quote.estimatedTime)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary-muted px-3 py-2.5">
        <div className="led-indicator led-yellow flex-shrink-0" />
        <p className="text-[11px] text-primary leading-snug">
          This app cannot sign EVM transactions. Execute the bridge on Rhino.fi — we&apos;ve pre-filled the details for you.
        </p>
      </div>

      <a
        href={rhinoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="swiss-btn-accent flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-white no-underline"
      >
        Complete on Rhino.fi
        <ExternalLink className="h-4 w-4" />
      </a>

      <button
        onClick={onDone}
        className="swiss-btn-outline w-full py-2.5 text-sm font-semibold"
      >
        I&apos;ve Completed the Bridge
      </button>
    </div>
  );
}

function CompleteStep({
  amount,
  onClose,
  rhinoUrl,
}: {
  amount: string;
  onClose: () => void;
  rhinoUrl: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="swiss-icon-well flex h-12 w-12 items-center justify-center text-success">
        <Check className="h-6 w-6" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold font-display uppercase tracking-widest">
          Bridge Initiated
        </p>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          {Number(amount).toFixed(2)} USDC is on its way to Solana via Rhino.fi.
          Funds will be available for trading once the bridge confirms.
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-md border border-success/20 bg-success-muted px-3 py-2">
        <div className="led-indicator led-green" />
        <span className="text-xs text-success">Bridge transaction submitted</span>
      </div>
      <a
        href={rhinoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-xs text-primary hover:underline"
      >
        Track on Rhino.fi <ExternalLink className="h-3 w-3" />
      </a>
      <button
        onClick={onClose}
        className="swiss-btn-accent w-full py-2.5 text-sm font-semibold text-white"
      >
        Start Trading
      </button>
    </div>
  );
}
