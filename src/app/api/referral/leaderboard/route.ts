import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const REFERRAL_REWARD_RATE = 0.10;

export async function GET() {
  try {
    const allReferrals = await prisma.referral.groupBy({
      by: ["referrerWallet"],
      _count: { id: true },
    });

    if (allReferrals.length === 0) {
      return NextResponse.json({ leaderboard: [] });
    }

    const referrerWallets = allReferrals.map((r) => r.referrerWallet);

    const allReferralRows = await prisma.referral.findMany({
      where: { referrerWallet: { in: referrerWallets } },
      select: { referrerWallet: true, referredWallet: true },
    });

    const referrerToReferred = new Map<string, string[]>();
    for (const row of allReferralRows) {
      const existing = referrerToReferred.get(row.referrerWallet) ?? [];
      existing.push(row.referredWallet);
      referrerToReferred.set(row.referrerWallet, existing);
    }

    const allReferredWallets = allReferralRows.map((r) => r.referredWallet);

    const tradeVolumes = await prisma.trade.groupBy({
      by: ["walletAddress"],
      where: { walletAddress: { in: allReferredWallets } },
      _sum: { size: true },
    });

    const volumeMap = new Map(
      tradeVolumes.map((t) => [t.walletAddress, t._sum.size ?? 0])
    );

    const leaderboard = referrerWallets
      .map((wallet) => {
        const referred = referrerToReferred.get(wallet) ?? [];
        const totalVolume = referred.reduce(
          (sum, w) => sum + (volumeMap.get(w) ?? 0),
          0
        );
        const earned = Math.round(totalVolume * REFERRAL_REWARD_RATE * 100) / 100;
        const addr = wallet;
        const shortAddr =
          addr.length > 10 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;

        return {
          address: shortAddr,
          fullAddress: addr,
          referrals: referred.length,
          earned,
        };
      })
      .sort((a, b) => b.earned - a.earned)
      .slice(0, 10);

    return NextResponse.json({ leaderboard });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch referral leaderboard";
    console.error("[referral/leaderboard] GET error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
