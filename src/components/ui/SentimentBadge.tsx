import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type Sentiment = "positive" | "negative" | "neutral";

const CONFIG: Record<Sentiment, { label: string; className: string; Icon: typeof TrendingUp }> = {
  positive: { label: "Bullish", className: "bg-success/15 text-success", Icon: TrendingUp },
  negative: { label: "Bearish", className: "bg-danger/15 text-danger", Icon: TrendingDown },
  neutral: { label: "Neutral", className: "bg-warning/15 text-warning", Icon: Minus },
};

export function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  const { label, className, Icon } = CONFIG[sentiment];

  return (
    <span className={`neu-extruded-sm inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
