import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RegisterBody {
  referralCode: string;
  referredWallet: string;
}

export async function POST(request: Request) {
  try {
    const body: RegisterBody = await request.json();
    const { referralCode, referredWallet } = body;

    if (!referralCode || !referredWallet) {
      return NextResponse.json(
        { error: "Missing required fields: referralCode, referredWallet" },
        { status: 400 }
      );
    }

    const existing = await prisma.referral.findUnique({
      where: { referredWallet },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This wallet has already been referred" },
        { status: 409 }
      );
    }

    const referrerTrades = await prisma.trade.findFirst({
      where: {
        walletAddress: {
          startsWith: referralCode.toLowerCase().slice(0, 8),
          mode: "insensitive",
        },
      },
      select: { walletAddress: true },
    });

    const allReferrals = await prisma.referral.findFirst({
      where: { referralCode: { equals: referralCode, mode: "insensitive" } },
      select: { referrerWallet: true },
    });

    const referrerWallet = allReferrals?.referrerWallet ?? referrerTrades?.walletAddress;

    if (!referrerWallet) {
      return NextResponse.json(
        { error: "Invalid referral code — no matching referrer found" },
        { status: 404 }
      );
    }

    if (referrerWallet === referredWallet) {
      return NextResponse.json(
        { error: "Cannot refer yourself" },
        { status: 400 }
      );
    }

    const referral = await prisma.referral.create({
      data: {
        referrerWallet,
        referredWallet,
        referralCode: referralCode.toUpperCase(),
      },
    });

    return NextResponse.json({ referral: { id: referral.id } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to register referral";
    console.error("[referral/register] POST error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
