/**
 * Server-side Fuul API client for sending conversion events.
 *
 * Uses the Fuul REST API with a `send:trigger_event` API key.
 * This is the authoritative event source — client-side SDK sendEvent
 * is a best-effort duplicate, but this server call is what Fuul
 * expects for custom offchain triggers.
 *
 * @see https://docs.fuul.xyz/developer-guide/sending-custom-events-through-the-api
 */

const FUUL_API_URL = "https://api.fuul.xyz/api/v1/events";

function getFuulTriggerKey(): string | null {
  return process.env.FUUL_TRIGGER_EVENT_KEY ?? null;
}

interface FuulEventParams {
  /** Must match a trigger name configured in Fuul Hub */
  eventName: "trade_open" | "trade_close";
  /** Solana wallet address of the user who performed the action */
  walletAddress: string;
  /** Trade volume in USDC (will be sent as string) */
  volumeUsdc: number;
  /** Additional metadata for analytics (not used for payout calculation) */
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Send a conversion event to Fuul's REST API (server-side).
 *
 * Non-blocking: failures are logged but never thrown.
 * This ensures trade execution is never blocked by Fuul API issues.
 */
export async function sendFuulServerEvent(params: FuulEventParams): Promise<void> {
  const apiKey = getFuulTriggerKey();
  if (!apiKey) {
    console.warn("[Fuul Server] FUUL_TRIGGER_EVENT_KEY not set — skipping event");
    return;
  }

  if (!params.walletAddress || !params.eventName) {
    console.warn("[Fuul Server] Missing walletAddress or eventName — skipping");
    return;
  }

  try {
    // Volume as integer string (USDC with 6 decimals → multiply by 1e6)
    const volumeSmallestUnit = Math.round(params.volumeUsdc * 1e6).toString();

    const body = {
      name: params.eventName,
      user: {
        identifier: params.walletAddress,
        identifier_type: "solana_address",
      },
      args: {
        value: {
          amount: volumeSmallestUnit,
          currency: {
            name: "USD",
          },
        },
        ...(params.metadata && { metadata: params.metadata }),
      },
    };

    const res = await fetch(FUUL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000), // 5s timeout — never block trade flow
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "unknown");
      console.error(
        `[Fuul Server] Event failed: ${res.status} ${errorText} | event=${params.eventName} wallet=${params.walletAddress}`
      );
      return;
    }

    console.log(
      `[Fuul Server] Event sent: ${params.eventName} wallet=${params.walletAddress} volume=$${params.volumeUsdc}`
    );
  } catch (err) {
    // Non-blocking: Fuul tracking failure must NEVER break the trade flow
    console.error("[Fuul Server] sendEvent failed:", err);
  }
}
