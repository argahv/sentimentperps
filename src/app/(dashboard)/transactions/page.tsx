"use client";

import dynamic from "next/dynamic";
import { PrivyGuard } from "@/components/PrivyGuard";

const TransactionsContent = dynamic(() => import("./TransactionsContent"), {
  ssr: false,
});

export default function TransactionsPage() {
  return (
    <PrivyGuard>
      <TransactionsContent />
    </PrivyGuard>
  );
}
