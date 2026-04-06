"use client";

import { usePrivyConfigured } from "@/app/providers";
import { useReferralRegistration } from "@/hooks/useReferralRegistration";

function Inner() {
  useReferralRegistration();
  return null;
}

export function ReferralRegistrar() {
  const configured = usePrivyConfigured();
  if (!configured) return null;
  return <Inner />;
}
