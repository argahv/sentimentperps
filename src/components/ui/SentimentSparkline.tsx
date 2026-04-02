"use client";

import { useVelocityHistoryStore } from "@/stores/velocityHistory";

const WIDTH = 120;
const HEIGHT = 32;
const PADDING = 4;

interface SentimentSparklineProps {
  symbol: string;
  currentVelocity: number;
}

function buildPolylinePoints(data: number[]): string {
  if (data.length < 2) return "";
  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;

  const innerW = WIDTH - PADDING * 2;
  const innerH = HEIGHT - PADDING * 2;

  return data
    .map((v, i) => {
      const x = PADDING + (i / (data.length - 1)) * innerW;
      const y = PADDING + innerH - ((v - minVal) / range) * innerH;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildFillPath(data: number[]): string {
  if (data.length < 2) return "";
  const points = buildPolylinePoints(data);
  if (!points) return "";

  const firstX = PADDING;
  const lastX = WIDTH - PADDING;
  const bottomY = HEIGHT - PADDING;

  return `M${firstX},${bottomY} L${points.replace(/,/g, " L").split(" L").map((p, i) => (i === 0 ? p.replace(firstX + " ", "") : p)).join(" L")} L${lastX},${bottomY} Z`;
}

function buildSmoothPath(data: number[]): string {
  if (data.length < 2) return "";
  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;

  const innerW = WIDTH - PADDING * 2;
  const innerH = HEIGHT - PADDING * 2;

  const pts = data.map((v, i) => ({
    x: PADDING + (i / (data.length - 1)) * innerW,
    y: PADDING + innerH - ((v - minVal) / range) * innerH,
  }));

  let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C${cpx.toFixed(2)},${prev.y.toFixed(2)} ${cpx.toFixed(2)},${curr.y.toFixed(2)} ${curr.x.toFixed(2)},${curr.y.toFixed(2)}`;
  }
  return d;
}

function buildFillFromPath(data: number[]): string {
  if (data.length < 2) return "";
  const smooth = buildSmoothPath(data);
  const lastX = (WIDTH - PADDING).toFixed(2);
  const firstX = PADDING.toFixed(2);
  const bottomY = (HEIGHT - PADDING).toFixed(2);
  return `${smooth} L${lastX},${bottomY} L${firstX},${bottomY} Z`;
}

const EMPTY_HISTORY: number[] = [];

export function SentimentSparkline({ symbol, currentVelocity }: SentimentSparklineProps) {
  const history = useVelocityHistoryStore((s) => s.history[symbol] ?? EMPTY_HISTORY);

  if (history.length < 2) {
    return (
      <div className="flex items-center justify-center h-8 w-[120px]">
        <span className="text-[10px] text-muted-foreground italic">Collecting data...</span>
      </div>
    );
  }

  const last = history[history.length - 1];
  const secondLast = history[history.length - 2];
  const dotColor =
    last > secondLast ? "var(--color-success)" : last < secondLast ? "var(--color-danger)" : "var(--color-primary)";

  const minVal = Math.min(...history);
  const maxVal = Math.max(...history);
  const range = maxVal - minVal || 1;
  const innerH = HEIGHT - PADDING * 2;
  const dotY = PADDING + innerH - ((last - minVal) / range) * innerH;
  const dotX = WIDTH - PADDING;

  const smoothPath = buildSmoothPath(history);
  const fillPath = buildFillFromPath(history);

  return (
    <svg
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`Sentiment velocity trend for ${symbol}: ${currentVelocity.toFixed(1)}`}
    >
      <defs>
        <linearGradient id={`fill-${symbol}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path
        d={fillPath}
        fill={`url(#fill-${symbol})`}
      />

      <path
        d={smoothPath}
        stroke="var(--color-primary)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      <circle
        cx={dotX}
        cy={dotY}
        r={3.5}
        fill={dotColor}
        className="sparkline-pulse"
      />

      <style>{`
        .sparkline-pulse {
          animation: sparklinePulse 1.5s ease-in-out infinite;
          transform-origin: ${dotX}px ${dotY}px;
        }
        @keyframes sparklinePulse {
          0%, 100% { opacity: 1; r: 3.5; }
          50% { opacity: 0.5; r: 5.5; }
        }
      `}</style>
    </svg>
  );
}
