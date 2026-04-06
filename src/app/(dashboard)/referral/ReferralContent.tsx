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
  ArrowDownToLine,
  Clock,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { EarningsProjection } from "@/components/ui/EarningsProjection";
import { ReferralLeaderboard } from "@/components/ui/ReferralLeaderboard";
import { ShareCardPreview } from "@/components/ui/ShareCardPreview";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { generateTrackingLink, identifyUser } from "@/lib/fuul";
import type { UserPointsMovement, StatsBreakdownResult } from "@/lib/fuul";
import type { ClaimCheckTotalItem } from "@/lib/fuul";
import {
  useFuulStats,
  useFuulLeaderboard,
  useFuulClaims,
  useFuulActivity,
  useFuulEarningsBreakdown,
} from "@/hooks/useFuulData";

export default function ReferralContent() {
  const { login, authenticated, ready: privyReady } = usePrivy();
  const { wallets } = useWallets();
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const wallet = useMemo(
    () => wallets.find((w) => w.standardWallet.name !== "Privy") ?? wallets[0] ?? null,
    [wallets]
  );

  const address = wallet?.address ?? null;
  const referralCode = address ? address.slice(0, 8).toUpperCase() : "SENTPERPS";
  const referralLink = `https://sentimentperps.xyz/ref/${referralCode}`;

  const [fuulLink, setFuulLink] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    identifyUser(address);
    generateTrackingLink(address).then((link) => {
      if (link) setFuulLink(link);
    });
  }, [address]);

  const activeCopyLink = fuulLink ?? referralLink;

  const fuulStats = useFuulStats(address);
  const fuulLeaderboard = useFuulLeaderboard();
  const fuulClaims = useFuulClaims(address);
  const fuulActivity = useFuulActivity(address);
  const fuulBreakdown = useFuulEarningsBreakdown(address);

  const stats = useMemo(() => {
    if (!fuulStats.data) {
      return { totalReferred: 0, activeTraders: 0, totalEarned: 0, pendingRewards: 0 };
    }
    const totalEarnings = fuulStats.data.total_earnings
      ? fuulStats.data.total_earnings.reduce((sum: number, e: { amount?: number }) => sum + (e.amount ?? 0), 0)
      : 0;
    const pendingRewards = fuulClaims.totals?.unclaimed
      ? fuulClaims.totals.unclaimed.reduce((sum: number, item: { amount?: string }) => sum + parseFloat(item.amount ?? "0"), 0)
      : 0;
    return {
      totalReferred: fuulStats.data.referred_users ?? 0,
      activeTraders: fuulStats.data.referred_users ?? 0,
      totalEarned: Math.round(totalEarnings * 100) / 100,
      pendingRewards: Math.round(pendingRewards * 100) / 100,
    };
  }, [fuulStats.data, fuulClaims.totals]);

  const loading = fuulStats.loading || fuulLeaderboard.loading;
  const error = fuulStats.error ?? fuulLeaderboard.error ?? null;

  const handleRefetchAll = () => {
    fuulStats.refetch();
    fuulLeaderboard.refetch();
    fuulClaims.refetch();
    fuulActivity.refetch();
    fuulBreakdown.refetch();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activeCopyLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const activityEntries: UserPointsMovement[] = fuulActivity.data?.results ?? [];

  const leaderboardEntries = fuulLeaderboard.data?.results ?? [];

  const breakdownData = fuulBreakdown.data?.results?.map((r: StatsBreakdownResult) => ({
    date: r.date,
    earnings: r.earnings ?? 0,
    volume: r.r1_volume ?? 0,
  }));

  if (privyReady && !authenticated) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 page-enter">
        <div className="swiss-icon-well flex h-16 w-16 items-center justify-center text-primary">
          <Share2 className="h-8 w-8" />
        </div>
        <h2 className="font-display text-lg font-semibold">Connect to access referrals</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Connect your wallet to get your referral link and start earning rewards.
        </p>
        <button
          onClick={login}
          className="swiss-btn-accent flex items-center gap-2 bg-primary px-6 py-2.5 text-sm font-semibold text-white"
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
        <div className="border-2 border-border-muted bg-surface p-8 flex flex-col items-center gap-4">
          <AlertCircle className="h-10 w-10 text-danger" />
          <p className="text-sm text-muted-foreground text-center max-w-sm">{error}</p>
          <button
            onClick={handleRefetchAll}
            className="swiss-btn-accent flex items-center gap-2 bg-primary px-5 py-2 text-sm font-semibold text-white"
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
          href="https://hub.fuul.xyz/sentimentperps"
          target="_blank"
          rel="noopener noreferrer"
          className="swiss-btn-outline flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Rewards Hub <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div
        className="border-2 border-border-muted bg-primary/5 p-5 card-entrance"
        style={{ animationDelay: "calc(1 * var(--stagger-base))" }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-widest">Your Referral Link</p>
            <p className="text-sm font-mono text-foreground break-all">{activeCopyLink}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="swiss-btn-outline flex items-center gap-1.5 bg-surface px-3 py-2 text-xs font-medium"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedLink ? "Copied" : "Copy Link"}
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Referral Code:</p>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 border border-border-muted bg-surface px-2 py-0.5 text-xs font-mono font-bold text-primary transition-colors"
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
                    className="border border-border-muted bg-surface p-4 card-entrance"
                    style={{ animationDelay: `calc(${i + 2} * var(--stagger-base))` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-muted-foreground/10 animate-pulse" />
                      <div className="flex flex-col gap-1.5">
                        <div className="h-3 w-12 bg-muted-foreground/10 animate-pulse" />
                        <div className="h-5 w-8 bg-muted-foreground/10 animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div
                   className="border border-border-muted bg-surface flex items-center gap-3 p-4 card-entrance"
                   style={{ animationDelay: "calc(2 * var(--stagger-base))" }}
                 >
                   <div className="swiss-icon-well flex h-10 w-10 items-center justify-center text-primary shrink-0">
                     <Users className="h-5 w-5" />
                   </div>
                   <div>
                     <p className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                       Referred
                       <InfoTooltip content="Total number of users who signed up using your referral link." size={12} />
                     </p>
                     <p className="text-lg font-bold tabular-nums">{stats.totalReferred}</p>
                   </div>
                 </div>
                <div
                   className="border border-border-muted bg-surface flex items-center gap-3 p-4 card-entrance"
                   style={{ animationDelay: "calc(3 * var(--stagger-base))" }}
                 >
                   <div className="swiss-icon-well flex h-10 w-10 items-center justify-center text-success shrink-0">
                     <Users className="h-5 w-5" />
                   </div>
                   <div>
                     <p className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                       Active
                       <InfoTooltip content="Referred users who have made at least one trade in the current period." size={12} />
                     </p>
                     <p className="text-lg font-bold tabular-nums">{stats.activeTraders}</p>
                   </div>
                 </div>
                <div
                   className="border border-border-muted bg-surface flex items-center gap-3 p-4 card-entrance"
                   style={{ animationDelay: "calc(4 * var(--stagger-base))" }}
                 >
                   <div className="swiss-icon-well flex h-10 w-10 items-center justify-center text-amber-500 shrink-0">
                     <DollarSign className="h-5 w-5" />
                   </div>
                   <div>
                     <p className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                       Earned
                       <InfoTooltip content="Total referral rewards you have earned to date, in USD." size={12} />
                     </p>
                     <p className="text-lg font-bold text-success tabular-nums">${stats.totalEarned}</p>
                   </div>
                 </div>
                <div
                   className="border border-border-muted bg-surface flex items-center gap-3 p-4 card-entrance"
                   style={{ animationDelay: "calc(5 * var(--stagger-base))" }}
                 >
                   <div className="swiss-icon-well flex h-10 w-10 items-center justify-center text-orange-500 shrink-0">
                     <Gift className="h-5 w-5" />
                   </div>
                   <div>
                     <p className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                       Pending
                       <InfoTooltip content="Referral rewards awaiting settlement. These will become claimable after the verification period." size={12} />
                     </p>
                     <p className="text-lg font-bold tabular-nums">${stats.pendingRewards}</p>
                   </div>
                 </div>
              </>
            )}
          </div>

          <div
            className="border-2 border-border-muted bg-surface overflow-hidden card-entrance"
            style={{ animationDelay: "calc(6 * var(--stagger-base))" }}
          >
            <div className="flex items-center justify-between px-5 py-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 uppercase tracking-widest">
                <Users className="h-4 w-4 text-primary" />
                Activity Timeline
              </h3>
              <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
                {activityEntries.length} events
              </span>
            </div>
            <div className="px-5 pb-5">
              {fuulActivity.loading ? (
                <div className="flex flex-col gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="h-[30px] w-[30px] shrink-0 flex items-center justify-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/20 animate-pulse" />
                      </div>
                      <div className="flex-1 border border-border-muted bg-surface p-4">
                        <div className="flex justify-between">
                          <div className="flex flex-col gap-1.5">
                            <div className="h-4 w-24 bg-muted-foreground/10 animate-pulse" />
                            <div className="h-3 w-16 bg-muted-foreground/10 animate-pulse" />
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="h-4 w-14 bg-muted-foreground/10 animate-pulse" />
                            <div className="h-3 w-10 bg-muted-foreground/10 animate-pulse" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activityEntries.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Users className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground text-center">
                    No referrals yet. Share your link to get started!
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-primary/20" />
                  {activityEntries.map((entry, idx) => {
                    const isActive = entry.payout_status === "paid" || entry.payout_status === "completed";
                    const formattedDate = entry.date
                      ? new Date(entry.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—";
                    const earned = parseFloat(entry.total_amount ?? "0");
                    return (
                      <div
                        key={entry.conversion_id ?? idx}
                        className="relative flex gap-4 pb-5 last:pb-0 card-entrance"
                        style={{ animationDelay: `calc(${idx + 7} * var(--stagger-base))` }}
                      >
                        <div className="relative z-10 shrink-0 flex h-[30px] w-[30px] items-center justify-center">
                          <div
                            className={`h-2.5 w-2.5 rounded-full ${isActive ? "bg-primary" : "bg-muted-foreground opacity-50"}`}
                          />
                        </div>
                        <div className="flex-1 border border-border-muted bg-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-mono font-medium">
                              {entry.conversion_name ?? entry.project_name ?? "Referral Event"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{formattedDate}</span>
                          </div>
                          <div className="flex flex-col sm:items-end gap-1">
                            <span className="text-sm font-semibold text-success tabular-nums">
                              +{earned.toFixed(4)}
                            </span>
                            <span
                              className={`text-[9px] font-semibold px-1.5 py-0.5 border ${
                                entry.payout_status === "paid" || entry.payout_status === "completed"
                                  ? "border-success/40 text-success bg-success/10"
                                  : entry.payout_status === "pending"
                                    ? "border-warning/40 text-warning bg-warning/10"
                                    : "border-border-muted text-muted-foreground bg-surface-elevated"
                              }`}
                            >
                              {entry.payout_status ?? "pending"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className="w-full lg:w-[300px] xl:w-[320px] shrink-0 flex flex-col gap-3 lg:sticky lg:top-20 lg:overflow-y-auto max-h-screen card-entrance"
          style={{ animationDelay: "calc(2 * var(--stagger-base))" }}
        >
          <div className="card-entrance" style={{ animationDelay: "calc(6 * var(--stagger-base))" }}>
            <EarningsProjection
              currentEarnings={stats.totalEarned}
              referralCount={stats.totalReferred}
              breakdownData={breakdownData}
            />
          </div>

          <div className="card-entrance" style={{ animationDelay: "calc(7 * var(--stagger-base))" }}>
            <ReferralLeaderboard
              currentUserAddress={address}
              entries={leaderboardEntries}
            />
          </div>

          <div
            className="border-2 border-border-muted bg-surface p-5 flex flex-col gap-3 card-entrance"
            style={{ animationDelay: "calc(7.5 * var(--stagger-base))" }}
          >
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold font-display uppercase tracking-widest">Claim Rewards</span>
            </div>

            <div className="border border-border-muted bg-surface px-3 py-3 flex flex-col items-center gap-2">
               <p className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                 Available to Claim
                 <InfoTooltip content="Rewards that have been verified and are ready to be claimed to your wallet." size={10} />
               </p>
               <p className="text-xl font-bold text-success tabular-nums">
                 ${Math.max(0, stats.pendingRewards).toFixed(2)}
               </p>
             </div>

            <button
              onClick={fuulClaims.claimAll}
              disabled={fuulClaims.claiming || stats.pendingRewards <= 0}
              className={`swiss-btn-accent flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                stats.pendingRewards > 0
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "bg-surface-elevated text-muted-foreground cursor-not-allowed"
              }`}
            >
              <ArrowDownToLine className={`h-4 w-4 ${fuulClaims.claiming ? "animate-bounce" : ""}`} />
              {fuulClaims.claiming ? "Claiming..." : "Claim Rewards"}
            </button>

            {fuulClaims.claimResult && (
              <p className="text-xs text-success text-center font-medium">
                Claim initiated — check your wallet
              </p>
            )}
            {fuulClaims.claimError && (
              <p className="text-xs text-danger text-center font-medium">{fuulClaims.claimError}</p>
            )}

            {fuulClaims.totals?.claimed && fuulClaims.totals.claimed.length > 0 && (
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
                    Claim History
                  </span>
                </div>
                {fuulClaims.totals.claimed.slice(0, 5).map((item: ClaimCheckTotalItem, idx: number) => (
                  <div
                    key={`${item.currency_address ?? ""}-${idx}`}
                    className="border border-border-muted bg-surface px-3 py-2 flex items-center justify-between"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-success tabular-nums">
                        +{parseFloat(item.amount ?? "0").toFixed(4)} {item.currency_name ?? ""}
                      </span>
                      <span className="text-[9px] text-muted-foreground tabular-nums">
                        {item.currency_name ?? "Tokens"}
                      </span>
                    </div>
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 border border-success/40 text-success bg-success/10">
                      claimed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            className="border-2 border-border-muted bg-surface p-5 card-entrance"
            style={{ animationDelay: "calc(8 * var(--stagger-base))" }}
          >
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 uppercase tracking-widest">
              <Share2 className="h-4 w-4 text-primary" />
              How it Works
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3 items-start">
                <div className="border border-border-muted bg-primary flex h-6 w-6 items-center justify-center text-xs font-bold text-white shrink-0">
                  1
                </div>
                <div>
                  <p className="text-xs font-medium">Share your link</p>
                  <p className="text-[10px] text-muted-foreground">Send to friends or post on social</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="border border-border-muted bg-primary flex h-6 w-6 items-center justify-center text-xs font-bold text-white shrink-0">
                  2
                </div>
                <div>
                  <p className="text-xs font-medium">Friends trade</p>
                  <p className="text-[10px] text-muted-foreground">They sign up and start trading perps</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="border border-border-muted bg-primary flex h-6 w-6 items-center justify-center text-xs font-bold text-white shrink-0">
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
