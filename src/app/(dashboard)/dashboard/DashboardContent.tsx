"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSentimentPolling } from "@/hooks/useSentimentPolling";
import { useTrade } from "@/hooks/useTrade";
import { usePositions } from "@/hooks/usePositions";
import { PortfolioPerformanceCard } from "@/components/ui/PortfolioPerformanceCard";
import { YourEdgeCard } from "@/components/ui/YourEdgeCard";
import { HotTokensFeed } from "@/components/ui/HotTokensFeed";
import { PositionsSidebar } from "@/components/ui/PositionsSidebar";
import { MissedMoves } from "@/components/ui/MissedMoves";
import { PriceTicker } from "@/components/ui/PriceTicker";
import { DivergenceAlerts } from "@/components/ui/DivergenceAlerts";
import { SentimentReplay } from "@/components/ui/SentimentReplay";
import { LogIn, ChevronDown, Crosshair } from "lucide-react";

const TICKER_SYMBOLS = ["BTC", "ETH", "SOL", "DOGE", "ARB", "AVAX"];

export default function DashboardContent() {
  const { login, authenticated, ready } = usePrivy();
  const { walletAddress, closePosition } = useTrade();
  const { refetch } = usePositions(walletAddress, null, 30_000);
  const [edgeOpen, setEdgeOpen] = useState(false);

  useSentimentPolling(60_000);

  const handleClose = async (marketId: string, side: "long" | "short", size: number) => {
    await closePosition(marketId, side, size);
    refetch();
  };

  return (
    <div className="flex flex-col gap-3 p-4 lg:p-6 page-enter">
      {/* ── Header ── */}
      <div className="flex items-center justify-between card-entrance" style={{ animationDelay: "0ms" }}>
        <div>
          <h1 className="font-display text-2xl font-bold">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Real-time sentiment signals and your open positions.
          </p>
        </div>
        {ready && !authenticated && (
          <button
            onClick={login}
            className="neu-btn flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white btn-bounce"
          >
            <LogIn className="h-4 w-4" />
            Connect Wallet
          </button>
        )}
      </div>

      {/* ── Price Ticker (ambient market context) ── */}
      <div className="card-entrance" style={{ animationDelay: "calc(1 * var(--stagger-base))" }}>
        <PriceTicker symbols={TICKER_SYMBOLS} />
      </div>

      {/* ── Two-column terminal layout ── */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* ── LEFT: Data & Discovery ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {/* Portfolio hero — full width of left column */}
          <div className="card-entrance" style={{ animationDelay: "calc(2 * var(--stagger-base))" }}>
            <PortfolioPerformanceCard />
          </div>

          {/* Divergence Alerts — primary action driver */}
          <div className="card-entrance" style={{ animationDelay: "calc(3 * var(--stagger-base))" }}>
            <DivergenceAlerts />
          </div>

          {/* Missed Moves — FOMO / urgency strip */}
          <div className="card-entrance" style={{ animationDelay: "calc(4 * var(--stagger-base))" }}>
            <MissedMoves />
          </div>

          {/* Hot Tokens — browsing / discovery */}
          <div className="card-entrance" style={{ animationDelay: "calc(5 * var(--stagger-base))" }}>
            <HotTokensFeed />
          </div>

          {/* Sentiment Replay — trust / proof, lowest priority */}
          <div className="card-entrance" style={{ animationDelay: "calc(6 * var(--stagger-base))" }}>
            <SentimentReplay />
          </div>
        </div>

        {/* ── RIGHT: Positions & Edge (sticky sidebar) ── */}
        <div
          className="w-full lg:w-[340px] xl:w-[380px] shrink-0 flex flex-col gap-3 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-88px)] lg:overflow-y-auto card-entrance"
          style={{ animationDelay: "calc(2 * var(--stagger-base))" }}
        >
          {/* Positions — always visible, actionable */}
          <PositionsSidebar onClosePosition={authenticated ? handleClose : undefined} />

          {/* Your Edge — collapsible progressive disclosure */}
          <div className="neu-extruded rounded-[32px] bg-background overflow-hidden transition-all duration-300">
            <button
              onClick={() => setEdgeOpen((v) => !v)}
              className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors duration-200 hover:bg-primary/5"
            >
              <div className="flex items-center gap-2">
                <Crosshair className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold font-display">Your Edge</span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${edgeOpen ? "rotate-180" : ""}`}
              />
            </button>
            <div
              className="transition-all duration-300 ease-in-out overflow-hidden"
              style={{ maxHeight: edgeOpen ? "500px" : "0px", opacity: edgeOpen ? 1 : 0 }}
            >
              <div className="px-2 pb-3">
                <YourEdgeCard />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
