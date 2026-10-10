import React, { useEffect, useState } from "react";

export default function Sparkline({
  pointsLedger = [],
  width = 96,
  height = 24,
  strokeColor = "var(--accent, #E07A1F)",
}) {
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDrawn(true), 150);
    return () => clearTimeout(timer);
  }, []);

  // Compute 7 points
  // If pointsLedger has items, build a cumulative timeline of up to 7 steps
  const totalEntries = pointsLedger.length;
  let points = [0, 0, 0, 0, 0, 0, 0];

  if (totalEntries > 0) {
    // Reverse ledger so chronological
    const sorted = [...pointsLedger].reverse();
    let running = 0;
    const history = [0];
    sorted.forEach((tx) => {
      running += Number(tx.points) || 0;
      history.push(running);
    });

    // Pick 7 equidistant or trailing points
    if (history.length >= 7) {
      points = history.slice(-7);
    } else {
      // Pad front with 0
      const padCount = 7 - history.length;
      points = [...Array(padCount).fill(0), ...history];
    }
  }

  const maxVal = Math.max(...points, 100);
  const minVal = 0;
  const range = maxVal - minVal || 1;

  const paddingY = 4;
  const usableHeight = height - paddingY * 2;
  const stepX = width / (points.length - 1);

  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = height - paddingY - ((p - minVal) / range) * usableHeight;
    return { x, y };
  });

  const pathD = coords.reduce((acc, pt, idx) => {
    if (idx === 0) return `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    // smooth curve
    const prev = coords[idx - 1];
    const cx1 = prev.x + (pt.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (pt.x - prev.x) / 2;
    const cy2 = pt.y;
    return `${acc} C ${cx1.toFixed(1)} ${cy1.toFixed(1)}, ${cx2.toFixed(1)} ${cy2.toFixed(1)}, ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
  }, "");

  const pathLength = 200;

  return (
    <div
      className="pf-sparkline-wrap"
      style={{
        width,
        height,
        position: "relative",
        display: "inline-block",
        overflow: "visible",
      }}
      title={`Point trend: ${points[points.length - 1]} total`}
    >
      <svg width={width} height={height} style={{ overflow: "visible" }}>
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLength}
          strokeDashoffset={drawn ? 0 : pathLength}
          style={{
            transition: "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
        {/* Current end dot */}
        {drawn && coords.length > 0 && (
          <circle
            cx={coords[coords.length - 1].x}
            cy={coords[coords.length - 1].y}
            r="2.5"
            fill={strokeColor}
          />
        )}
      </svg>
    </div>
  );
}
