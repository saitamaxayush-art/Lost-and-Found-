import { ITEM_ASSET_OVERRIDES } from "../assets";

/**
 * High-fidelity vector artwork for the 5 campus lost & found items.
 * If ITEM_ASSET_OVERRIDES contains a URL, an <image> element is rendered instead.
 */

export function GlassesItem() {
  const override = ITEM_ASSET_OVERRIDES.glasses;
  if (override) {
    return <image href={override} x="-60" y="-35" width="120" height="70" />;
  }

  return (
    <g className="item-art item-glasses">
      {/* Soft item shadow */}
      <ellipse cx="0" cy="24" rx="48" ry="12" fill="rgba(10, 5, 2, 0.35)" filter="url(#item-shadow-blur)" />

      {/* Frame Left Lens */}
      <ellipse cx="-26" cy="0" rx="22" ry="20" fill="rgba(220, 240, 255, 0.3)" stroke="#5c381c" strokeWidth="4" />
      <ellipse cx="-26" cy="0" rx="20" ry="18" fill="none" stroke="#d4af37" strokeWidth="1.5" />
      {/* Lens Reflection Highlight */}
      <path d="M -38 -8 Q -28 -14 -14 -12" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Frame Right Lens */}
      <ellipse cx="26" cy="0" rx="22" ry="20" fill="rgba(220, 240, 255, 0.3)" stroke="#5c381c" strokeWidth="4" />
      <ellipse cx="26" cy="0" rx="20" ry="18" fill="none" stroke="#d4af37" strokeWidth="1.5" />
      {/* Lens Reflection Highlight */}
      <path d="M 14 -8 Q 24 -14 38 -12" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Bridge */}
      <path d="M -5 -3 Q 0 -9 5 -3" fill="none" stroke="#d4af37" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M -5 2 Q 0 -2 5 2" fill="none" stroke="#5c381c" strokeWidth="2" strokeLinecap="round" />

      {/* Nose pads */}
      <ellipse cx="-7" cy="4" rx="2" ry="3.5" fill="rgba(255,255,255,0.8)" stroke="#d4af37" strokeWidth="0.8" />
      <ellipse cx="7" cy="4" rx="2" ry="3.5" fill="rgba(255,255,255,0.8)" stroke="#d4af37" strokeWidth="0.8" />

      {/* Temples / Hinges */}
      <path d="M -48 -2 L -62 -12 Q -68 -16 -70 -12" fill="none" stroke="#5c381c" strokeWidth="3" strokeLinecap="round" />
      <circle cx="-47" cy="-2" r="2.5" fill="#d4af37" />

      <path d="M 48 -2 L 62 -12 Q 68 -16 70 -12" fill="none" stroke="#5c381c" strokeWidth="3" strokeLinecap="round" />
      <circle cx="47" cy="-2" r="2.5" fill="#d4af37" />
    </g>
  );
}

export function PhoneItem() {
  const override = ITEM_ASSET_OVERRIDES.phone;
  if (override) {
    return <image href={override} x="-40" y="-75" width="80" height="150" />;
  }

  return (
    <g className="item-art item-phone">
      {/* Shadow */}
      <rect x="-36" y="-68" width="76" height="144" rx="18" fill="rgba(10, 5, 2, 0.4)" filter="url(#item-shadow-blur)" />

      {/* Phone chassis outer border */}
      <rect x="-38" y="-72" width="76" height="144" rx="16" fill="#1c202a" stroke="#48536b" strokeWidth="2" />

      {/* Glass screen */}
      <rect x="-34" y="-68" width="68" height="136" rx="12" fill="#0b1323" />

      {/* Screen gradient wallpaper */}
      <rect x="-34" y="-68" width="68" height="136" rx="12" fill="url(#phone-screen-grad)" opacity="0.85" />

      {/* Screen Reflection Angle */}
      <path d="M -34 -68 L 10 -68 L -34 40 Z" fill="rgba(255, 255, 255, 0.08)" />

      {/* Speaker pill & camera notch */}
      <rect x="-10" y="-64" width="20" height="4" rx="2" fill="#05080f" />
      <circle cx="6" cy="-62" r="1.5" fill="#1a325e" />

      {/* Clock on lockscreen */}
      <text x="0" y="-36" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="700" fontFamily="Sora, sans-serif">
        10:42
      </text>
      <text x="0" y="-24" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="6" fontFamily="Inter, sans-serif">
        Monday, Oct 12
      </text>

      {/* FindBack notification preview pill */}
      <rect x="-30" y="-12" width="60" height="28" rx="6" fill="rgba(255, 255, 255, 0.92)" />
      <circle cx="-22" cy="2" r="4" fill="#0b1f4d" />
      <text x="-22" y="4" textAnchor="middle" fill="#f5c542" fontSize="5" fontWeight="800">
        FB
      </text>
      <text x="-14" y="-1" fill="#0b1f4d" fontSize="5.5" fontWeight="700" fontFamily="Inter, sans-serif">
        Match Found!
      </text>
      <text x="-14" y="8" fill="#586580" fontSize="4.5" fontFamily="Inter, sans-serif">
        Central Library Desk
      </text>

      {/* Bottom home indicator bar */}
      <rect x="-16" y="58" width="32" height="2.5" rx="1.25" fill="rgba(255,255,255,0.6)" />
    </g>
  );
}

