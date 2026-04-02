import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeLevel } from "@/lib/badges";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json({ error: "wallet parameter required" }, { status: 400 });
    }

    const progress = await prisma.userProgress.findUnique({
      where: { walletAddress: wallet },
    });

    const xp = progress?.xp ?? 0;
    const levelInfo = computeLevel(xp);

    return NextResponse.json({
      xp,
      level: levelInfo.level,
      levelName: levelInfo.name,
      xpForCurrent: levelInfo.xpForCurrent,
      xpForNext: levelInfo.xpForNext,
      progress: Math.round(levelInfo.progress * 100),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch XP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
