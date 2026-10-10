import React from "react";

// Curated warm, muted tones for deterministic monograms
const MONOGRAM_PALETTE = [
  { bg: "#EADBCE", color: "#2B2118" },
  { bg: "#DFCEBE", color: "#2B2118" },
  { bg: "#D5BFAC", color: "#1B130D" },
  { bg: "#E2D3C4", color: "#2B2118" },
  { bg: "#CBB39C", color: "#1B130D" },
  { bg: "#D9C6B2", color: "#2B2118" },
];

function hashString(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getMonogram(name = "") {
  const trimmed = name.trim();
  if (!trimmed) return "U";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({
  name = "User",
  image = null,
  size = 40,
  className = "",
  style = {},
  alt = "",
}) {
  const initials = getMonogram(name);
  const colorIndex = hashString(name) % MONOGRAM_PALETTE.length;
  const theme = MONOGRAM_PALETTE[colorIndex];

  if (image) {
    return (
      <div
        className={`fb-avatar ${className}`}
        style={{
          width: size,
          height: size,
          minWidth: size,
          borderRadius: "50%",
          overflow: "hidden",
          position: "relative",
          boxShadow: "inset 0 0 0 1px rgba(43, 33, 24, 0.12)",
          ...style,
        }}
      >
        <img
          src={image}
          alt={alt || name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          onError={(e) => {
            // fallback to monogram if image fails to load
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`fb-avatar fb-avatar-monogram ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        backgroundColor: theme.bg,
        color: theme.color,
        fontFamily: "'Inter', sans-serif",
        fontWeight: 600,
        fontSize: Math.max(11, Math.round(size * 0.38)),
        letterSpacing: "-0.01em",
        userSelect: "none",
        boxShadow: "inset 0 0 0 1px rgba(43, 33, 24, 0.12)",
        ...style,
      }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
