import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json({ error: "wallet parameter required" }, { status: 400 });
    }

    const badges = await prisma.badge.findMany({
      where: { walletAddress: wallet },
      orderBy: { createdAt: "desc" },
      select: { badgeType: true, createdAt: true },
    });

    return NextResponse.json({
      badges: badges.map((b) => ({
        badgeType: b.badgeType,
        earnedAt: b.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch badges";
    if (
      message.includes("localhost") ||
      message.includes("5432") ||
      message.includes("ECONNREFUSED") ||
      message.includes("Can't reach") ||
      message.includes("connect")
    ) {
      return NextResponse.json({ badges: [] });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
