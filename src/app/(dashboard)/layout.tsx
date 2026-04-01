"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Trophy,
  User,
  Gift,
  ArrowRightLeft,
} from "lucide-react";
import { DepositBridgeModal } from "@/components/ui/DepositBridgeModal";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trade", label: "Trade", icon: TrendingUp },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/referral", label: "Referral", icon: Gift },
] as const;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [showDeposit, setShowDeposit] = useState(false);

  return (
    <div className="flex h-full min-h-dvh flex-col md:flex-row">
      <nav className="hidden md:flex md:w-64 md:flex-col neu-extruded bg-background m-3 rounded-[32px]">
        <div className="flex h-16 items-center gap-2 px-6">
          <div className="neu-icon-well flex h-9 w-9 items-center justify-center rounded-xl">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <span className="font-display text-lg font-semibold">SentimentPerps</span>
        </div>

        <div className="flex flex-1 flex-col gap-1 p-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
                  active
                    ? "neu-inset text-primary"
                    : "text-muted-foreground hover:text-foreground neu-flat hover:shadow-neu-sm"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="p-3">
          <button
            onClick={() => setShowDeposit(true)}
            className="neu-btn flex w-full items-center gap-3 rounded-2xl bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary"
          >
            <ArrowRightLeft className="h-5 w-5" />
            Deposit
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex bg-background md:hidden" style={{ boxShadow: "0 -4px 12px rgb(163,177,198,0.3)" }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      <DepositBridgeModal isOpen={showDeposit} onClose={() => setShowDeposit(false)} />
    </div>
  );
}
