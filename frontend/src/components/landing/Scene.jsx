import { useEffect, useMemo, useRef } from "react";
import { SCENE_ASSETS } from "../../scene/assets";
import { clamp, ease, lerp, boxMove, walletState } from "./timeline";

/* ------------------------------------------------------------------ *
 *  Scene canvas is 1200 x 800. The SVG uses "xMidYMax slice", so the   *
 *  visible window depends on the screen: we compute it in layout().    *
 * ------------------------------------------------------------------ */

const BOX_ANCHOR = { x: 600, y: 720 }; // where the box touches the table

// Items inside the box. Wallet is spotlighted in Step 3, other items remain in the box.
const ITEMS = [
  { id: "wallet", sx: 522, sy: 522, dx: -190, dy: -330, rot: -190, sc: 0.35, sway: -34, delay: 0.0, fallDelay: 0.28, tilt: -12 },
  { id: "book", sx: 566, sy: 506, dx: -90, dy: -430, rot: -32, sc: 0.3, sway: 26, delay: 0.07, fallDelay: 0.21, tilt: 14 },
  { id: "phone", sx: 622, sy: 512, dx: 30, dy: -470, rot: 150, sc: 0.3, sway: -30, delay: 0.14, fallDelay: 0.14, tilt: -6 },
  { id: "glasses", sx: 656, sy: 526, dx: 120, dy: -380, rot: -24, sc: 0.35, sway: 38, delay: 0.21, fallDelay: 0.07, tilt: 8 },
  { id: "scarf", sx: 646, sy: 548, dx: 170, dy: -250, rot: 26, sc: 0.3, sway: -26, delay: 0.28, fallDelay: 0.0, tilt: 6, flutter: true },
];

function layout(W, H) {
  const s = Math.max(W / 1200, H / 800);
  const vw = W / s;
  const vh = H / s;
  const x0 = 600 - vw / 2;
  const top = 800 - vh;
  const narrow = W < 820 || W / H < 0.95;
  const hero = narrow ? { x: 600, s: 0.92 } : { x: 600, s: 1.28 };
  const side = narrow ? { x: 600, s: 0.72 } : { x: x0 + vw * 0.75, s: 1.0 };
  const fin = narrow ? { x: 600, s: 0.85 } : { x: 600, s: 1.05 };
  // How high may the highest item fly (screen fraction from top) before it leaves the screen / hits the text
  const ceiling = narrow ? 0.6 : 0.12;
  const yTarget = top + (ceiling * H) / s; // scene-y of ceiling
  const kMax = ((BOX_ANCHOR.y - yTarget) / side.s - (BOX_ANCHOR.y - 520)) / 470;
  // horizontal room to the right of the box (local units), so items never leave the screen
  const rightRoom = (x0 + vw - side.x) / side.s - 120;
  const leftRoom = (side.x - x0) / side.s - 120;
  return { hero, side, fin, k: clamp(kMax, narrow ? 0.3 : 0.5, 1), rightRoom: Math.max(40, rightRoom), leftRoom: Math.max(40, leftRoom) };
}

function useSpines() {
  return useMemo(() => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const cols = ["#9c4534", "#c58439", "#e2d3b1", "#3d6a4d", "#2e5a70", "#75382c", "#cdb98d", "#5a4878", "#b1512c", "#86a08a", "#4a3a2c"];
    const shelves = [170, 330, 490];
    return shelves.map((y) => {
      const books = [];
      let x = -20;
      while (x < 1220) {
        const w = 22 + rnd() * 26;
        const h = 92 + rnd() * 52;
        books.push({ x, y: y - h, w, h, c: cols[Math.floor(rnd() * cols.length)], band: rnd() > 0.55 ? 8 + rnd() * 30 : null });
        x += w + 1;
        if (rnd() < 0.08) x += 36 + rnd() * 60;
      }
      return { y, books };
    });
  }, []);
}

function ItemImage({ cfg }) {
  return (
    <image
      href={cfg.src}
      x={-cfg.width / 2}
      y={-cfg.height / 2}
      width={cfg.width}
      height={cfg.height}
      preserveAspectRatio="xMidYMid meet"
    />
  );
}

