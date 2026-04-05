"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Trophy,
  User,
  Gift,
  ArrowRightLeft,
  Wallet,
  LogOut,
  Copy,
  Check,
} from "lucide-react";
import { DepositBridgeModal } from "@/components/ui/DepositBridgeModal";
import { AIChatPanel } from "@/components/ui/AIChatPanel";
import { useMarkets } from "@/hooks/useMarkets";
import { usePrivyConfigured } from "@/app/providers";
import { usePrivy, useActiveWallet } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { WalletsDialog } from "@privy-io/react-auth/ui";
import { sendPageview } from "@/lib/fuul";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trade", label: "Trade", icon: TrendingUp },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/referral", label: "Referral", icon: Gift },
] as const;

function SidebarWallet() {
  const configured = usePrivyConfigured();
  const [copied, setCopied] = useState(false);

  if (!configured) return null;

  return <SidebarWalletInner copied={copied} setCopied={setCopied} />;
}

function SidebarWalletInner({
  copied,
  setCopied,
}: {
  copied: boolean;
  setCopied: (v: boolean) => void;
}) {
  const { login, logout, authenticated, ready } = usePrivy();
  const { connect: openWalletDialog, setActiveWallet } = useActiveWallet();
  const { wallets } = useWallets();
  const wallet = useMemo(
    () => wallets.find((w) => w.standardWallet.name !== "Privy") ?? wallets[0] ?? null,
    [wallets]
  );
  const address = wallet?.address ?? null;
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

  useEffect(() => {
    if (wallet) setActiveWallet(wallet as unknown as Parameters<typeof setActiveWallet>[0]);
  }, [wallet, setActiveWallet]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!ready) return null;

  if (authenticated && address) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => openWalletDialog()}
        onKeyDown={(e) => e.key === "Enter" && openWalletDialog()}
        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 bg-surface-muted border border-border rounded-lg hover:bg-surface-elevated transition-colors"
      >
        <Wallet className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="font-mono text-[10px] text-foreground truncate">
          {shortAddress}
        </span>
        <button
          onClick={handleCopy}
          className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
          title="Copy address"
        >
          {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); logout(); }}
          className="ml-auto shrink-0 text-muted-foreground hover:text-danger transition-colors"
          title="Disconnect"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="flex w-full items-center justify-center gap-2 px-4 py-2.5 bg-surface-muted border border-border rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-all"
    >
      <Wallet className="h-3.5 w-3.5" />
      Connect Wallet
    </button>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [showDeposit, setShowDeposit] = useState(false);
  useMarkets();

  useEffect(() => {
    sendPageview();
  }, [pathname]);

  return (
    <>
    <WalletsDialog />
    <div className="flex h-full min-h-dvh flex-col md:flex-row bg-background text-foreground">
      <nav className="hidden md:flex md:w-64 md:flex-col md:h-dvh md:sticky md:top-0 bg-surface border-r border-border relative z-10 shadow-[var(--shadow-neu)]">
        <div className="flex h-8 items-center gap-2 px-4 bg-surface-muted border-b border-border shadow-[var(--shadow-neu-inset-sm)]">
          <span className="led-indicator led-green"></span>
          <span className="font-mono text-[10px] font-bold text-success uppercase tracking-widest">
            SYSTEM ONLINE
          </span>
        </div>

        <div className="flex items-center justify-between h-16 px-4 border-b border-border shadow-[var(--shadow-neu-sm)]">
          <div className="flex items-center gap-2">
            <div className="flat-icon-well w-8 h-8">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-bold uppercase tracking-widest font-mono text-foreground">
              SentimentPerps
            </span>
          </div>
          <div className="industrial-vents">
            <div className="industrial-vent-slot"></div>
            <div className="industrial-vent-slot"></div>
            <div className="industrial-vent-slot"></div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 px-4 pt-6 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-3 rounded-lg px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest transition-all duration-200 ${
                  active
                    ? "bg-primary text-white shadow-[var(--shadow-neu-inset)] shadow-[var(--shadow-neu-glow)]"
                    : "text-muted-foreground shadow-[var(--shadow-neu-sm)] hover:bg-surface-elevated hover:shadow-[var(--shadow-neu)] hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-border shadow-[var(--shadow-neu-inset-sm)] flex flex-col gap-2">
          <SidebarWallet />
          <button
            onClick={() => setShowDeposit(true)}
            className="flat-btn-primary flex w-full items-center justify-center gap-2 px-4 py-3 text-[10px]"
          >
            <ArrowRightLeft className="h-4 w-4" />
            Deposit
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto pb-24 md:pb-0 relative">
        <div className="page-enter h-full" key={pathname}>
          {children}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex bg-surface border-t border-border shadow-[var(--shadow-neu-inset-sm)] md:hidden p-2 gap-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-lg py-2 font-mono text-[10px] font-bold uppercase tracking-widest transition-all duration-200 ${
                active
                  ? "bg-primary text-white shadow-[var(--shadow-neu-glow)]"
                  : "text-muted-foreground shadow-[var(--shadow-neu-sm)] hover:bg-surface-elevated hover:shadow-[var(--shadow-neu)]"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              <span className="text-[8px] sm:text-[10px]">{label}</span>
            </Link>
          );
        })}
      </nav>

      <DepositBridgeModal isOpen={showDeposit} onClose={() => setShowDeposit(false)} />
    </div>
    <AIChatPanel />
    </>
  );
}
