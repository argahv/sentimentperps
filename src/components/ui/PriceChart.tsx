"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  createChart,
  CandlestickSeries,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type CandlestickData,
  type SeriesMarker,
  type Time,
  ColorType,
  CrosshairMode,
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
  markers?: ChartMarker[];
  height?: number;
  symbol?: string;
}

function toLWCTime(ts: number): Time {
  return (ts / 1000) as Time;
}

export function PriceChart({ data, markers, height = 400, symbol }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick", Time> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);

  const initChart = useCallback(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
      markersRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "#E0E5EC" },
        textColor: "#6B7280",
        fontFamily: "DM Sans, system-ui, sans-serif",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: "rgba(163, 177, 198, 0.3)" },
        horzLines: { color: "rgba(163, 177, 198, 0.3)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(108, 99, 255, 0.4)",
          labelBackgroundColor: "#6C63FF",
        },
        horzLine: {
          color: "rgba(108, 99, 255, 0.4)",
          labelBackgroundColor: "#6C63FF",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(163, 177, 198, 0.4)",
      },
      timeScale: {
        borderColor: "rgba(163, 177, 198, 0.4)",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#38B2AC",
      downColor: "#EF4444",
      borderUpColor: "#38B2AC",
      borderDownColor: "#EF4444",
      wickUpColor: "#38B2AC",
      wickDownColor: "#EF4444",
    });

    chartRef.current = chart;
    seriesRef.current = series;
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
  }, [data, markers]);

  return (
    <div className="neu-extruded relative overflow-hidden rounded-[32px] bg-background">
      {symbol && (
        <div className="absolute left-4 top-3 z-10 flex items-center gap-2">
          <span className="text-sm font-semibold font-display text-foreground/60">{symbol}/USDC</span>
          <span className="neu-extruded-sm rounded-lg px-1.5 py-0.5 text-[10px] text-muted-foreground">
            PERP
          </span>
        </div>
      )}
      <div ref={containerRef} />
    </div>
  );
}
