"use client";

import { useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";

const REFERRAL_CODE_KEY = "sentimentperps_referral_code";
const REFERRAL_REGISTERED_KEY = "sentimentperps_referral_registered";

export function useReferralRegistration() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const registering = useRef(false);

  const wallet = wallets.find((w) => w.standardWallet.name !== "Privy") ?? wallets[0] ?? null;
  const address = wallet?.address ?? null;

  useEffect(() => {
    if (!authenticated || !address || registering.current) return;

    const code = localStorage.getItem(REFERRAL_CODE_KEY);
    const alreadyRegistered = localStorage.getItem(REFERRAL_REGISTERED_KEY);

    if (!code || alreadyRegistered === address) return;

    registering.current = true;

    fetch("/api/referral/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referralCode: code,
        referredWallet: address,
      }),
    })
      .then(async (res) => {
        if (res.ok || res.status === 409) {
          localStorage.setItem(REFERRAL_REGISTERED_KEY, address);
          localStorage.removeItem(REFERRAL_CODE_KEY);
        } else {
          const data = await res.json().catch(() => ({}));
          console.warn("[Referral] Registration failed:", data.error ?? res.status);
        }
      })
      .catch((err) => {
        console.warn("[Referral] Registration request failed:", err);
      })
      .finally(() => {
        registering.current = false;
      });
  }, [authenticated, address]);
}