/* ---------------- items (vector, shaded) ---------------- */

function Glasses() {
  return (
    <>
      <path d="M-66 -10 L-90 20 M66 -10 L90 20" stroke="url(#tort)" strokeWidth="6" strokeLinecap="round" fill="none" />
      <rect x="-68" y="-25" width="58" height="46" rx="17" fill="url(#lens)" stroke="url(#tort)" strokeWidth="6.5" />
      <rect x="10" y="-25" width="58" height="46" rx="17" fill="url(#lens)" stroke="url(#tort)" strokeWidth="6.5" />
      <path d="M-10 -8 q10 -11 20 0" stroke="url(#tort)" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M-58 -14 q9 -6 22 -5" stroke="#fff" strokeOpacity=".65" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M20 -14 q9 -6 22 -5" stroke="#fff" strokeOpacity=".65" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="-68" cy="-8" r="2.4" fill="#c9a86a" />
      <circle cx="68" cy="-8" r="2.4" fill="#c9a86a" />
    </>
  );
}

function Phone() {
  return (
    <>
      <rect x="-27" y="-52" width="54" height="104" rx="10" fill="url(#phoneBody)" stroke="#5d6068" strokeWidth="1.2" />
      <rect x="27" y="-24" width="2.5" height="16" rx="1" fill="#3d3f45" />
      <rect x="-29.5" y="-30" width="2.5" height="10" rx="1" fill="#3d3f45" />
      <rect x="-23" y="-47" width="46" height="94" rx="7" fill="url(#phoneScreen)" />
      <text x="0" y="-14" textAnchor="middle" fontSize="19" fontWeight="300" fill="#fff" fillOpacity=".92" fontFamily="Inter, Arial, sans-serif">9:41</text>
      <text x="0" y="0" textAnchor="middle" fontSize="6" fill="#fff" fillOpacity=".6" fontFamily="Inter, Arial, sans-serif">Saturday, 19 September</text>
      <path d="M-23 -47 h46 v34 l-46 44 Z" fill="#fff" opacity=".07" />
      <rect x="-9" y="-44" width="18" height="5" rx="2.5" fill="#050608" />
    </>
  );
}

function Book() {
  return (
    <>
      <path d="M-6 -56 h22 v70 l-11 -9 l-11 9 Z" fill="url(#ribbon)" transform="translate(-6 -6)" />
      <rect x="-45" y="-56" width="90" height="112" rx="4" fill="url(#cover)" />
      <rect x="-45" y="-56" width="13" height="112" rx="4" fill="url(#spineShade)" />
      <rect x="41" y="-52" width="6" height="104" fill="#efe7d5" />
      <path d="M41 -46 h6 M41 -38 h6 M41 -30 h6 M41 -22 h6 M41 -14 h6 M41 -6 h6 M41 2 h6 M41 10 h6 M41 18 h6 M41 26 h6 M41 34 h6 M41 42 h6" stroke="#cfc4aa" strokeWidth=".8" />
      <rect x="20" y="-56" width="6" height="112" fill="#1d1e22" />
      <rect x="-22" y="-38" width="42" height="28" rx="2" fill="#efe6cf" stroke="#cbbf9f" strokeWidth=".8" />
      <path d="M-15 -30 h28 M-15 -23 h20 M-15 -16 h24" stroke="#8f8468" strokeWidth="1.6" strokeLinecap="round" />
      <g transform="translate(6 -56)">
        <g fill="#f4c81f">
          <circle cx="0" cy="-6" r="5" /><circle cx="6" cy="0" r="5" />
          <circle cx="0" cy="6" r="5" /><circle cx="-6" cy="0" r="5" />
        </g>
        <circle r="3.4" fill="#d9821b" />
      </g>
      <rect x="-45" y="-56" width="90" height="112" rx="4" fill="url(#coverGloss)" />
    </>
  );
}

