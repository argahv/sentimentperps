"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import {
  Copy,
  Check,
  Share2,
  Users,
  DollarSign,
  Gift,
  LogIn,
  ExternalLink,
} from "lucide-react";
import { useState, useMemo } from "react";

interface ReferralStats {
  totalReferred: number;
  activeTradors: number;
  totalEarned: number;
  pendingRewards: number;
}

const DEMO_STATS: ReferralStats = {
  totalReferred: 12,
  activeTradors: 7,
  totalEarned: 156.42,
  pendingRewards: 23.10,
};

const DEMO_REFERRALS = [
  { address: "8xPq...dF4k", joinedAt: "2026-03-28", trades: 14, earned: 34.20 },
  { address: "3jRm...xP2s", joinedAt: "2026-03-25", trades: 8, earned: 18.50 },
  { address: "9kLn...wQ7r", joinedAt: "2026-03-22", trades: 22, earned: 52.30 },
  { address: "5vMx...bR9t", joinedAt: "2026-03-20", trades: 3, earned: 8.12 },
  { address: "7wNz...cS1u", joinedAt: "2026-03-18", trades: 11, earned: 28.90 },
];

export default function ReferralContent() {
  const { login, authenticated, ready: privyReady } = usePrivy();
  const { wallets } = useWallets();
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const wallet = useMemo(
    () => wallets.find((w) => w.standardWallet.name === "Privy") ?? wallets[0] ?? null,
    [wallets]
  );

  const address = wallet?.address ?? null;
  const referralCode = address ? address.slice(0, 8).toUpperCase() : "SENTPERPS";
  const referralLink = `https://sentimentperps.xyz/ref/${referralCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (privyReady && !authenticated) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <div className="neu-icon-well flex h-16 w-16 items-center justify-center rounded-2xl text-primary">
          <Share2 className="h-8 w-8" />
        </div>
        <h2 className="font-display text-lg font-semibold">Connect to access referrals</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Connect your wallet to get your referral link and start earning rewards.
        </p>
        <button
          onClick={login}
          className="neu-btn flex items-center gap-2 rounded-2xl bg-primary px-6 py-2.5 text-sm font-semibold text-white"
        >
          <LogIn className="h-4 w-4" />
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Referral Program</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Share your link, earn rewards when friends trade. Powered by Fuul.
        </p>
      </div>

      <div className="neu-extruded rounded-[32px] bg-primary/5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Your Referral Link</p>
            <p className="text-sm font-mono text-foreground break-all">{referralLink}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="neu-btn flex items-center gap-1.5 rounded-2xl bg-background px-3 py-2 text-xs font-medium"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedLink ? "Copied" : "Copy Link"}
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <p className="text-xs text-muted-foreground">Referral Code:</p>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 neu-inset-sm rounded-xl px-2 py-0.5 text-xs font-mono font-bold text-primary transition-colors"
          >
            {referralCode}
            {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="neu-extruded-sm flex items-center gap-3 rounded-2xl bg-background p-4">
          <div className="neu-icon-well flex h-10 w-10 items-center justify-center rounded-xl text-primary shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Referred</p>
            <p className="text-lg font-bold">{DEMO_STATS.totalReferred}</p>
          </div>
        </div>
        <div className="neu-extruded-sm flex items-center gap-3 rounded-2xl bg-background p-4">
          <div className="neu-icon-well flex h-10 w-10 items-center justify-center rounded-xl text-success shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-lg font-bold">{DEMO_STATS.activeTradors}</p>
          </div>
        </div>
        <div className="neu-extruded-sm flex items-center gap-3 rounded-2xl bg-background p-4">
          <div className="neu-icon-well flex h-10 w-10 items-center justify-center rounded-xl text-amber-500 shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Earned</p>
            <p className="text-lg font-bold text-success">${DEMO_STATS.totalEarned}</p>
          </div>
        </div>
        <div className="neu-extruded-sm flex items-center gap-3 rounded-2xl bg-background p-4">
          <div className="neu-icon-well flex h-10 w-10 items-center justify-center rounded-xl text-orange-500 shrink-0">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-lg font-bold">${DEMO_STATS.pendingRewards}</p>
          </div>
        </div>
      </div>

      <div className="neu-extruded rounded-[32px] bg-background overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <h3 className="text-sm font-semibold">Referred Users</h3>
          <a
            href="https://app.fuul.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            View on Fuul <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div className="px-1">
          {DEMO_REFERRALS.map((ref) => (
            <div key={ref.address} className="flex items-center justify-between px-4 py-3 mx-1 mb-1 rounded-xl transition-colors hover:bg-background/80">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-mono font-medium">{ref.address}</span>
                <span className="text-[10px] text-muted-foreground">
                  Joined {ref.joinedAt} | {ref.trades} trades
                </span>
              </div>
              <span className="text-sm font-semibold text-success">+${ref.earned}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="neu-extruded-sm rounded-2xl bg-background p-4">
        <h3 className="text-sm font-semibold mb-2">How it Works</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex gap-3">
            <div className="neu-extruded-sm flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shrink-0">
              1
            </div>
            <div>
              <p className="text-xs font-medium">Share your link</p>
              <p className="text-[10px] text-muted-foreground">Send to friends or post on social</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="neu-extruded-sm flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shrink-0">
              2
            </div>
            <div>
              <p className="text-xs font-medium">Friends trade</p>
              <p className="text-[10px] text-muted-foreground">They sign up and start trading perps</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="neu-extruded-sm flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shrink-0">
              3
            </div>
            <div>
              <p className="text-xs font-medium">Earn rewards</p>
              <p className="text-[10px] text-muted-foreground">Get a share of trading fees via Fuul</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
