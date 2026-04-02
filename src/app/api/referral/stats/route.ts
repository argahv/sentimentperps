import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const REFERRAL_REWARD_RATE = 0.10;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json(
        { error: "Missing required parameter: wallet" },
        { status: 400 }
      );
    }

    const referrals = await prisma.referral.findMany({
      where: { referrerWallet: wallet },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        referredWallet: true,
        createdAt: true,
      },
    });

    const totalReferred = referrals.length;

    if (totalReferred === 0) {
      return NextResponse.json({
        stats: {
          totalReferred: 0,
          activeTraders: 0,
          totalEarned: 0,
          pendingRewards: 0,
        },
        activity: [],
      });
    }

    const referredWallets = referrals.map((r) => r.referredWallet);

    const tradesByReferred = await prisma.trade.groupBy({
      by: ["walletAddress"],
      where: { walletAddress: { in: referredWallets } },
      _count: { id: true },
      _sum: { size: true },
    });

    const tradeMap = new Map(
      tradesByReferred.map((t) => [
        t.walletAddress,
        { trades: t._count.id, volume: t._sum.size ?? 0 },
      ])
    );

    const activeTraders = tradesByReferred.filter((t) => t._count.id > 0).length;
    const totalVolume = tradesByReferred.reduce((sum, t) => sum + (t._sum.size ?? 0), 0);
    const totalEarned = Math.round(totalVolume * REFERRAL_REWARD_RATE * 100) / 100;

    const recentTrades = await prisma.trade.groupBy({
      by: ["walletAddress"],
      where: {
        walletAddress: { in: referredWallets },
        closedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      _sum: { size: true },
    });

    const recentVolumeMap = new Map(
      recentTrades.map((t) => [t.walletAddress, t._sum.size ?? 0])
    );

    const pendingVolume = recentTrades.reduce((sum, t) => sum + (t._sum.size ?? 0), 0);
    const pendingRewards = Math.round(pendingVolume * REFERRAL_REWARD_RATE * 100) / 100;

    const activity = referrals.map((ref) => {
      const data = tradeMap.get(ref.referredWallet);
      const recentVolume = recentVolumeMap.get(ref.referredWallet) ?? 0;
      const addr = ref.referredWallet;
      const shortAddr =
        addr.length > 10 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;

      return {
        address: shortAddr,
        fullAddress: addr,
        joinedAt: ref.createdAt.toISOString().split("T")[0],
        trades: data?.trades ?? 0,
        earned: Math.round((data?.volume ?? 0) * REFERRAL_REWARD_RATE * 100) / 100,
        recentEarned: Math.round(recentVolume * REFERRAL_REWARD_RATE * 100) / 100,
      };
    });

    return NextResponse.json({
      stats: {
        totalReferred,
        activeTraders,
        totalEarned,
        pendingRewards,
      },
      activity,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch referral stats";
    console.error("[referral/stats] GET error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
