import { forwardRef, useImperativeHandle, useRef } from "react";
import { TEXTURES } from "./assets";
import {
  GlassesItem,
  PhoneItem,
  NotebookItem,
  WalletItem,
  ScarfItem,
} from "./items/ItemArtwork";

const SceneSvg = forwardRef(function SceneSvg({ isPortrait = false }, ref) {
  const boxGroupRef = useRef(null);
  const burstGroupRef = useRef(null);
  const sparklesGroupRef = useRef(null);
  const itemsMapRef = useRef({});

  // Expose imperative update method called directly on every frame from rAF
  useImperativeHandle(
    ref,
    () => ({
      applyTimeline: (data) => {
        // 1. Box transform
        if (boxGroupRef.current) {
          const { x, y, scale, rot } = data.box;
          boxGroupRef.current.setAttribute(
            "transform",
            `translate(${x.toFixed(2)}, ${y.toFixed(2)}) scale(${scale.toFixed(3)}) rotate(${rot.toFixed(2)})`
          );
        }

        // 2. Burst and sparkles
        if (burstGroupRef.current) {
          burstGroupRef.current.style.opacity = data.burst.opacity.toFixed(3);
          burstGroupRef.current.setAttribute(
            "transform",
            `scale(${data.burst.scale.toFixed(3)})`
          );
        }

        if (sparklesGroupRef.current) {
          sparklesGroupRef.current.style.opacity = data.burst.opacity.toFixed(3);
        }

        // 3. Five Floating Items
        data.items.forEach((item) => {
          const el = itemsMapRef.current[item.id];
          if (el) {
            el.setAttribute(
              "transform",
              `translate(${item.x.toFixed(2)}, ${item.y.toFixed(2)}) scale(${item.scale.toFixed(3)}) rotate(${item.rot.toFixed(2)})`
            );
            el.style.opacity = item.opacity.toFixed(3);
            el.style.display = item.opacity <= 0.01 ? "none" : "block";
          }
        });
      },
    }),
    []
  );

  return (
    <svg
      className="scene-svg-canvas"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        {/* Procedural Textures from Python generation */}
        <pattern id="pat-cardboard" patternUnits="userSpaceOnUse" width="256" height="256">
          <image href={TEXTURES.cardboard} width="256" height="256" preserveAspectRatio="none" />
        </pattern>
        <pattern id="pat-wood" patternUnits="userSpaceOnUse" width="256" height="256">
          <image href={TEXTURES.wood} width="256" height="256" preserveAspectRatio="none" />
        </pattern>
        <pattern id="pat-paper" patternUnits="userSpaceOnUse" width="256" height="256">
          <image href={TEXTURES.paper} width="256" height="256" preserveAspectRatio="none" />
        </pattern>
        <pattern id="pat-tape" patternUnits="userSpaceOnUse" width="128" height="128">
          <image href={TEXTURES.tape} width="128" height="128" preserveAspectRatio="none" />
        </pattern>

        {/* Shadows & Blur Filters */}
        <filter id="library-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id="item-shadow-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id="soft-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="16" />
        </filter>

        {/* Gradients */}
        <radialGradient id="grad-contact-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(12, 6, 2, 0.75)" />
          <stop offset="60%" stopColor="rgba(12, 6, 2, 0.35)" />
          <stop offset="100%" stopColor="rgba(12, 6, 2, 0)" />
        </radialGradient>

        <radialGradient id="grad-burst-gold" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff2a8" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#f5c542" stopOpacity="0.75" />
          <stop offset="70%" stopColor="#e59819" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#c27705" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="phone-screen-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a3575" />
          <stop offset="60%" stopColor="#0a193d" />
          <stop offset="100%" stopColor="#050e24" />
        </linearGradient>

        <linearGradient id="box-cavity-depth" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#150d08" />
          <stop offset="50%" stopColor="#1f140c" />
          <stop offset="100%" stopColor="#301f14" />
        </linearGradient>

        <linearGradient id="box-front-shade" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.12)" />
          <stop offset="15%" stopColor="rgba(0, 0, 0, 0)" />
          <stop offset="85%" stopColor="rgba(0, 0, 0, 0.15)" />
          <stop offset="100%" stopColor="rgba(0, 0, 0, 0.35)" />
        </linearGradient>

        <linearGradient id="tape-sheen" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.15)" />
          <stop offset="50%" stopColor="rgba(255, 255, 255, 0.35)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0.08)" />
        </linearGradient>
      </defs>

      {/* ========================================================
          LAYER 1: BACKGROUND (Library Shelves + Wooden Table)
          ======================================================== */}
      <g className="scene-background">
        {/* Wall & Ambient Shadow */}
        <rect x="0" y="0" width="1200" height="800" fill="#0d1424" />

        {/* Blurred Library Shelves */}
        <g filter="url(#library-blur)" opacity="0.6">
          {/* Top shelf line */}
          <rect x="0" y="140" width="1200" height="18" fill="#1b253b" />
          {/* Books Row 1 */}
          <rect x="40" y="25" width="28" height="115" fill="#304775" rx="2" />
          <rect x="70" y="40" width="34" height="100" fill="#4d3024" rx="2" />
          <rect x="106" y="20" width="22" height="120" fill="#244535" rx="2" />
          <rect x="130" y="32" width="40" height="108" fill="#5c4528" rx="2" />
          <rect x="172" y="15" width="26" height="125" fill="#1a2744" rx="2" />
          <rect x="200" y="38" width="32" height="102" fill="#7a3030" rx="2" />

          <rect x="880" y="20" width="36" height="120" fill="#2d3f66" rx="2" />
          <rect x="918" y="35" width="24" height="105" fill="#523c28" rx="2" />
          <rect x="944" y="25" width="42" height="115" fill="#284a36" rx="2" />
          <rect x="988" y="18" width="30" height="122" fill="#75412b" rx="2" />
          <rect x="1020" y="42" width="38" height="98" fill="#1e2c4a" rx="2" />
          <rect x="1060" y="22" width="25" height="118" fill="#693030" rx="2" />

          {/* Middle shelf line */}
          <rect x="0" y="320" width="1200" height="22" fill="#151e30" />
          {/* Books Row 2 */}
          <rect x="60" y="190" width="32" height="130" fill="#40588a" rx="2" />
          <rect x="94" y="205" width="26" height="115" fill="#57382c" rx="2" />
          <rect x="122" y="180" width="44" height="140" fill="#224233" rx="2" />
          <rect x="168" y="195" width="30" height="125" fill="#6e3939" rx="2" />
          <rect x="200" y="215" width="36" height="105" fill="#203359" rx="2" />

          <rect x="850" y="185" width="42" height="135" fill="#324978" rx="2" />
          <rect x="894" y="200" width="28" height="120" fill="#5c3f2d" rx="2" />
          <rect x="924" y="175" width="34" height="145" fill="#2d523c" rx="2" />
          <rect x="960" y="210" width="48" height="110" fill="#7d3b3b" rx="2" />
        </g>

        {/* Ambient room lamp warm glow coming from top right */}
        <ellipse cx="900" cy="180" rx="420" ry="260" fill="rgba(245, 197, 66, 0.08)" filter="url(#soft-glow)" />

        {/* Wooden Study Table Surface (Perspective) */}
        <polygon points="0,460 1200,460 1200,800 0,800" fill="#24160d" />
        <polygon points="0,460 1200,460 1200,800 0,800" fill="url(#pat-wood)" opacity="0.8" />
        {/* Table back edge bevel highlight & shadow */}
        <line x1="0" y1="460" x2="1200" y2="460" stroke="#523623" strokeWidth="3" />
        <line x1="0" y1="463" x2="1200" y2="463" stroke="rgba(0,0,0,0.45)" strokeWidth="4" />
        {/* Table top dark gradient vignette */}
        <rect x="0" y="460" width="1200" height="340" fill="url(#grad-contact-shadow)" opacity="0.4" />
      </g>

      {/* ========================================================
          LAYER 2: CARDBOARD BOX GROUP (Imperatively positioned)
          ======================================================== */}
      <g id="scene-box-group" ref={boxGroupRef} transform="translate(600, 440) scale(1.15)">
        {/* Contact Shadow under Box */}
        <ellipse cx="0" cy="155" rx="270" ry="46" fill="url(#grad-contact-shadow)" opacity="0.85" />
        <ellipse cx="10" cy="158" rx="210" ry="26" fill="#000000" opacity="0.6" filter="url(#item-shadow-blur)" />

        {/* ----------------------------------------------------
            LAYER 2A: BOX BACK & INTERIOR CAVITY
            ---------------------------------------------------- */}
        <g className="box-back-layer">
          {/* Back Flap (tilted slightly backwards/upwards) */}
          <polygon
            points="-180,-70 180,-70 200,-150 -200,-150"
            fill="#a67946"
            stroke="#755027"
            strokeWidth="1.5"
          />
          <polygon
            points="-180,-70 180,-70 200,-150 -200,-150"
            fill="url(#pat-cardboard)"
            opacity="0.85"
          />
          {/* Corrugated fluting edge of back flap */}
          <line x1="-200" y1="-150" x2="200" y2="-150" stroke="#5e3e1c" strokeWidth="2.5" strokeDasharray="2 2" />

          {/* Left Inner Flap */}
          <polygon
            points="-185,-65 -185,45 -270,-15 -250,-100"
            fill="#8a6133"
            stroke="#63421d"
            strokeWidth="1.5"
          />
          <polygon points="-185,-65 -185,45 -270,-15 -250,-100" fill="url(#pat-cardboard)" opacity="0.75" />

          {/* Right Inner Flap */}
          <polygon
            points="185,-65 185,45 270,-15 250,-100"
            fill="#8a6133"
            stroke="#63421d"
            strokeWidth="1.5"
          />
          <polygon points="185,-65 185,45 270,-15 250,-100" fill="url(#pat-cardboard)" opacity="0.75" />

          {/* Dark Interior Cavity (where items rest inside) */}
          <polygon
            points="-185,-68 185,-68 175,65 -175,65"
            fill="url(#box-cavity-depth)"
          />
          {/* Deep corner inner shadows */}
          <polygon points="-185,-68 -150,-68 -140,65 -175,65" fill="#0c0704" opacity="0.6" />
          <polygon points="185,-68 150,-68 140,65 175,65" fill="#0c0704" opacity="0.6" />
        </g>

        {/* ----------------------------------------------------
            LAYER 2B: BURST GLOW & RAYS AT BOX MOUTH
            ---------------------------------------------------- */}
        <g
          id="box-burst-group"
          ref={burstGroupRef}
          transform="scale(0)"
          style={{ opacity: 0, transformOrigin: "0px -35px" }}
        >
          {/* Ambient Warm Radial Glow */}
          <circle cx="0" cy="-35" r="220" fill="url(#grad-burst-gold)" filter="url(#soft-glow)" />

          {/* Sunburst Rays */}
          <g opacity="0.65" stroke="#fce388" strokeWidth="2.5" strokeLinecap="round">
            <line x1="0" y1="-35" x2="-180" y2="-190" strokeDasharray="8 6" />
            <line x1="0" y1="-35" x2="-90" y2="-240" strokeDasharray="10 6" />
            <line x1="0" y1="-35" x2="0" y2="-270" strokeDasharray="12 6" strokeWidth="3" />
            <line x1="0" y1="-35" x2="90" y2="-240" strokeDasharray="10 6" />
            <line x1="0" y1="-35" x2="180" y2="-190" strokeDasharray="8 6" />
            <line x1="0" y1="-35" x2="-230" y2="-110" strokeDasharray="8 6" />
            <line x1="0" y1="-35" x2="230" y2="-110" strokeDasharray="8 6" />
          </g>
        </g>

        {/* ----------------------------------------------------
            LAYER 2C: FIVE FLOATING ITEMS
            ---------------------------------------------------- */}
        <g id="scene-items-group">
          {/* 1. Glasses */}
          <g
            id="item-glasses"
            ref={(el) => (itemsMapRef.current.glasses = el)}
            transform="translate(0, -35) scale(0.25)"
            style={{ opacity: 0 }}
          >
            <GlassesItem />
          </g>

          {/* 2. Smartphone */}
          <g
            id="item-phone"
            ref={(el) => (itemsMapRef.current.phone = el)}
            transform="translate(0, -35) scale(0.25)"
            style={{ opacity: 0 }}
          >
            <PhoneItem />
          </g>

          {/* 3. Notebook with green bookmark */}
          <g
            id="item-notebook"
            ref={(el) => (itemsMapRef.current.notebook = el)}
            transform="translate(0, -35) scale(0.25)"
            style={{ opacity: 0 }}
          >
            <NotebookItem />
          </g>

          {/* 4. Blue Wallet */}
          <g
            id="item-wallet"
            ref={(el) => (itemsMapRef.current.wallet = el)}
            transform="translate(0, -35) scale(0.25)"
            style={{ opacity: 0 }}
          >
            <WalletItem />
          </g>

          {/* 5. Grey Knit Scarf */}
          <g
            id="item-scarf"
            ref={(el) => (itemsMapRef.current.scarf = el)}
            transform="translate(0, -35) scale(0.25)"
            style={{ opacity: 0 }}
          >
            <ScarfItem />
          </g>
        </g>

        {/* ----------------------------------------------------
            LAYER 2D: FLOATING SPARKLES (Near box mouth)
            ---------------------------------------------------- */}
        <g id="box-sparkles-group" ref={sparklesGroupRef} style={{ opacity: 0 }}>
          {/* Sparkle 1 */}
          <path d="M -70 -160 Q -70 -140 -50 -140 Q -70 -140 -70 -120 Q -70 -140 -90 -140 Q -70 -140 -70 -160 Z" fill="#fff5be" />
          {/* Sparkle 2 */}
          <path d="M 60 -190 Q 60 -175 75 -175 Q 60 -175 60 -160 Q 60 -175 45 -175 Q 60 -175 60 -190 Z" fill="#f5c542" />
          {/* Sparkle 3 */}
          <path d="M -120 -80 Q -120 -70 -110 -70 Q -120 -70 -120 -60 Q -120 -70 -130 -70 Q -120 -70 -120 -80 Z" fill="#ffe27c" />
          {/* Sparkle 4 */}
          <path d="M 120 -90 Q 120 -78 132 -78 Q 120 -78 120 -66 Q 120 -78 108 -78 Q 120 -78 120 -90 Z" fill="#ffffff" />
        </g>

        {/* ----------------------------------------------------
            LAYER 2E: BOX FRONT (Cardboard Face, Flaps, Tape, Label)
            This sits IN FRONT of items so they pop OUT of the box!
            ---------------------------------------------------- */}
        <g className="box-front-layer">
          {/* Front Cardboard Face */}
          <polygon
            points="-185,-50 185,-50 175,150 -175,150"
            fill="#b88954"
            stroke="#755027"
            strokeWidth="2"
          />
          <polygon
            points="-185,-50 185,-50 175,150 -175,150"
            fill="url(#pat-cardboard)"
            opacity="0.92"
          />
          <polygon
            points="-185,-50 185,-50 175,150 -175,150"
            fill="url(#box-front-shade)"
          />

          {/* Front Lip Flap (angled slightly downward towards camera) */}
          <polygon
            points="-185,-50 185,-50 195,5 -195,5"
            fill="#c99863"
            stroke="#875e33"
            strokeWidth="1.5"
          />
          <polygon
            points="-185,-50 185,-50 195,5 -195,5"
            fill="url(#pat-cardboard)"
            opacity="0.9"
          />

          {/* Corrugated Fluting Texture along the top rim edge */}
          <line
            x1="-195"
            y1="5"
            x2="195"
            y2="5"
            stroke="#5e3c1a"
            strokeWidth="3.5"
            strokeDasharray="2 2"
          />
          <line
            x1="-185"
            y1="-50"
            x2="185"
            y2="-50"
            stroke="#503316"
            strokeWidth="2.5"
            strokeDasharray="1.5 2"
          />

          {/* Corner Creases & Vertical Corner Shading */}
          <line x1="-185" y1="-50" x2="-175" y2="150" stroke="rgba(0,0,0,0.35)" strokeWidth="2.5" />
          <line x1="185" y1="-50" x2="175" y2="150" stroke="rgba(0,0,0,0.4)" strokeWidth="2.5" />

          {/* Center Vertical Packaging Tape Seam */}
          <rect
            x="-16"
            y="-50"
            width="32"
            height="200"
            fill="#c49a5b"
            opacity="0.82"
          />
          <rect
            x="-16"
            y="-50"
            width="32"
            height="200"
            fill="url(#pat-tape)"
            opacity="0.75"
          />
          <rect
            x="-16"
            y="-50"
            width="32"
            height="200"
            fill="url(#tape-sheen)"
          />

          {/* --------------------------------------------------
              TAPED CREAM PAPER LABEL ("LOST & FOUND")
              -------------------------------------------------- */}
          <g id="box-paper-label" transform="translate(0, 52) rotate(-1.5)">
            {/* Label Drop Shadow */}
            <rect
              x="-110"
              y="-42"
              width="220"
              height="84"
              rx="4"
              fill="rgba(15, 8, 3, 0.4)"
              filter="url(#item-shadow-blur)"
            />

            {/* Cream Textured Paper Label */}
            <rect
              x="-108"
              y="-40"
              width="216"
              height="80"
              rx="3"
              fill="#f8f4e6"
              stroke="#d5c8ad"
              strokeWidth="1.5"
            />
            <rect
              x="-108"
              y="-40"
              width="216"
              height="80"
              rx="3"
              fill="url(#pat-paper)"
              opacity="0.75"
            />

            {/* Vintage Label Border Stamp Line */}
            <rect
              x="-102"
              y="-34"
              width="204"
              height="68"
              rx="2"
              fill="none"
              stroke="#0b1f4d"
              strokeWidth="1.2"
              strokeDasharray="4 2"
              opacity="0.7"
            />

            {/* Stamped Typography */}
            <text
              x="0"
              y="-12"
              textAnchor="middle"
              fill="#0b1f4d"
              fontSize="8.5"
              fontWeight="800"
              fontFamily="Inter, sans-serif"
              letterSpacing="3"
              opacity="0.85"
            >
              CAMPUS PROPERTY
            </text>

            <text
              x="0"
              y="14"
              textAnchor="middle"
              fill="#0b1f4d"
              fontSize="20"
              fontWeight="900"
              fontFamily="Sora, sans-serif"
              letterSpacing="1.5"
            >
              LOST &amp; FOUND
            </text>

            <text
              x="0"
              y="26"
              textAnchor="middle"
              fill="#b5850a"
              fontSize="7"
              fontWeight="700"
              fontFamily="Inter, sans-serif"
              letterSpacing="2"
            >
              CENTRAL RECOVERY DESK • FINDBACK
            </text>

            {/* Transparent Packing Tape Strips across label top & bottom */}
            {/* Top Tape Strip */}
            <rect
              x="-122"
              y="-46"
              width="244"
              height="16"
              fill="#d9b675"
              opacity="0.55"
            />
            <rect
              x="-122"
              y="-46"
              width="244"
              height="16"
              fill="url(#tape-sheen)"
            />

            {/* Bottom Tape Strip */}
            <rect
              x="-122"
              y="32"
              width="244"
              height="16"
              fill="#d9b675"
              opacity="0.55"
            />
            <rect
              x="-122"
              y="32"
              width="244"
              height="16"
              fill="url(#tape-sheen)"
            />
          </g>

          {/* Barcode / Stamp on Bottom Right of Cardboard */}
          <g opacity="0.45" transform="translate(110, 115)">
            <rect x="0" y="0" width="45" height="18" fill="none" stroke="#2b1a0d" strokeWidth="0.8" />
            <line x1="4" y1="3" x2="4" y2="15" stroke="#2b1a0d" strokeWidth="1.5" />
            <line x1="8" y1="3" x2="8" y2="15" stroke="#2b1a0d" strokeWidth="2.5" />
            <line x1="13" y1="3" x2="13" y2="15" stroke="#2b1a0d" strokeWidth="1" />
            <line x1="17" y1="3" x2="17" y2="15" stroke="#2b1a0d" strokeWidth="3" />
            <line x1="23" y1="3" x2="23" y2="15" stroke="#2b1a0d" strokeWidth="1.5" />
            <line x1="28" y1="3" x2="28" y2="15" stroke="#2b1a0d" strokeWidth="2" />
            <line x1="33" y1="3" x2="33" y2="15" stroke="#2b1a0d" strokeWidth="1" />
            <line x1="38" y1="3" x2="38" y2="15" stroke="#2b1a0d" strokeWidth="2.5" />
          </g>
        </g>
      </g>
    </svg>
  );
});

export default SceneSvg;
