export default function HytLogo({ size = 36, showTagline = false, light = false }) {
  return (
    <div className={`hyt-logo-wrap ${light ? "light" : ""}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="hyt-logo-svg"
        aria-hidden="true"
      >
        {/* Soft Drop Shadow */}
        <defs>
          <filter id="hyt-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0b1f4d" floodOpacity="0.25" />
          </filter>
          <linearGradient id="hyt-grad-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f2454" />
            <stop offset="100%" stopColor="#1b3c87" />
          </linearGradient>
          <linearGradient id="hyt-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        {/* Rounded Diamond / Shield Base */}
        <rect
          x="3"
          y="3"
          width="38"
          height="38"
          rx="11"
          fill="url(#hyt-grad-bg)"
          stroke="url(#hyt-gold-grad)"
          strokeWidth="1.5"
          filter="url(#hyt-shadow)"
        />

        {/* Box Lid / Chevron Shape (Representing "Finding / Box / Return") */}
        <path
          d="M 12 15 L 22 21 L 32 15 L 22 9 Z"
          fill="#fbbf24"
          opacity="0.95"
        />

        {/* Lower Left Wall (Letter H side) */}
        <path
          d="M 12 17 L 21 23 L 21 34 L 12 28 Z"
          fill="#2a4e9b"
        />

        {/* Lower Right Wall (Letter T side) */}
        <path
          d="M 32 17 L 23 23 L 23 34 L 32 28 Z"
          fill="#1d3873"
        />

        {/* Center Checkmark / Key of Ownership ("Have Your Thing") */}
        <path
          d="M 17 24 L 21 28 L 28 20"
          stroke="#ffffff"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="hyt-brand-text">
        <div className="hyt-brand-title">
          HYT<span className="hyt-brand-dot">.</span>
        </div>
        {showTagline && (
          <span className="hyt-tagline">Have Your Thing</span>
        )}
      </div>
    </div>
  );
}
