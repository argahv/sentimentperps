"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useSentimentPolling } from "@/hooks/useSentimentPolling";
import { useTrade } from "@/hooks/useTrade";
import { usePositions } from "@/hooks/usePositions";
import { HotTokensFeed } from "@/components/ui/HotTokensFeed";
import { PositionsSidebar } from "@/components/ui/PositionsSidebar";
import { MissedMoves } from "@/components/ui/MissedMoves";
import { PriceTicker } from "@/components/ui/PriceTicker";
import { LogIn } from "lucide-react";

const TICKER_SYMBOLS = ["BTC", "ETH", "SOL", "DOGE", "ARB", "AVAX"];

export default function DashboardContent() {
  const { login, authenticated, ready } = usePrivy();
  const { walletAddress, closePosition } = useTrade();
  const { refetch } = usePositions(walletAddress, null, 30_000);

  useSentimentPolling(60_000);

  const handleClose = async (marketId: string, side: "long" | "short", size: number) => {
    await closePosition(marketId, side, size);
    refetch();
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time sentiment signals and your open positions.
          </p>
        </div>
        {ready && !authenticated && (
          <button
            onClick={login}
            className="neu-btn flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            <LogIn className="h-4 w-4" />
            Connect Wallet
          </button>
        )}
      </div>

      <PriceTicker symbols={TICKER_SYMBOLS} />

      <MissedMoves />

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <HotTokensFeed />
        </div>
        <div className="w-full lg:w-80 shrink-0">
          <PositionsSidebar onClosePosition={authenticated ? handleClose : undefined} />
        </div>
      </div>
    </div>
  );
}
