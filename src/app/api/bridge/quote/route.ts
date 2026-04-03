import { NextResponse } from "next/server";
import { getPublicQuote } from "@/lib/rhino";
import type { BridgeQuoteParams } from "@/lib/rhino";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { token, chainIn, chainOut, amount } = body as Partial<BridgeQuoteParams>;

    if (!token || !chainIn || !chainOut || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: token, chainIn, chainOut, amount" },
        { status: 400 }
      );
    }

    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: "amount must be a positive number" },
        { status: 400 }
      );
    }

    const quote = await getPublicQuote({ token, chainIn, chainOut, amount });
    return NextResponse.json(quote);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch bridge quote";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
