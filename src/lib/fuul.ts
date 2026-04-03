import { UserIdentifierType } from "@fuul/sdk";

let initialized = false;

export async function initFuul(): Promise<void> {
  if (initialized || typeof window === "undefined") return;
  try {
    const { Fuul } = await import("@fuul/sdk");
    const apiKey = process.env.NEXT_PUBLIC_FUUL_API_KEY;
    if (!apiKey) {
      console.warn("[Fuul] NEXT_PUBLIC_FUUL_API_KEY not set — skipping init");
      return;
    }
    Fuul.init({ apiKey });
    initialized = true;
  } catch (err) {
    console.warn("[Fuul] Init failed:", err);
  }
}

export async function sendPageview(pageName?: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const { Fuul } = await import("@fuul/sdk");
    await Fuul.sendPageview(pageName);
  } catch {}
}

export async function identifyUser(walletAddress: string): Promise<void> {
  if (typeof window === "undefined" || !walletAddress) return;
  try {
    const { Fuul } = await import("@fuul/sdk");
    await Fuul.identifyUser({
      identifier: walletAddress,
      identifierType: UserIdentifierType.SolanaAddress,
    });
  } catch (err) {
    console.warn("[Fuul] identifyUser failed:", err);
  }
}

export async function generateTrackingLink(
  affiliateAddress: string,
): Promise<string | null> {
  if (typeof window === "undefined" || !affiliateAddress) return null;
  try {
    const { Fuul } = await import("@fuul/sdk");
    const baseUrl = window.location.origin;
    const link = await Fuul.generateTrackingLink(
      baseUrl,
      affiliateAddress,
      UserIdentifierType.SolanaAddress,
    );
    return link;
  } catch (err) {
    console.warn("[Fuul] generateTrackingLink failed:", err);
    return null;
  }
}
