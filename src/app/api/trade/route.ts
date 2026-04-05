import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { symbol, side, amount, walletAddress, signature, timestamp, expiry_window, isMarket } = body;
    if (!symbol || !side || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: symbol, side, amount" },
        { status: 400 }
      );
    }
    if (!walletAddress || !signature) {
      return NextResponse.json(
        { error: "Authentication required: walletAddress, signature" },
        { status: 401 }
      );
    }
    if (!timestamp || !expiry_window) {
      return NextResponse.json(
        { error: "Missing required fields: timestamp, expiry_window" },
        { status: 400 }
      );
    }

    if (isMarket) {
      const auth = { walletAddress, signature, timestamp, expiry_window };
      const { createMarketOrder } = await import("@/lib/pacifica");
      const order = await createMarketOrder(
        {
          symbol,
          side,
          amount: String(amount),
          slippage_percent: body.slippage_percent ?? "0.5",
          reduce_only: body.reduce_only ?? false,
        },
        auth
      );
      return NextResponse.json({ order });
    }

    const auth = { walletAddress, signature, timestamp, expiry_window };
    const { createOrder } = await import("@/lib/pacifica");
    const order = await createOrder(
      {
        symbol,
        side,
        price: body.price,
        amount: String(amount),
        tif: body.tif ?? "GTC",
        reduce_only: body.reduce_only ?? false,
      },
      auth
    );

    return NextResponse.json({ order });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Trade execution failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
