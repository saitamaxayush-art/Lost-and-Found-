import React, { useEffect, useState } from "react";

export default function ProgressRing({
  points = 0,
  size = 114,
  strokeWidth = 3,
  children,
}) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Compute progress towards next tier
  // Active Member: 0-149 pts (target: 150)
  // Gold Helper: 150-299 pts (target: 300)
  // Campus Guardian: 300+ pts
  let progressRatio = 0;
  if (points < 150) {
    progressRatio = Math.min(1, Math.max(0, points / 150));
  } else if (points < 300) {
    progressRatio = Math.min(1, Math.max(0, (points - 150) / 150));
  } else {
    progressRatio = Math.min(1, Math.max(0.1, (points - 300) / 200 || 1));
  }

  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progressRatio);
    }, 120);
    return () => clearTimeout(timer);
  }, [progressRatio]);

  const strokeDashoffset = circumference - animatedProgress * circumference;

  return (
    <div
      className="pf-avatar-ring-wrap"
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "grid",
        placeItems: "center",
      }}
    >
      <svg
        width={size}
        height={size}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          transform: "rotate(-90deg)",
          pointerEvents: "none",
        }}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth={strokeWidth}
        />
        {/* Animated fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent, #E07A1F)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 850ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </svg>
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
