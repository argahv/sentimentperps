"use client";

import dynamic from "next/dynamic";
import { PrivyGuard } from "@/components/PrivyGuard";

const ProfileContent = dynamic(() => import("./ProfileContent"), {
  ssr: false,
});

export default function ProfilePage() {
  return (
    <PrivyGuard>
      <ProfileContent />
    </PrivyGuard>
  );
}
