"use client";

import { Info } from "lucide-react";
import { useState, useRef, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

interface InfoTooltipProps {
  content: string;
  size?: number;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function InfoTooltip({
  content,
  size = 14,
  position = "top",
  className = "",
}: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [resolvedPosition, setResolvedPosition] = useState(position);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const computePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip) return;

    const tr = trigger.getBoundingClientRect();
    const tt = tooltip.getBoundingClientRect();
    const gap = 8;
    let pos = position;
    let top = 0;
    let left = 0;

    // Flip if overflowing viewport
    if (pos === "top" && tr.top - tt.height - gap < 0) pos = "bottom";
    else if (pos === "bottom" && tr.bottom + tt.height + gap > window.innerHeight) pos = "top";
    else if (pos === "left" && tr.left - tt.width - gap < 0) pos = "right";
    else if (pos === "right" && tr.right + tt.width + gap > window.innerWidth) pos = "left";

    if (pos === "top") {
      top = tr.top - tt.height - gap;
      left = tr.left + tr.width / 2 - tt.width / 2;
    } else if (pos === "bottom") {
      top = tr.bottom + gap;
      left = tr.left + tr.width / 2 - tt.width / 2;
    } else if (pos === "left") {
      top = tr.top + tr.height / 2 - tt.height / 2;
      left = tr.left - tt.width - gap;
    } else {
      top = tr.top + tr.height / 2 - tt.height / 2;
      left = tr.right + gap;
    }

    // Clamp horizontally
    if (left < 8) left = 8;
    if (left + tt.width > window.innerWidth - 8) left = window.innerWidth - tt.width - 8;

    setCoords({ top, left });
    setResolvedPosition(pos);
  }, [position]);

  useLayoutEffect(() => {
    if (isVisible) computePosition();
  }, [isVisible, computePosition]);

  return (
    <span
      ref={triggerRef}
      className={`info-tooltip-trigger ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      tabIndex={0}
      role="button"
      aria-label="More information"
    >
      <Info size={size} className="info-tooltip-icon" />
      {isVisible &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`info-tooltip-content info-tooltip-${resolvedPosition}`}
            role="tooltip"
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
            }}
          >
            {content}
            <span className="info-tooltip-arrow" />
          </div>,
          document.body
        )}
    </span>
  );
}
