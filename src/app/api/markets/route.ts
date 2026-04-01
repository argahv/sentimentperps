import { NextResponse } from "next/server";
import { getMarkets } from "@/lib/pacifica";

export async function GET() {
  try {
    const data = await getMarkets();
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch markets";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