export function NotebookItem() {
  const override = ITEM_ASSET_OVERRIDES.notebook;
  if (override) {
    return <image href={override} x="-65" y="-85" width="130" height="170" />;
  }

  return (
    <g className="item-art item-notebook">
      {/* Shadow */}
      <rect x="-58" y="-76" width="120" height="160" rx="8" fill="rgba(10, 5, 2, 0.45)" filter="url(#item-shadow-blur)" />

      {/* Back cover & Paper block edges */}
      <rect x="-57" y="-78" width="118" height="158" rx="7" fill="#dfd8c8" stroke="#8c785d" strokeWidth="1" />
      {/* Cream paper page lines edge */}
      <line x1="57" y1="-73" x2="57" y2="75" stroke="#bead91" strokeWidth="4" strokeDasharray="1.5 1.5" />

      {/* Hardbound Cover (Deep Forest Charcoal) */}
      <rect x="-60" y="-80" width="115" height="160" rx="7" fill="#1b2823" stroke="#2c4239" strokeWidth="1.5" />

      {/* Spine hinge crease lines */}
      <line x1="-50" y1="-80" x2="-50" y2="80" stroke="#0e1713" strokeWidth="2.5" />
      <line x1="-48" y1="-80" x2="-48" y2="80" stroke="#365045" strokeWidth="1" />

      {/* Gold foil embossed emblem on cover */}
      <rect x="-24" y="-30" width="46" height="58" rx="4" fill="none" stroke="#d4af37" strokeWidth="1.2" />
      <circle cx="-1" cy="-1" r="12" fill="none" stroke="#d4af37" strokeWidth="1" />
      <text x="-1" y="3" textAnchor="middle" fill="#d4af37" fontSize="8" fontWeight="700" fontFamily="Sora, sans-serif">
        LECTURE
      </text>
      <text x="-1" y="14" textAnchor="middle" fill="#d4af37" fontSize="5" fontFamily="Inter, sans-serif">
        NOTES
      </text>

      {/* Green Silk Ribbon Bookmark hanging out */}
      <path
        d="M -15 -80 C -15 -88, -2 -86, -2 -78 L -2 88 L 6 82 L 14 88 L 14 -78"
        fill="#27ae60"
        stroke="#1e8449"
        strokeWidth="1"
      />
      {/* Ribbon ribbon fold shadow */}
      <path d="M -2 70 L 6 64 L 14 70 L 14 88 L 6 82 L -2 88 Z" fill="rgba(0,0,0,0.15)" />

      {/* Elastic band keeper */}
      <rect x="36" y="-80" width="8" height="160" fill="#111c17" opacity="0.9" />
    </g>
  );
}

