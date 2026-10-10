import React from "react";

/**
 * HeroStars: Cosmic starlight & constellation layer for the black Identity Hero card.
 * Features subtle twinkling stars, 4-point sparkle diamonds, constellation dust,
 * and warm ethereal nebula glows.
 */
export default function HeroStars() {
  return (
    <div className="pf-hero-stars-backdrop" aria-hidden="true">
      {/* Ambient nebula aura glows */}
      <div className="pf-hero-nebula pf-hero-nebula-amber" />
      <div className="pf-hero-nebula pf-hero-nebula-violet" />

      {/* Vector Starfield */}
      <svg
        className="pf-hero-stars-svg"
        viewBox="0 0 1000 280"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Soft radial glow for prominent stars */}
          <radialGradient id="starGlowAmber" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFA63D" stopOpacity="0.8" />
            <stop offset="40%" stopColor="#FFA63D" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FFA63D" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="starGlowIvory" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#FFF2D6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FFF2D6" stopOpacity="0" />
          </radialGradient>

          {/* 4-point sparkle diamond path template (centered at 0,0, radius ~7) */}
          <g id="sparkleDiamond">
            <path
              d="M 0 -8 Q 0 0 8 0 Q 0 0 0 8 Q 0 0 -8 0 Q 0 0 0 -8 Z"
              fill="url(#starGlowIvory)"
            />
            <circle cx="0" cy="0" r="1.5" fill="#FFFFFF" />
          </g>

          <g id="sparkleDiamondAmber">
            <path
              d="M 0 -7 Q 0 0 7 0 Q 0 0 0 7 Q 0 0 -7 0 Q 0 0 0 -7 Z"
              fill="url(#starGlowAmber)"
            />
            <circle cx="0" cy="0" r="1.4" fill="#FFE2B3" />
          </g>
        </defs>

        {/* Faint Constellation lines */}
        <polyline
          points="80,52 140,88 205,62 260,105"
          className="pf-constellation-line"
        />
        <polyline
          points="460,35 525,62 585,38"
          className="pf-constellation-line"
        />
        <polyline
          points="730,48 815,75 885,45 935,115"
          className="pf-constellation-line"
        />

        {/* Prominent 4-Point Sparkle Stars */}
        <use
          href="#sparkleDiamond"
          x="140"
          y="88"
          className="pf-star-sparkle pf-star-delay-1"
        />
        <use
          href="#sparkleDiamondAmber"
          x="460"
          y="35"
          className="pf-star-sparkle pf-star-delay-2"
        />
        <use
          href="#sparkleDiamond"
          x="815"
          y="75"
          className="pf-star-sparkle pf-star-delay-3"
        />
        <use
          href="#sparkleDiamondAmber"
          x="935"
          y="115"
          className="pf-star-sparkle pf-star-delay-4"
        />
        <use
          href="#sparkleDiamond"
          x="320"
          y="180"
          className="pf-star-sparkle pf-star-delay-5"
        />

        {/* Medium Star Nodes with Halos */}
        <circle cx="80" cy="52" r="2.2" fill="#FFE9C7" className="pf-star-twinkle pf-star-delay-1" />
        <circle cx="80" cy="52" r="5" fill="url(#starGlowAmber)" opacity="0.6" />

        <circle cx="205" cy="62" r="1.8" fill="#FFFFFF" className="pf-star-twinkle pf-star-delay-3" />
        <circle cx="260" cy="105" r="2" fill="#FFE2B3" className="pf-star-twinkle pf-star-delay-2" />

        <circle cx="525" cy="62" r="2" fill="#FFF8EE" className="pf-star-twinkle pf-star-delay-4" />
        <circle cx="585" cy="38" r="1.8" fill="#FFE8C2" className="pf-star-twinkle pf-star-delay-1" />

        <circle cx="730" cy="48" r="2.2" fill="#FFFFFF" className="pf-star-twinkle pf-star-delay-2" />
        <circle cx="885" cy="45" r="2.4" fill="#FFE5BC" className="pf-star-twinkle pf-star-delay-5" />
        <circle cx="885" cy="45" r="6" fill="url(#starGlowAmber)" opacity="0.55" />

        {/* Scattered Micro Stars across the upper & mid galaxy field */}
        <circle cx="35" cy="38" r="1" fill="#FFFFFF" className="pf-star-twinkle pf-star-delay-2" />
        <circle cx="65" cy="130" r="1.2" fill="#FFE8C2" className="pf-star-twinkle pf-star-delay-4" />
        <circle cx="110" cy="25" r="0.8" fill="#FFFFFF" className="pf-star-twinkle pf-star-delay-5" />
        <circle cx="175" cy="35" r="1.3" fill="#FFF4DE" className="pf-star-twinkle pf-star-delay-1" />
        <circle cx="225" cy="140" r="0.9" fill="#FFFFFF" className="pf-star-twinkle pf-star-delay-3" />
        <circle cx="280" cy="45" r="1.1" fill="#FFE3B3" className="pf-star-twinkle pf-star-delay-2" />

        <circle cx="360" cy="70" r="1" fill="#FFFFFF" className="pf-star-twinkle pf-star-delay-4" />
        <circle cx="410" cy="120" r="1.2" fill="#FFF2D6" className="pf-star-twinkle pf-star-delay-1" />
        <circle cx="495" cy="160" r="0.9" fill="#FFFFFF" className="pf-star-twinkle pf-star-delay-3" />
        <circle cx="560" cy="95" r="1.1" fill="#FFE8C2" className="pf-star-twinkle pf-star-delay-5" />

        <circle cx="630" cy="50" r="0.8" fill="#FFFFFF" className="pf-star-twinkle pf-star-delay-2" />
        <circle cx="675" cy="115" r="1.3" fill="#FFF8EE" className="pf-star-twinkle pf-star-delay-4" />
        <circle cx="705" cy="22" r="1" fill="#FFE0A8" className="pf-star-twinkle pf-star-delay-1" />
        <circle cx="760" cy="100" r="1.2" fill="#FFFFFF" className="pf-star-twinkle pf-star-delay-3" />

        <circle cx="845" cy="28" r="1" fill="#FFE8C2" className="pf-star-twinkle pf-star-delay-2" />
        <circle cx="860" cy="170" r="1.4" fill="#FFFFFF" className="pf-star-twinkle pf-star-delay-4" />
        <circle cx="915" cy="65" r="0.9" fill="#FFE3B3" className="pf-star-twinkle pf-star-delay-1" />
        <circle cx="955" cy="40" r="1.1" fill="#FFFFFF" className="pf-star-twinkle pf-star-delay-5" />
        <circle cx="975" cy="145" r="1" fill="#FFE2B3" className="pf-star-twinkle pf-star-delay-3" />
        <circle cx="960" cy="220" r="0.8" fill="#FFFFFF" className="pf-star-twinkle pf-star-delay-2" />

        {/* Lower gentle stardust */}
        <circle cx="150" cy="220" r="0.8" fill="#FFF0D0" className="pf-star-twinkle pf-star-delay-5" />
        <circle cx="270" cy="245" r="1" fill="#FFFFFF" className="pf-star-twinkle pf-star-delay-1" />
        <circle cx="420" cy="235" r="0.8" fill="#FFE2B3" className="pf-star-twinkle pf-star-delay-3" />
        <circle cx="680" cy="230" r="1.1" fill="#FFFFFF" className="pf-star-twinkle pf-star-delay-4" />
        <circle cx="830" cy="240" r="0.9" fill="#FFE7C0" className="pf-star-twinkle pf-star-delay-2" />
      </svg>
    </div>
  );
}
