"use client";

import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";

const PrivyConfiguredContext = createContext(false);
export const usePrivyConfigured = () => useContext(PrivyConfiguredContext);

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const solanaConnectors = useMemo(
    () => (mounted ? toSolanaWalletConnectors() : undefined),
    [mounted]
  );

  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!mounted || !privyAppId || !solanaConnectors) {
    return (
      <PrivyConfiguredContext.Provider value={false}>
        {children}
      </PrivyConfiguredContext.Provider>
    );
  }

  return (
    <PrivyConfiguredContext.Provider value={true}>
      <PrivyProvider
        appId={privyAppId}
        config={{
          appearance: {
            theme: "dark",
            accentColor: "#3B82F6",
            logo: "/logo.svg",
            walletChainType: "solana-only",
          },
          loginMethods: ["wallet", "email"],
          embeddedWallets: {
            solana: {
              createOnLogin: "all-users",
            },
          },
          externalWallets: {
            solana: {
              connectors: solanaConnectors,
            },
          },
        }}
      >
        {children}
      </PrivyProvider>
    </PrivyConfiguredContext.Provider>
  );
}
