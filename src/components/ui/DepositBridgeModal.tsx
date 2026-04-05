"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { X, ArrowRightLeft } from "lucide-react";
import dynamic from "next/dynamic";
import type { DefaultRoute, WidgetTheme, ChainFilter } from "@rhino.fi/widget";
import { useWallets } from "@privy-io/react-auth/solana";

const RhinoWidget = dynamic(
  () => import("@rhino.fi/widget").then((mod) => mod.default),
  { ssr: false, loading: () => <WidgetSkeleton /> }
);

interface DepositBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RHINO_API_KEY = "PUBLIC-50a8f277-bf7f-4bda-8ab7-bca05e031bb8";

const BASE_ROUTE: DefaultRoute = {
  chainOut: "SOLANA",
  tokenIn: "USDC",
  tokenOut: "USDC",
};

const INCLUDE_CHAINS: ChainFilter = {
  ETHEREUM: true,
  ARBITRUM: true,
  BASE: true,
  OPTIMISM: true,
  POLYGON: true,
  AVALANCHE: true,
  "BNB Smart Chain": true,
  LINEA: true,
  SCROLL: true,
  ZKSYNC: true,
};

const widgetTheme: WidgetTheme = {
  colors: {
    primary: "#FF4757",
    primaryLight: "#FF6B78",
    widgetBackground: "transparent",
    select: "#1E2330",
    textPrimary: "#E8ECF1",
    textSecondary: "#6B7A8D",
    textPrimaryCta: "#FFFFFF",
    stroke: "#2A3040",
  },
  radius: {
    widget: "0px",
    actionElements: "6px",
  },
};

export function DepositBridgeModal({ isOpen, onClose }: DepositBridgeModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !isOpen) return null;
  return <DepositBridgeModalInner onClose={onClose} />;
}

function DepositBridgeModalInner({ onClose }: { onClose: () => void }) {
  const { wallets } = useWallets();
  const wallet = useMemo(
    () => wallets.find((w) => w.standardWallet.name !== "Privy") ?? wallets[0] ?? null,
    [wallets]
  );

  const defaultRoute: DefaultRoute = useMemo(
    () => ({
      ...BASE_ROUTE,
      ...(wallet?.address ? { recipient: wallet.address } : {}),
    }),
    [wallet?.address]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      <div className="swiss-card rounded-lg industrial-screws relative w-full max-w-[400px] card-entrance">
        <div className="flex items-center justify-between px-3.5 pt-3.5 pb-2">
          <div className="flex items-center gap-2">
            <div className="swiss-icon-well flex h-7 w-7 items-center justify-center text-primary">
              <ArrowRightLeft className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold font-display uppercase tracking-widest">
                Cross-Chain Deposit
              </h3>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
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
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rhino-widget-reset">
          <RhinoWidget
            apiKey={RHINO_API_KEY}
            mode="dark"
            theme={widgetTheme}
            defaultRoute={defaultRoute}
            include={INCLUDE_CHAINS}
          />
        </div>
      </div>
    </div>
  );
}

function WidgetSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
        Loading Bridge…
      </p>
    </div>
  );
}