function Wallet() {
  return (
    <>
      <rect x="-46" y="-32" width="92" height="64" rx="11" fill="url(#leather)" />
      <rect x="-40" y="-26" width="80" height="52" rx="7" fill="none" stroke="#a9bde6" strokeOpacity=".55" strokeWidth="1.6" strokeDasharray="4 3" />
      <path d="M-46 -6 q46 20 92 0" stroke="#1b2f57" strokeWidth="1.6" fill="none" />
      <circle cx="0" cy="8" r="6" fill="url(#brass)" />
      <rect x="-46" y="-32" width="92" height="64" rx="11" fill="url(#leatherGloss)" />
    </>
  );
}

function Scarf() {
  const shape = "M-80 -18 Q-42 -48 0 -27 T82 -13 L76 28 Q38 48 0 28 T-74 38 Z";
  return (
    <>
      <path d={shape} fill="url(#scarfBase)" />
      <path d={shape} fill="url(#knit)" />
      <path d="M-70 -4 Q-35 -30 0 -11 T76 2" stroke="#000" strokeOpacity=".12" strokeWidth="6" fill="none" />
      <path d="M-66 16 Q-32 -6 2 10 T72 22" stroke="#fff" strokeOpacity=".16" strokeWidth="5" fill="none" />
      <g stroke="#8b8f94" strokeWidth="2.6" strokeLinecap="round">
        <line x1="79" y1="-9" x2="97" y2="-5" /><line x1="80" y1="-1" x2="99" y2="4" />
        <line x1="79" y1="7" x2="98" y2="13" /><line x1="77" y1="15" x2="95" y2="22" />
        <line x1="75" y1="23" x2="91" y2="30" />
      </g>
    </>
  );
}

const ITEM_ART = { glasses: Glasses, phone: Phone, book: Book, wallet: Wallet, scarf: Scarf };

/* ------------------------------------------------------------------ */

