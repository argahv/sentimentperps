import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type Sentiment = "positive" | "negative" | "neutral";

const CONFIG: Record<Sentiment, { label: string; className: string; Icon: typeof TrendingUp }> = {
  positive: { label: "Bullish", className: "border-success/40 text-success bg-success/10", Icon: TrendingUp },
  negative: { label: "Bearish", className: "border-danger/40 text-danger bg-danger/10", Icon: TrendingDown },
  neutral: { label: "Neutral", className: "border-warning/40 text-warning bg-warning/10", Icon: Minus },
};

export function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  const { label, className, Icon } = CONFIG[sentiment];

  return (
    <span className={`border inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium uppercase tracking-widest ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
