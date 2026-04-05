import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symbol, side, take_profit, stop_loss, walletAddress, signature, timestamp, expiry_window } = body;

    if (!symbol) {
      return NextResponse.json({ error: "Missing required field: symbol" }, { status: 400 });
    }
    if (!side || (side !== "bid" && side !== "ask")) {
      return NextResponse.json({ error: "Missing or invalid required field: side (bid|ask)" }, { status: 400 });
    }
    if (!walletAddress || !signature) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!timestamp || !expiry_window) {
      return NextResponse.json({ error: "Missing required fields: timestamp, expiry_window" }, { status: 400 });
    }
    if (!take_profit && !stop_loss) {
      return NextResponse.json({ error: "At least one of take_profit or stop_loss required" }, { status: 400 });
    }

    const { setPositionTpSl } = await import("@/lib/pacifica");
    await setPositionTpSl(
      { symbol, side, take_profit, stop_loss },
      { walletAddress, signature, timestamp, expiry_window }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "TP/SL update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