export default function Scene({ subscribe }) {
  const svgRef = useRef(null);
  const lay = useRef(layout(1440, 810));
  const rows = useSpines();
  const bokeh = useMemo(
    () => [
      [140, 90, 60], [380, 60, 40], [700, 110, 70], [980, 70, 46], [1120, 200, 58],
      [90, 330, 44], [560, 240, 36], [880, 300, 54], [300, 420, 48], [1060, 460, 42],
    ],
    []
  );
  const spark = useMemo(() => {
    let seed = 21;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    return Array.from({ length: 22 }, (_, i) => {
      const a = -Math.PI / 2 + (rnd() - 0.5) * 2.6;
      const d = 150 + rnd() * 300;
      return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, delay: rnd() * 0.3, r: 2 + rnd() * 3.5, c: ["#ffe7a8", "#fff", "#ffc36b"][i % 3] };
    });
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    const q = (id) => svg.querySelector(`#${id}`);
    const boxG = q("boxGroup");
    const ring = q("burstRing");
    const burst = q("burst");
    const rays = Array.from(svg.querySelectorAll(".ray"));
    const glow = q("glow");
    const sparks = Array.from(svg.querySelectorAll(".spark"));
    const itemEls = ITEMS.map((it) => q(it.id));

    const onResize = () => {
      const r = svg.getBoundingClientRect();
      lay.current = layout(r.width, r.height);
    };
    onResize();
    const ro = new ResizeObserver(onResize);
    ro.observe(svg);

    const unsub = subscribe((p) => {
      const ws = walletState(p);
      const L = lay.current;
      const m = boxMove(p);
      const px = lerp(lerp(L.hero.x, L.side.x, m.out), L.fin.x, m.back);
      const ps = lerp(lerp(L.hero.s, L.side.s, m.out), L.fin.s, m.back);
      boxG.setAttribute(
        "transform",
        `translate(${px.toFixed(2)} ${BOX_ANCHOR.y}) scale(${ps.toFixed(4)}) translate(${-BOX_ANCHOR.x} ${-BOX_ANCHOR.y})`
      );

      ITEMS.forEach((it, i) => {
        if (i > 0) {
          // Other items remain nestled inside the box behind the front rim
          itemEls[i].setAttribute(
            "transform",
            `translate(${it.sx} ${it.sy}) rotate(${it.tilt}) scale(0.95)`
          );
          return;
        }

        // WALLET (i === 0): Spotlighted at Step 3, glows, and glides to center after Step 4
        const t = ws.elevation;
        const dxK = Math.min(1, 0.55 + L.k * 0.5);
        const dxT = -Math.min(-it.dx * dxK, L.leftRoom);

        // Position in spotlight above the box
        const spotX = it.sx + dxT * t + it.sway * Math.sin(Math.PI * t);
        const spotY = it.sy + it.dy * L.k * t;
        const spotRot = it.tilt + it.rot * t;
        const spotScale = 1 + it.sc * Math.sin(Math.PI * t * 0.5);

        // Target center screen coordinates (converted into box group space)
        const targetCenterX = (600 - px) / ps + BOX_ANCHOR.x;
        const targetCenterY = (390 - BOX_ANCHOR.y) / ps + BOX_ANCHOR.y;

        const curX = lerp(spotX, targetCenterX, ws.centerT);
        const curY = lerp(spotY, targetCenterY, ws.centerT);
        const curRot = lerp(spotRot, 0, ws.centerT);
        const curScale = lerp(spotScale, 1.4 / ps, ws.centerT);

        // Gentle floating when airborne
        const hoverPower = t * (1 - ws.centerT);
        const bob = hoverPower * Math.sin(p * 24) * 4.5;
        const swayAngle = hoverPower * Math.cos(p * 18) * 1.6;

        // Fades out as the 3D HTML unfolding wallet letter takes over
        const walletOpacity = Math.max(0, 1 - ws.openT * 1.5);
        itemEls[0].style.opacity = walletOpacity.toFixed(3);

        itemEls[0].setAttribute(
          "transform",
          `translate(${curX.toFixed(2)} ${(curY + bob).toFixed(2)}) rotate(${(curRot + swayAngle).toFixed(2)}) scale(${curScale.toFixed(3)})`
        );

        // Position the glowing matching aura right behind the wallet
        const auraEl = svg.querySelector("#walletAura");
        if (auraEl) {
          auraEl.setAttribute("transform", `translate(${curX.toFixed(2)} ${(curY + bob).toFixed(2)})`);
          const auraOpacity = (ws.glow * 0.92 * (1 - ws.centerT)).toFixed(3);
          auraEl.setAttribute("opacity", auraOpacity);
        }
      });

      // Sparks during wallet elevation
      const b = clamp(ws.elevation / 0.5);
      const burstActive = ws.elevation > 0 && ws.elevation < 0.95 ? Math.sin(Math.PI * b) : 0;
      burst.setAttribute("opacity", (burstActive * 0.7).toFixed(3));
      ring.setAttribute("r", (20 + 200 * b).toFixed(1));
      ring.setAttribute("stroke-width", (8 * (1 - b) + 2).toFixed(1));
      rays.forEach((ln, idx) => {
        const a = Math.PI + (idx / (rays.length - 1)) * Math.PI;
        const r1 = 40 + 100 * b;
        const r2 = r1 + 25 + 50 * b;
        ln.setAttribute("x1", (Math.cos(a) * r1).toFixed(1));
        ln.setAttribute("y1", (Math.sin(a) * r1).toFixed(1));
        ln.setAttribute("x2", (Math.cos(a) * r2).toFixed(1));
        ln.setAttribute("y2", (Math.sin(a) * r2).toFixed(1));
      });
      glow.setAttribute("opacity", (Math.sin(Math.PI * clamp(ws.elevation) * 0.5) * 0.6).toFixed(3));
      sparks.forEach((el, idx) => {
        const sp = spark[idx];
        const t = ease(clamp((ws.elevation - sp.delay) / (1 - sp.delay)));
        el.setAttribute("cx", (600 + sp.dx * t).toFixed(1));
        el.setAttribute("cy", (525 + sp.dy * t).toFixed(1));
        el.setAttribute("opacity", (burstActive * Math.sin(Math.PI * t) * 0.85).toFixed(3));
      });
    });

    return () => {
      unsub();
      ro.disconnect();
    };
  }, [subscribe, spark]);

  const A = SCENE_ASSETS;

  return (
    <svg ref={svgRef} className="lp-scene" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <pattern id="pCard" patternUnits="userSpaceOnUse" x="380" y="480" width="512" height="512">
          <image href="/scene/tex/cardboard.jpg" width="512" height="512" />
        </pattern>
        <pattern id="pWood" patternUnits="userSpaceOnUse" x="0" y="650" width="1200" height="220">
          <image href="/scene/tex/wood.jpg" width="1200" height="220" preserveAspectRatio="none" />
        </pattern>
        <pattern id="corr" patternUnits="userSpaceOnUse" width="4" height="3">
          <rect width="4" height="3" fill="none" />
          <rect y="1.6" width="4" height="1" fill="#3b2410" opacity=".28" />
        </pattern>
        <pattern id="knit" patternUnits="userSpaceOnUse" width="7" height="7">
          <path d="M0 1 L3.5 6 L7 1" stroke="#000" strokeOpacity=".16" strokeWidth="1.2" fill="none" />
          <path d="M0 0 L3.5 5 L7 0" stroke="#fff" strokeOpacity=".14" strokeWidth=".8" fill="none" />
        </pattern>

        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7d5230" /><stop offset="1" stopColor="#4f301c" /></linearGradient>
        <linearGradient id="spine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity=".38" /><stop offset=".25" stopColor="#fff" stopOpacity=".08" />
          <stop offset=".6" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".42" />
        </linearGradient>
        <linearGradient id="plank" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6a4327" /><stop offset=".15" stopColor="#4a2b18" /><stop offset="1" stopColor="#2c190d" /></linearGradient>
        <radialGradient id="bokehG"><stop offset="0" stopColor="#ffd9a0" stopOpacity=".55" /><stop offset="1" stopColor="#ffd9a0" stopOpacity="0" /></radialGradient>
        <radialGradient id="vignette" cx="50%" cy="55%" r="75%"><stop offset=".5" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".6" /></radialGradient>
        <linearGradient id="tableLight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".22" /><stop offset=".12" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".4" /></linearGradient>
        <radialGradient id="glowG" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#ffe7a8" stopOpacity=".85" /><stop offset="1" stopColor="#ffe7a8" stopOpacity="0" /></radialGradient>
        <radialGradient id="walletAuraG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity=".95" />
          <stop offset="35%" stopColor="#f59e0b" stopOpacity=".65" />
          <stop offset="70%" stopColor="#d97706" stopOpacity=".2" />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="frontShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity=".05" /><stop offset="1" stopColor="#000" stopOpacity=".34" /></linearGradient>
        <linearGradient id="sideShade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#000" stopOpacity=".3" /><stop offset=".22" stopColor="#000" stopOpacity="0" /><stop offset=".78" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".34" /></linearGradient>
        <linearGradient id="innerShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity=".5" /><stop offset="1" stopColor="#000" stopOpacity=".72" /></linearGradient>

        <linearGradient id="tort" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8a5530" /><stop offset=".5" stopColor="#3c2214" /><stop offset="1" stopColor="#6d4021" /></linearGradient>
        <linearGradient id="lens" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#dff0fa" stopOpacity=".5" /><stop offset="1" stopColor="#9bb9cc" stopOpacity=".22" /></linearGradient>
        <linearGradient id="phoneBody" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3a3d44" /><stop offset="1" stopColor="#15161a" /></linearGradient>
        <linearGradient id="phoneScreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3d5a7a" /><stop offset="1" stopColor="#1a2433" /></linearGradient>
        <linearGradient id="cover" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3a8a92" /><stop offset="1" stopColor="#1f5860" /></linearGradient>
        <linearGradient id="spineShade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#000" stopOpacity=".35" /><stop offset="1" stopColor="#000" stopOpacity="0" /></linearGradient>
        <linearGradient id="coverGloss" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".18" /><stop offset=".4" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".15" /></linearGradient>
        <linearGradient id="ribbon" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#6aa532" /><stop offset="1" stopColor="#8cc54a" /></linearGradient>
        <linearGradient id="leather" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3e64a6" /><stop offset="1" stopColor="#1f386d" /></linearGradient>
        <linearGradient id="leatherGloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".2" /><stop offset=".5" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <radialGradient id="brass" cx="35%" cy="35%"><stop offset="0" stopColor="#f3dc93" /><stop offset="1" stopColor="#a5822f" /></radialGradient>
        <linearGradient id="scarfBase" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a4a8ad" /><stop offset="1" stopColor="#7c8085" /></linearGradient>
        <linearGradient id="labelPaper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fbf9f2" /><stop offset="1" stopColor="#e9e5d8" /></linearGradient>

        <filter id="ds" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000" floodOpacity=".42" />
        </filter>
        <filter id="soft" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="9" /></filter>
        <filter id="blurBg"><feGaussianBlur stdDeviation="3" /></filter>
        <filter id="blurBokeh"><feGaussianBlur stdDeviation="5" /></filter>
      </defs>

      {/* ---------- library backdrop (fixed) ---------- */}
      {A.background ? (
        <image href={A.background.src} x="0" y="0" width="1200" height="800" preserveAspectRatio="xMidYMid slice" />
      ) : (
        <>
          <rect width="1200" height="800" fill="url(#wall)" />
          <g filter="url(#blurBg)">
            {rows.map((r) => (
              <g key={r.y}>
                {r.books.map((b, i) => (
                  <g key={i}>
                    <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={b.c} />
                    {b.band && <rect x={b.x} y={b.y + b.band} width={b.w} height="7" fill="#f0e6c8" opacity=".55" />}
                    <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="url(#spine)" />
                  </g>
                ))}
                <rect x="-20" y={r.y} width="1240" height="18" fill="url(#plank)" />
                <rect x="-20" y={r.y} width="1240" height="2" fill="#a7784a" opacity=".6" />
                <rect x="-20" y={r.y + 18} width="1240" height="22" fill="#000" opacity=".25" />
              </g>
            ))}
          </g>
          <g filter="url(#blurBokeh)">
            {bokeh.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="url(#bokehG)" />)}
          </g>
          <rect width="1200" height="800" fill="url(#vignette)" />
        </>
      )}

      {/* ---------- table ---------- */}
      <rect x="0" y="650" width="1200" height="150" fill="url(#pWood)" />
      <rect x="0" y="650" width="1200" height="150" fill="url(#tableLight)" />
      <rect x="0" y="650" width="1200" height="3" fill="#f6d9a3" opacity=".65" />
      <rect x="0" y="653" width="1200" height="6" fill="#000" opacity=".16" />

      {/* ---------- everything that moves with the box ---------- */}
      <g id="boxGroup">
        <ellipse id="glow" cx="600" cy="545" rx="300" ry="220" fill="url(#glowG)" opacity="0" />
        {/* contact + soft shadow on the table */}
        <ellipse cx="604" cy="727" rx="232" ry="20" fill="#000" opacity=".4" filter="url(#soft)" />
        <ellipse cx="600" cy="726" rx="205" ry="6" fill="#000" opacity=".5" />

        {A.boxBack ? (
          <image href={A.boxBack.src} x={A.boxBack.x} y={A.boxBack.y} width={A.boxBack.width} height={A.boxBack.height} />
        ) : (
          <>
            {/* inside of the box */}
            <path d="M472 516 L728 516 L750 548 L450 548 Z" fill="url(#pCard)" />
            <path d="M472 516 L728 516 L750 548 L450 548 Z" fill="url(#innerShade)" />
            <path d="M472 516 L500 516 L476 548 L450 548 Z" fill="#000" opacity=".22" />
            <path d="M728 516 L700 516 L724 548 L750 548 Z" fill="#000" opacity=".28" />
            {/* back rim (paper thickness) */}
            <rect x="470" y="509" width="260" height="8" rx="1.5" fill="url(#pCard)" />
            <rect x="470" y="509" width="260" height="8" rx="1.5" fill="url(#corr)" />
            <rect x="470" y="509" width="260" height="2" fill="#fff" opacity=".28" />
            {/* left / right rims */}
            <path d="M470 509 L478 509 L458 541 L449 541 Z" fill="url(#pCard)" />
            <path d="M730 509 L722 509 L742 541 L751 541 Z" fill="url(#pCard)" />
            <path d="M470 509 L478 509 L458 541 L449 541 Z" fill="#000" opacity=".12" />
            <path d="M730 509 L722 509 L742 541 L751 541 Z" fill="#000" opacity=".2" />
          </>
        )}

        {/* burst behind items */}
        <g id="burst" transform="translate(600 525)" opacity="0">
          <circle id="burstRing" r="10" fill="none" stroke="#ffe7a8" strokeWidth="6" />
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={i} className="ray" stroke="#ffe7a8" strokeWidth="4" strokeLinecap="round" />
          ))}
        </g>

        {/* Glowing match aura behind the spotlighted wallet */}
        <g id="walletAura" opacity="0">
          <circle cx="0" cy="0" r="130" fill="url(#walletAuraG)" />
          <circle cx="0" cy="0" r="90" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="6 4" />
          <circle cx="0" cy="0" r="110" fill="none" stroke="#fbbf24" strokeWidth="1.2" opacity=".6" />
          {Array.from({ length: 8 }).map((_, idx) => (
            <line
              key={idx}
              x1="0"
              y1="-25"
              x2="0"
              y2="-68"
              stroke="#fbbf24"
              strokeWidth="2"
              strokeLinecap="round"
              transform={`rotate(${idx * 45})`}
              opacity=".75"
            />
          ))}
        </g>

        {/* ---------- ITEMS ---------- */}
        {ITEMS.map((it) => {
          const Art = ITEM_ART[it.id];
          const custom = A.items[it.id];
          return (
            <g key={it.id} id={it.id} filter="url(#ds)">
              {custom ? <ItemImage cfg={custom} /> : <Art />}
            </g>
          );
        })}

        <g>
          {spark.map((s, i) => (
            <circle key={i} className="spark" r={s.r} fill={s.c} opacity="0" cx="600" cy="525" />
          ))}
        </g>

        {/* ---------- box front (hides item bottoms) ---------- */}
        {A.boxFront ? (
          <image href={A.boxFront.src} x={A.boxFront.x} y={A.boxFront.y} width={A.boxFront.width} height={A.boxFront.height} />
        ) : (
          <>
            <path d="M450 548 L750 548 L760 728 L440 728 Z" fill="url(#pCard)" />
            <path d="M450 548 L750 548 L760 728 L440 728 Z" fill="url(#frontShade)" />
            <path d="M450 548 L750 548 L760 728 L440 728 Z" fill="url(#sideShade)" />
            {/* front rim (folded flap thickness) */}
            <rect x="447" y="538" width="306" height="11" rx="2" fill="url(#pCard)" />
            <rect x="447" y="538" width="306" height="11" rx="2" fill="url(#corr)" />
            <rect x="447" y="538" width="306" height="2.4" fill="#fff" opacity=".35" />
            <rect x="447" y="547" width="306" height="3" fill="#000" opacity=".28" />
            {/* creases + tape seam */}
            <path d="M474 560 L470 728 M726 560 L730 728" stroke="#000" strokeOpacity=".1" strokeWidth="2" />
            <rect x="455" y="690" width="290" height="14" fill="#d7bf8c" opacity=".38" />
            <rect x="455" y="690" width="290" height="2" fill="#fff" opacity=".28" />
            <path d="M448 728 L752 728" stroke="#000" strokeOpacity=".35" strokeWidth="3" />
            {/* label */}
            <g transform="translate(601 632) rotate(-.8)">
              <rect x="-121" y="-38" width="242" height="78" rx="2" fill="#000" opacity=".22" transform="translate(2 4)" filter="url(#soft)" />
              <rect x="-120" y="-40" width="240" height="78" rx="1.5" fill="url(#labelPaper)" />
              <text x="-4" y="9" textAnchor="middle" fontFamily="Sora, Inter, Arial, sans-serif" fontWeight="700" fontSize="30" letterSpacing=".8" textLength="208" lengthAdjust="spacingAndGlyphs" fill="#2d2f34" opacity=".9">LOST &amp; FOUND</text>
              <rect x="-134" y="-46" width="30" height="14" fill="#e8d7a6" opacity=".72" transform="rotate(-38 -119 -39)" />
              <rect x="104" y="26" width="30" height="14" fill="#e8d7a6" opacity=".72" transform="rotate(-38 119 33)" />
            </g>
          </>
        )}
      </g>
    </svg>
  );
}
