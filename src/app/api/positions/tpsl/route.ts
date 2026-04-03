import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symbol, takeProfit, stopLoss, walletAddress, signature, timestamp, expiry_window, type } = body;

    if (!symbol) {
      return NextResponse.json({ error: "Missing required field: symbol" }, { status: 400 });
    }
    if (!walletAddress || !signature) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!timestamp || !expiry_window) {
      return NextResponse.json({ error: "Missing signing fields: timestamp, expiry_window" }, { status: 400 });
    }
    if (!type) {
      return NextResponse.json({ error: "Missing type field (should be set_position_tpsl)" }, { status: 400 });
    }
    if (takeProfit === undefined && stopLoss === undefined) {
      return NextResponse.json({ error: "At least one of takeProfit or stopLoss required" }, { status: 400 });
    }

    const { setPositionTpSl } = await import("@/lib/pacifica");
    await setPositionTpSl(
      { symbol, takeProfit, stopLoss },
      { walletAddress, signature, timestamp, expiry_window, type }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "TP/SL update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
