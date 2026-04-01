"use client";

import dynamic from "next/dynamic";
import { PrivyGuard } from "@/components/PrivyGuard";

const ReferralContent = dynamic(() => import("./ReferralContent"), {
  ssr: false,
});

export default function ReferralPage() {
  return (
    <PrivyGuard>
      <ReferralContent />
    </PrivyGuard>
  );
}
