"use client";

import type { BadgeType } from "@/types/app";

const BADGE_CONFIG: Record<BadgeType, { label: string; color: string; icon: string }> = {
  first_mover: { label: "First Mover", color: "bg-amber-500/15 text-amber-600", icon: "1st" },
  contrarian: { label: "Contrarian", color: "bg-purple-500/15 text-purple-600", icon: "~~" },
  streak_3: { label: "3 Streak", color: "bg-blue-500/15 text-blue-600", icon: "x3" },
  streak_5: { label: "5 Streak", color: "bg-blue-500/15 text-blue-600", icon: "x5" },
  streak_10: { label: "10 Streak", color: "bg-indigo-500/15 text-indigo-600", icon: "10" },
  whale_hunter: { label: "Whale Hunter", color: "bg-cyan-500/15 text-cyan-600", icon: "wh" },
  sentiment_guru: { label: "Guru", color: "bg-success/15 text-success", icon: "sg" },
  speed_demon: { label: "Speed Demon", color: "bg-orange-500/15 text-orange-600", icon: "sd" },
};

interface BadgeChipProps {
  badge: BadgeType;
  size?: "sm" | "md";
}

export function BadgeChip({ badge, size = "sm" }: BadgeChipProps) {
  const config = BADGE_CONFIG[badge];
  if (!config) return null;

  const sizeClasses = size === "sm"
    ? "px-1.5 py-0.5 text-[10px] gap-1"
    : "px-2 py-1 text-xs gap-1.5";

  return (
    <span
      className={`neu-extruded-sm inline-flex items-center rounded-full font-medium ${config.color} ${sizeClasses}`}
      title={config.label}
    >
      <span className="font-bold">{config.icon}</span>
      {size === "md" && <span>{config.label}</span>}
    </span>
  );
}

interface BadgeListProps {
  badges: BadgeType[];
  size?: "sm" | "md";
  max?: number;
}

export function BadgeList({ badges, size = "sm", max = 3 }: BadgeListProps) {
  if (!badges.length) return null;

  const visible = badges.slice(0, max);
  const overflow = badges.length - max;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((badge) => (
        <BadgeChip key={badge} badge={badge} size={size} />
      ))}
      {overflow > 0 && (
        <span className="text-[10px] text-muted-foreground">+{overflow}</span>
      )}
    </div>
  );
}
