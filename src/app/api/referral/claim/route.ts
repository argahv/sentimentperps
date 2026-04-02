import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: "walletAddress required" }, { status: 400 });
    }

    const referrals = await prisma.referral.findMany({
      where: { referrerWallet: walletAddress },
      select: { referredWallet: true },
    });

    if (referrals.length === 0) {
      return NextResponse.json({ error: "No referrals found" }, { status: 404 });
    }

    const referredWallets = referrals.map((r) => r.referredWallet);

    const REFERRAL_REWARD_RATE = 0.10;
    const trades = await prisma.trade.findMany({
      where: { walletAddress: { in: referredWallets }, pnlUsdc: { gt: 0 } },
      select: { pnlUsdc: true },
    });

    const totalEarnings = trades.reduce((sum, t) => sum + t.pnlUsdc * REFERRAL_REWARD_RATE, 0);

    const existingClaims = await prisma.referralClaim.findMany({
      where: { walletAddress },
      select: { amount: true },
    });
    const alreadyClaimed = existingClaims.reduce((sum, c) => sum + c.amount, 0);
    const claimableAmount = Math.round((totalEarnings - alreadyClaimed) * 100) / 100;

    if (claimableAmount <= 0) {
      return NextResponse.json({ error: "No rewards available to claim" }, { status: 400 });
    }

    const claim = await prisma.referralClaim.create({
      data: {
        walletAddress,
        amount: claimableAmount,
        status: "pending",
      },
    });

    return NextResponse.json({
      claim: {
        id: claim.id,
        amount: claim.amount,
        status: claim.status,
        createdAt: claim.createdAt.toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create claim";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json({ error: "wallet parameter required" }, { status: 400 });
    }

    const claims = await prisma.referralClaim.findMany({
      where: { walletAddress: wallet },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      claims: claims.map((c) => ({
        id: c.id,
        amount: c.amount,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch claims";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
