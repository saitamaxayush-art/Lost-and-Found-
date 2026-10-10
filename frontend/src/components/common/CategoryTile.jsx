import React from "react";

export function CategoryIcon({ category = "", size = 20, strokeWidth = 1.75 }) {
  const cat = (category || "").toLowerCase();

  if (cat.includes("electronic") || cat.includes("charger") || cat.includes("earbud") || cat.includes("laptop")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="4" width="20" height="12" rx="2" />
        <path d="M6 20h12" />
        <path d="M12 16v4" />
      </svg>
    );
  }

  if (cat.includes("id") || cat.includes("card") || cat.includes("pass")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="2" />
        <path d="M15 8h2" />
        <path d="M15 12h2" />
        <path d="M7 16h10" />
      </svg>
    );
  }

  if (cat.includes("watch") || cat.includes("wallet") || cat.includes("accessori")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2" />
        <path d="M18 12h.01" />
      </svg>
    );
  }

  if (cat.includes("station") || cat.includes("calc") || cat.includes("pen")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    );
  }

  if (cat.includes("key")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="7.5" cy="15.5" r="4.5" />
        <path d="m21 3-9.5 9.5" />
        <path d="m15.5 7.5 2.5 2.5" />
        <path d="m18 5 2 2" />
      </svg>
    );
  }

  if (cat.includes("bag") || cat.includes("bottle") || cat.includes("tote")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    );
  }

  // General fallback
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m21 16-4 4-4-4" />
      <path d="M17 20V4" />
      <path d="m3 8 4-4 4 4" />
      <path d="M7 4v16" />
    </svg>
  );
}

export default function CategoryTile({
  category = "General",
  image = null,
  size = 64,
  radius = 14,
  className = "",
  onClick = null,
  alt = "",
}) {
  if (image) {
    return (
      <div
        className={`fb-thumb-box ${className}`}
        style={{
          width: size,
          height: size,
          minWidth: size,
          borderRadius: radius,
          overflow: "hidden",
          position: "relative",
          cursor: onClick ? "pointer" : "default",
          boxShadow: "inset 0 0 0 1px rgba(43, 33, 24, 0.12)",
          backgroundColor: "var(--paper-2, #F3E9DA)",
        }}
        onClick={onClick}
      >
        <img
          src={image}
          alt={alt || category}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`fb-category-tile ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: radius,
        display: "grid",
        placeItems: "center",
        backgroundColor: "var(--paper-2, #F3E9DA)",
        color: "var(--ink-soft, #7B6A58)",
        boxShadow: "inset 0 0 0 1px rgba(43, 33, 24, 0.08)",
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
      title={category}
    >
      <CategoryIcon category={category} size={Math.round(size * 0.4)} />
    </div>
  );
}
