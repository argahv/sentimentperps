"use client";

import { useEffect, useMemo } from "react";
import { useWallets } from "@privy-io/react-auth/solana";
import { usePrivy } from "@privy-io/react-auth";
import { usePrivyConfigured } from "@/app/providers";
import { identifyUser } from "@/lib/fuul";

function Inner() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const wallet = useMemo(
    () => wallets.find((w) => w.standardWallet.name !== "Privy") ?? wallets[0] ?? null,
    [wallets],
  );
  const address = wallet?.address ?? null;

  useEffect(() => {
    if (authenticated && address) {
      identifyUser(address);
    }
  }, [authenticated, address]);

  return null;
}

export function FuulIdentify() {
  const configured = usePrivyConfigured();
  if (!configured) return null;
  return <Inner />;
}