export function WalletItem() {
  const override = ITEM_ASSET_OVERRIDES.wallet;
  if (override) {
    return <image href={override} x="-55" y="-45" width="110" height="90" />;
  }

  return (
    <g className="item-art item-wallet">
      {/* Shadow */}
      <rect x="-52" y="-38" width="104" height="78" rx="10" fill="rgba(10, 5, 2, 0.4)" filter="url(#item-shadow-blur)" />

      {/* Bifold Navy Leather Wallet Base */}
      <rect x="-54" y="-40" width="108" height="80" rx="9" fill="#172b4d" stroke="#254275" strokeWidth="1.5" />

      {/* Leather perimeter stitching */}
      <rect
        x="-50"
        y="-36"
        width="100"
        height="72"
        rx="6"
        fill="none"
        stroke="#9db9ed"
        strokeWidth="1"
        strokeDasharray="3 2"
      />

      {/* Fold crease */}
      <line x1="0" y1="-40" x2="0" y2="40" stroke="#0d182d" strokeWidth="3" />
      <line x1="1" y1="-40" x2="1" y2="40" stroke="#335696" strokeWidth="1" />

      {/* Card slot 1 peek */}
      <path d="M -48 -18 Q -25 -24 -2 -18" fill="none" stroke="#203a67" strokeWidth="14" strokeLinecap="round" />
      {/* Student ID Card edge peeking out */}
      <rect x="-44" y="-28" width="40" height="18" rx="3" fill="#f5c542" stroke="#d49e12" strokeWidth="1" />
      <rect x="-41" y="-24" width="8" height="8" rx="1" fill="#0b1f4d" />
      <line x1="-30" y1="-22" x2="-8" y2="-22" stroke="#0b1f4d" strokeWidth="1.5" />
      <line x1="-30" y1="-17" x2="-14" y2="-17" stroke="#0b1f4d" strokeWidth="1" />

      {/* Right side coin flap / pocket */}
      <path d="M 6 -20 L 46 -20 Q 48 4 36 26 L 6 26 Z" fill="#132442" stroke="#254275" strokeWidth="1" />
      {/* Brass snap button */}
      <circle cx="26" cy="3" r="5" fill="#d4af37" stroke="#9a7b1c" strokeWidth="1" />
      <circle cx="26" cy="3" r="2" fill="#f5c542" />
    </g>
  );
}

export function ScarfItem() {
  const override = ITEM_ASSET_OVERRIDES.scarf;
  if (override) {
    return <image href={override} x="-70" y="-60" width="140" height="120" />;
  }

  return (
    <g className="item-art item-scarf">
      {/* Shadow */}
      <path
        d="M -54 -10 C -40 -35, 30 -40, 52 -12 C 65 8, 40 45, 12 40 C -15 35, -45 42, -54 -10 Z"
        fill="rgba(10, 5, 2, 0.35)"
        filter="url(#item-shadow-blur)"
      />

      {/* Scarf loop 1 */}
      <path
        d="M -50 -15 C -35 -42, 28 -44, 48 -18 C 62 4, 38 38, 10 32 C -18 28, -46 36, -50 -15 Z"
        fill="#838b99"
        stroke="#656d7c"
        strokeWidth="2"
      />

      {/* Knit stitch ribs pattern */}
      <path
        d="M -40 -20 Q -30 -10 -20 -24 Q -10 -14 0 -26 Q 10 -16 20 -28 Q 30 -18 40 -26"
        fill="none"
        stroke="#9ea7b5"
        strokeWidth="2"
        strokeDasharray="2 3"
      />
      <path
        d="M -35 0 Q -25 10 -15 -4 Q -5 6 5 -6 Q 15 4 25 -8 Q 35 2 45 -6"
        fill="none"
        stroke="#9ea7b5"
        strokeWidth="2"
        strokeDasharray="2 3"
      />

      {/* Hanging fold end */}
      <path
        d="M 5 28 C 15 38, 18 55, 12 70 L -14 66 C -8 50, -6 32, 5 28 Z"
        fill="#727a87"
        stroke="#59616e"
        strokeWidth="1.5"
      />

      {/* Fringe tassels at bottom */}
      <line x1="-12" y1="66" x2="-14" y2="82" stroke="#a3acbb" strokeWidth="2" strokeLinecap="round" />
      <line x1="-7" y1="67" x2="-8" y2="84" stroke="#a3acbb" strokeWidth="2" strokeLinecap="round" />
      <line x1="-2" y1="68" x2="-2" y2="85" stroke="#a3acbb" strokeWidth="2" strokeLinecap="round" />
      <line x1="3" y1="69" x2="4" y2="84" stroke="#a3acbb" strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="70" x2="10" y2="82" stroke="#a3acbb" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}
