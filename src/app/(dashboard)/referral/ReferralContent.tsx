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
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useState, useMemo, useCallback, useEffect } from "react";
import { EarningsProjection } from "@/components/ui/EarningsProjection";
import { ReferralLeaderboard } from "@/components/ui/ReferralLeaderboard";
import { ShareCardPreview } from "@/components/ui/ShareCardPreview";

interface ReferralStats {
  totalReferred: number;
  activeTraders: number;
  totalEarned: number;
  pendingRewards: number;
}

interface ActivityEntry {
  address: string;
  fullAddress: string;
  joinedAt: string;
  trades: number;
  earned: number;
  recentEarned: number;
}

interface LeaderboardEntry {
  address: string;
  fullAddress: string;
  referrals: number;
  earned: number;
}

const EMPTY_STATS: ReferralStats = {
  totalReferred: 0,
  activeTraders: 0,
  totalEarned: 0,
  pendingRewards: 0,
};

export default function ReferralContent() {
  const { login, authenticated, ready: privyReady } = usePrivy();
  const { wallets } = useWallets();
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [stats, setStats] = useState<ReferralStats>(EMPTY_STATS);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wallet = useMemo(
    () => wallets.find((w) => w.standardWallet.name === "Privy") ?? wallets[0] ?? null,
    [wallets]
  );

  const address = wallet?.address ?? null;
  const referralCode = address ? address.slice(0, 8).toUpperCase() : "SENTPERPS";
  const referralLink = `https://sentimentperps.xyz/ref/${referralCode}`;

  const fetchData = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const [statsRes, lbRes] = await Promise.all([
        fetch(`/api/referral/stats?wallet=${encodeURIComponent(address)}`),
        fetch("/api/referral/leaderboard"),
      ]);

      if (!statsRes.ok) {
        const d = await statsRes.json();
        throw new Error(d.error ?? "Failed to load referral stats");
      }
      if (!lbRes.ok) {
        const d = await lbRes.json();
        throw new Error(d.error ?? "Failed to load leaderboard");
      }

      const statsData = await statsRes.json();
      const lbData = await lbRes.json();

      setStats(statsData.stats);
      setActivity(statsData.activity);
      setLeaderboard(lbData.leaderboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (address) fetchData();
  }, [address, fetchData]);

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
      <div className="flex flex-col items-center justify-center gap-4 p-12 page-enter">
        <div className="neu-icon-well flex h-16 w-16 items-center justify-center rounded-2xl text-primary">
          <Share2 className="h-8 w-8" />
        </div>
        <h2 className="font-display text-lg font-semibold">Connect to access referrals</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Connect your wallet to get your referral link and start earning rewards.
        </p>
        <button
          onClick={login}
          className="neu-btn flex items-center gap-2 rounded-2xl bg-primary px-6 py-2.5 text-sm font-semibold text-white btn-bounce"
        >
          <LogIn className="h-4 w-4" />
          Connect Wallet
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-3 p-4 lg:p-6 page-enter">
        <div className="flex items-center justify-between card-entrance" style={{ animationDelay: "0ms" }}>
          <div>
            <h1 className="font-display text-2xl font-bold">Referral Program</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Share your link, earn rewards when friends trade. Powered by Fuul.
            </p>
          </div>
        </div>
        <div className="neu-extruded rounded-[32px] bg-background p-8 flex flex-col items-center gap-4">
          <AlertCircle className="h-10 w-10 text-danger" />
          <p className="text-sm text-muted-foreground text-center max-w-sm">{error}</p>
          <button
            onClick={fetchData}
            className="neu-btn flex items-center gap-2 rounded-2xl bg-primary px-5 py-2 text-sm font-semibold text-white btn-bounce"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 lg:p-6 page-enter">
      <div className="flex items-center justify-between card-entrance" style={{ animationDelay: "0ms" }}>
        <div>
          <h1 className="font-display text-2xl font-bold">Referral Program</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Share your link, earn rewards when friends trade. Powered by Fuul.
          </p>
        </div>
        <a
          href="https://app.fuul.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="neu-btn flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Fuul Dashboard <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div
        className="neu-extruded rounded-[32px] bg-primary/5 p-5 card-entrance"
        style={{ animationDelay: "calc(1 * var(--stagger-base))" }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground mb-1">Your Referral Link</p>
            <p className="text-sm font-mono text-foreground break-all">{referralLink}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="neu-btn flex items-center gap-1.5 rounded-2xl bg-background px-3 py-2 text-xs font-medium btn-bounce"
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

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {loading ? (
              <>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="neu-extruded-sm rounded-2xl bg-background p-4 card-entrance"
                    style={{ animationDelay: `calc(${i + 2} * var(--stagger-base))` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-muted-foreground/10 animate-pulse" />
                      <div className="flex flex-col gap-1.5">
                        <div className="h-3 w-12 rounded bg-muted-foreground/10 animate-pulse" />
                        <div className="h-5 w-8 rounded bg-muted-foreground/10 animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div
                  className="neu-extruded-sm flex items-center gap-3 rounded-2xl bg-background p-4 card-entrance"
                  style={{ animationDelay: "calc(2 * var(--stagger-base))" }}
                >
                  <div className="neu-icon-well flex h-10 w-10 items-center justify-center rounded-xl text-primary shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Referred</p>
                    <p className="text-lg font-bold tabular-nums">{stats.totalReferred}</p>
                  </div>
                </div>
                <div
                  className="neu-extruded-sm flex items-center gap-3 rounded-2xl bg-background p-4 card-entrance"
                  style={{ animationDelay: "calc(3 * var(--stagger-base))" }}
                >
                  <div className="neu-icon-well flex h-10 w-10 items-center justify-center rounded-xl text-success shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Active</p>
                    <p className="text-lg font-bold tabular-nums">{stats.activeTraders}</p>
                  </div>
                </div>
                <div
                  className="neu-extruded-sm flex items-center gap-3 rounded-2xl bg-background p-4 card-entrance"
                  style={{ animationDelay: "calc(4 * var(--stagger-base))" }}
                >
                  <div className="neu-icon-well flex h-10 w-10 items-center justify-center rounded-xl text-amber-500 shrink-0">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Earned</p>
                    <p className="text-lg font-bold text-success tabular-nums">${stats.totalEarned}</p>
                  </div>
                </div>
                <div
                  className="neu-extruded-sm flex items-center gap-3 rounded-2xl bg-background p-4 card-entrance"
                  style={{ animationDelay: "calc(5 * var(--stagger-base))" }}
                >
                  <div className="neu-icon-well flex h-10 w-10 items-center justify-center rounded-xl text-orange-500 shrink-0">
                    <Gift className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="text-lg font-bold tabular-nums">${stats.pendingRewards}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div
            className="neu-extruded rounded-[32px] bg-background overflow-hidden card-entrance"
            style={{ animationDelay: "calc(6 * var(--stagger-base))" }}
          >
            <div className="flex items-center justify-between px-5 py-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Activity Timeline
              </h3>
              <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
                {activity.length} referrals
              </span>
            </div>
            <div className="px-5 pb-5">
              {loading ? (
                <div className="flex flex-col gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="h-[30px] w-[30px] shrink-0 flex items-center justify-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20 animate-pulse" />
                      </div>
                      <div className="flex-1 neu-extruded-sm rounded-2xl bg-background p-4">
                        <div className="flex justify-between">
                          <div className="flex flex-col gap-1.5">
                            <div className="h-4 w-24 rounded bg-muted-foreground/10 animate-pulse" />
                            <div className="h-3 w-16 rounded bg-muted-foreground/10 animate-pulse" />
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="h-4 w-14 rounded bg-muted-foreground/10 animate-pulse" />
                            <div className="h-3 w-10 rounded bg-muted-foreground/10 animate-pulse" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activity.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Users className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground text-center">
                    No referrals yet. Share your link to get started!
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-primary/20" />
                  {activity.map((ref, idx) => (
                    <div
                      key={ref.fullAddress}
                      className="relative flex gap-4 pb-5 last:pb-0 card-entrance"
                      style={{ animationDelay: `calc(${idx + 7} * var(--stagger-base))` }}
                    >
                      <div className="relative z-10 shrink-0 flex h-[30px] w-[30px] items-center justify-center">
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${ref.trades > 5 ? "bg-primary" : "bg-gray-400 opacity-50"}`}
                        />
                      </div>
                      <div className="flex-1 neu-extruded-sm rounded-2xl bg-background p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-mono font-medium">{ref.address}</span>
                          <span className="text-[10px] text-muted-foreground">Joined {ref.joinedAt}</span>
                        </div>
                        <div className="flex flex-col sm:items-end gap-1">
                          <span className="text-sm font-semibold text-success tabular-nums">
                            +${ref.earned.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {ref.trades} trades
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className="w-full lg:w-[300px] xl:w-[320px] shrink-0 flex flex-col gap-3 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-88px)] lg:overflow-y-auto card-entrance"
          style={{ animationDelay: "calc(2 * var(--stagger-base))" }}
        >
          <div className="card-entrance" style={{ animationDelay: "calc(6 * var(--stagger-base))" }}>
            <EarningsProjection
              currentEarnings={stats.totalEarned}
              referralCount={stats.totalReferred}
            />
          </div>

          <div className="card-entrance" style={{ animationDelay: "calc(7 * var(--stagger-base))" }}>
            <ReferralLeaderboard currentUserAddress={address} leaderboard={leaderboard} />
          </div>

          <div
            className="neu-extruded rounded-[32px] bg-background p-5 card-entrance"
            style={{ animationDelay: "calc(8 * var(--stagger-base))" }}
          >
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Share2 className="h-4 w-4 text-primary" />
              How it Works
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3 items-start">
                <div className="neu-extruded-sm flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shrink-0">
                  1
                </div>
                <div>
                  <p className="text-xs font-medium">Share your link</p>
                  <p className="text-[10px] text-muted-foreground">Send to friends or post on social</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="neu-extruded-sm flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shrink-0">
                  2
                </div>
                <div>
                  <p className="text-xs font-medium">Friends trade</p>
                  <p className="text-[10px] text-muted-foreground">They sign up and start trading perps</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
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

          <div className="card-entrance" style={{ animationDelay: "calc(9 * var(--stagger-base))" }}>
            <ShareCardPreview
              referralCode={referralCode}
              totalEarnings={stats.totalEarned}
              referralCount={stats.totalReferred}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
