"use client";

import { InfoTooltip } from "@/components/ui/InfoTooltip";

export function PerformanceBreakdown({
  trades,
}: {
  trades: Array<{ symbol: string; pnl: number; size: number; won: boolean }>;
}) {
  if (!trades || trades.length === 0) return null;

  const grouped = trades.reduce((acc, trade) => {
    if (!acc[trade.symbol]) {
      acc[trade.symbol] = {
        symbol: trade.symbol,
        trades: 0,
        wins: 0,
        totalPnl: 0,
        totalSize: 0,
      };
    }
    acc[trade.symbol].trades += 1;
    if (trade.won) acc[trade.symbol].wins += 1;
    acc[trade.symbol].totalPnl += trade.pnl;
    acc[trade.symbol].totalSize += trade.size;
    return acc;
  }, {} as Record<string, { symbol: string; trades: number; wins: number; totalPnl: number; totalSize: number }>);

  const sorted = Object.values(grouped).sort((a, b) => b.totalPnl - a.totalPnl);

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="min-w-[500px] flex flex-col gap-2">
        <div className="grid grid-cols-5 gap-4 px-4 py-2 text-sm font-semibold text-muted-foreground uppercase tracking-widest">
          <div>Token</div>
          <div className="text-right">Trades</div>
          <div className="text-right flex items-center justify-end gap-2">
            Win Rate
            <InfoTooltip content="Percentage of profitable trades for this token. Calculated as wins divided by total trades." size={12} />
          </div>
          <div className="text-right flex items-center justify-end gap-2">
            Total PnL
            <InfoTooltip content="Cumulative realized profit/loss for this token across all closed trades." size={12} />
          </div>
          <div className="text-right flex items-center justify-end gap-2">
            Avg Size
            <InfoTooltip content="Average position size in USD for this token. Calculated as total volume divided by number of trades." size={12} />
          </div>
        </div>
        
        {sorted.map((item, idx) => {
          const winRate = (item.wins / item.trades) * 100;
          const avgSize = item.totalSize / item.trades;
          const pnlColor = item.totalPnl >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]";
          const pnlPrefix = item.totalPnl >= 0 ? "+" : "";

          return (
            <div
              key={item.symbol}
              className="grid grid-cols-5 gap-4 px-4 py-3 border border-border-muted bg-surface hover:bg-surface-elevated rounded-md transition-all duration-200 card-entrance items-center"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="font-bold font-display">{item.symbol}</div>
              <div className="text-right tabular-nums">{item.trades}</div>
              <div className="text-right tabular-nums">{winRate.toFixed(0)}%</div>
              <div className={`text-right tabular-nums font-semibold ${pnlColor}`}>
                {pnlPrefix}{item.totalPnl.toFixed(2)}
              </div>
              <div className="text-right tabular-nums">${avgSize.toFixed(2)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
