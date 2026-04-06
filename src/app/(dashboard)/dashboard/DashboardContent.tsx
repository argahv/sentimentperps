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
import { DivergenceAlerts } from "@/components/ui/DivergenceAlerts";
import { TrendingNarratives } from "@/components/ui/TrendingNarratives";
import { SentimentReplay } from "@/components/ui/SentimentReplay";
import { DashboardHeroStats } from "@/components/ui/DashboardHeroStats";
import { RecentWinsFeed } from "@/components/ui/RecentWinsFeed";
import { QuestBoard } from "@/components/ui/QuestBoard";
import { SentimentSignalCards } from "@/components/ui/SentimentSignalCards";
import { LogIn, ChevronDown, Crosshair } from "lucide-react";

export default function DashboardContent() {
  const { login, authenticated, ready } = usePrivy();
  const { walletAddress, closePosition, cancelOrder } = useTrade();
  const { refetch } = usePositions(walletAddress, null, 30_000);
  const [edgeOpen, setEdgeOpen] = useState(false);

  useSentimentPolling(60_000);

  const handleClose = async (
    marketId: string,
    side: "long" | "short",
    size: number,
    positionMeta?: { entryPrice: number; markPrice: number; leverage: number; pnlUsdc: number; sentimentScoreAtEntry?: number; minutesAfterSignal?: number; sentimentAligned?: boolean }
  ) => {
    await closePosition(marketId, side, size, positionMeta);
    refetch();
  };

  const handleCancelOrder = async (orderId: string, symbol: string) => {
    await cancelOrder(orderId, symbol);
    refetch();
  };

  return (
    <div className="flex flex-col gap-3 p-4 lg:p-6 page-enter">
      {/* ── Header ── */}
      <div className="flex items-center justify-between card-entrance" style={{ animationDelay: "0ms" }}>
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Real-time sentiment signals and your open positions.
          </p>
        </div>
        {ready && !authenticated && (
          <button
            onClick={login}
            className="flat-btn-primary flex items-center gap-2 px-4 py-2 text-sm font-bold text-white"
          >
            <LogIn className="h-4 w-4" />
            Connect Wallet
          </button>
        )}
      </div>

      {/* ── Sentiment Command Center — unified signals, prices, heatmap ── */}
      <div className="card-entrance" style={{ animationDelay: "calc(1 * var(--stagger-base))" }}>
        <SentimentSignalCards />
      </div>

      {/* ── Hero Stats — platform-wide P&L, sentiment accuracy, wins, traders ── */}
      <div className="card-entrance" style={{ animationDelay: "calc(1.3 * var(--stagger-base))" }}>
        <DashboardHeroStats />
      </div>

      {/* ── Portfolio (full width) ── */}
      <div className="card-entrance" style={{ animationDelay: "calc(1.6 * var(--stagger-base))" }}>
        <PortfolioPerformanceCard />
      </div>

      {/* ── 2-col cockpit: Left stack + Right stack ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="flex flex-col gap-3 min-w-0">
          <div className="card-entrance" style={{ animationDelay: "calc(2 * var(--stagger-base))" }}>
            <TrendingNarratives />
          </div>
          <div className="card-entrance" style={{ animationDelay: "calc(2.5 * var(--stagger-base))" }}>
            <DivergenceAlerts />
          </div>
          <div className="card-entrance" style={{ animationDelay: "calc(3 * var(--stagger-base))" }}>
            <QuestBoard />
          </div>
          <div className="card-entrance" style={{ animationDelay: "calc(3.5 * var(--stagger-base))" }}>
            <RecentWinsFeed />
          </div>
        </div>

        <div className="flex flex-col gap-3 min-w-0">
          <div className="card-entrance" style={{ animationDelay: "calc(2.3 * var(--stagger-base))" }}>
            <MissedMoves />
          </div>
          <div className="card-entrance" style={{ animationDelay: "calc(2.8 * var(--stagger-base))" }}>
            <HotTokensFeed />
          </div>
          <div className="card-entrance" style={{ animationDelay: "calc(3.3 * var(--stagger-base))" }}>
            <PositionsSidebar onClosePosition={authenticated ? handleClose : undefined} onCancelOrder={authenticated ? handleCancelOrder : undefined} />
          </div>
          <div className="card-entrance" style={{ animationDelay: "calc(3.8 * var(--stagger-base))" }}>
            {/* Your Edge — collapsible progressive disclosure */}
            <span className="flat-card rounded-lg overflow-hidden transition-all duration-300">
              <button
                onClick={() => setEdgeOpen((v) => !v)}
                className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors duration-200 hover:bg-surface-elevated"
              >
                <div className="flex items-center gap-2">
                  <Crosshair className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Your Edge</span>
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
            </span>
          </div>
        </div>
      </div>

      <div className="card-entrance" style={{ animationDelay: "calc(4.3 * var(--stagger-base))" }}>
        <SentimentReplay />
      </div>
    </div>
  );
}
