"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type CandlestickData,
  type LineData,
  type SeriesMarker,
  type Time,
  ColorType,
  CrosshairMode,
  LineStyle,
} from "lightweight-charts";

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface ChartMarker {
  time: number;
  position: "aboveBar" | "belowBar";
  color: string;
  shape: "circle" | "arrowUp" | "arrowDown" | "square";
  text: string;
}

interface PriceChartProps {
  data: CandleData[];
  sentimentData?: Array<{ time: number; value: number }>;
  markers?: ChartMarker[];
  height?: number;
  symbol?: string;
  isLive?: boolean;
}

function toLWCTime(ts: number): Time {
  return (ts / 1000) as Time;
}

export function PriceChart({ data, sentimentData, markers, height = 400, symbol, isLive }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick", Time> | null>(null);
  const sentimentSeriesRef = useRef<ISeriesApi<"Line", Time> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const [showSentiment, setShowSentiment] = useState(true);

  const initChart = useCallback(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
      sentimentSeriesRef.current = null;
      markersRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "#12151C" },
        textColor: "#6B7A8D",
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: "rgba(42, 48, 64, 0.5)" },
        horzLines: { color: "rgba(42, 48, 64, 0.5)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(255, 71, 87, 0.4)",
          labelBackgroundColor: "#FF4757",
        },
        horzLine: {
          color: "rgba(255, 71, 87, 0.4)",
          labelBackgroundColor: "#FF4757",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(42, 48, 64, 0.5)",
      },
      timeScale: {
        borderColor: "rgba(42, 48, 64, 0.5)",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#22C55E",
      downColor: "#FF4757",
      borderUpColor: "#22C55E",
      borderDownColor: "#FF4757",
      wickUpColor: "#22C55E",
      wickDownColor: "#FF4757",
    });

    const sentimentSeries = chart.addSeries(LineSeries, {
      color: "rgba(34, 197, 94, 0.5)",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceScaleId: "sentiment",
    });
    
    chart.priceScale("sentiment").applyOptions({
      visible: false,
    });

    chartRef.current = chart;
    seriesRef.current = series;
    sentimentSeriesRef.current = sentimentSeries;
  }, [height]);

  useEffect(() => {
    initChart();

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (chartRef.current) {
          chartRef.current.applyOptions({ width: entry.contentRect.width });
        }
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
        markersRef.current = null;
      }
    };
  }, [initChart]);

  useEffect(() => {
    if (!seriesRef.current || !data.length) return;

    const lwcData: CandlestickData[] = data.map((d) => ({
      time: toLWCTime(d.time),
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    seriesRef.current.setData(lwcData);

    if (sentimentSeriesRef.current && sentimentData && sentimentData.length > 0) {
      const lwcSentimentData: LineData[] = sentimentData.map((d) => ({
        time: toLWCTime(d.time),
        value: d.value,
      }));
      sentimentSeriesRef.current.setData(lwcSentimentData);
      sentimentSeriesRef.current.applyOptions({ visible: showSentiment });
    } else if (sentimentSeriesRef.current) {
      sentimentSeriesRef.current.setData([]);
    }

    if (markers?.length) {
      const lwcMarkers: SeriesMarker<Time>[] = markers
        .sort((a, b) => a.time - b.time)
        .map((m) => ({
          time: toLWCTime(m.time),
          position: m.position,
          color: m.color,
          shape: m.shape,
          text: m.text,
        }));

      if (markersRef.current) {
        markersRef.current.setMarkers(lwcMarkers);
      } else {
        markersRef.current = createSeriesMarkers(seriesRef.current, lwcMarkers);
      }
    }

    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [data, sentimentData, markers, showSentiment]);

  const hasSentimentData = sentimentData && sentimentData.length > 0;

  return (
    <div className="flat-card rounded-lg bg-surface relative overflow-hidden">
      <div className="absolute left-4 top-3 z-10 flex items-center justify-between w-[calc(100%-2rem)]">
         {symbol ? (
           <div className="flex items-center gap-2">
             <span className="text-sm font-semibold text-foreground/60">{symbol}/USDC</span>
             <span className="bg-surface-elevated rounded-full px-1.5 py-0.5 text-[10px] text-muted-foreground">
               PERP
             </span>
             <div className="flex items-center gap-1.5">
               <span className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${isLive ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                 <span className={`inline-block h-1.5 w-1.5 rounded-full ${isLive ? "led-green animate-pulse" : "bg-warning"}`} />
                 {isLive ? "LIVE" : "SYNTHETIC"}
               </span>
               <InfoTooltip content="LIVE: Real-time market data from Pacifica exchange. SYNTHETIC: Simulated price data for demonstration purposes." size={12} />
             </div>
           </div>
         ) : <div />}
         {hasSentimentData && (
           <div className="flex items-center gap-1.5">
             <button
               onClick={() => setShowSentiment(!showSentiment)}
               className="bg-surface-elevated rounded-md flex items-center justify-center p-1.5 text-muted-foreground hover:text-foreground transition-colors duration-200"
               title="Toggle Sentiment Overlay"
             >
               {showSentiment ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
             </button>
             <InfoTooltip content="Overlays the Elfa AI sentiment score on the price chart to visualize correlation between social sentiment and price movement." size={12} />
           </div>
         )}
      </div>
      <div ref={containerRef} />
    </div>
  );
}
