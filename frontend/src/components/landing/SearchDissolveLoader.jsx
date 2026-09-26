import { useEffect, useRef } from "react";

// A smooth "dissolve into static / reform into text" loading animation,
// in the site's own navy + amber + cream palette. Built entirely on canvas
// so it stays crisp at any size and never drops frames.
//
// Cycle: hold as solid text -> a soft light-sweep wipes left to right,
// turning each letter-column into a flicker of thin vertical static bars
// -> hold as static -> the same sweep runs again, turning the static back
// into solid text -> hold -> repeat.

const FONT_WEIGHT = 700;
const FONT_FAMILY = '"Sora", "Inter", sans-serif';

const PHASE = {
  HOLD_TEXT: 0,
  DISSOLVE: 1,
  HOLD_STATIC: 2,
  REFORM: 3,
};

const DURATIONS = {
  [PHASE.HOLD_TEXT]: 500,
  [PHASE.DISSOLVE]: 700,
  [PHASE.HOLD_STATIC]: 480,
  [PHASE.REFORM]: 700,
};

function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

// Deterministic pseudo-random in [0,1) from a couple of integers, so the
// flicker is stable within a frame-bucket instead of pure chaos.
function hashRand(a, b) {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export default function SearchDissolveLoader({
  label = "Searching",
  caption = "Looking through everything reported…",
  height = 190,
}) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");

    let raf = 0;
    let cancelled = false;
    let cssW = 0;
    let cssH = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Per-column ink spans (top/bottom y of glyph ink at that x), sampled
    // from an offscreen render of the label text.
    let columns = [];
    let textX = 0;
    let textY = 0;
    let fontSize = 40;

    function measure() {
      cssW = wrap.clientWidth;
      cssH = height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;

      fontSize = Math.max(28, Math.min(46, cssW * 0.07));
      const off = document.createElement("canvas");
      off.width = Math.round(cssW * dpr);
      off.height = Math.round(cssH * dpr);
      const octx = off.getContext("2d");
      octx.scale(dpr, dpr);
      octx.font = `${FONT_WEIGHT} ${fontSize}px ${FONT_FAMILY}`;
      octx.textBaseline = "alphabetic";
      const metrics = octx.measureText(label);
      const textW = metrics.width;
      const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.75;
      const descent = metrics.actualBoundingBoxDescent || fontSize * 0.22;

      textX = (cssW - textW) / 2;
      textY = cssH / 2 + (ascent - descent) / 2;

      octx.clearRect(0, 0, cssW, cssH);
      octx.fillStyle = "#fff";
      octx.fillText(label, textX, textY);

      const img = octx.getImageData(0, 0, off.width, off.height).data;
      const step = Math.max(2, Math.round(2 * dpr)) / dpr; // ~2css px per sampled column
      const cols = [];
      const xStart = Math.max(0, Math.floor(textX) - 2);
      const xEnd = Math.min(cssW, Math.ceil(textX + textW) + 2);
      for (let x = xStart; x <= xEnd; x += step) {
        const px = Math.round(x * dpr);
        let minY = -1;
        let maxY = -1;
        for (let y = 0; y < off.height; y++) {
          const idx = (y * off.width + px) * 4 + 3; // alpha channel
          if (img[idx] > 40) {
            if (minY === -1) minY = y;
            maxY = y;
          }
        }
        if (minY !== -1) {
          cols.push({ x, minY: minY / dpr, maxY: maxY / dpr });
        }
      }
      columns = cols;
    }

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(wrap);

    // Palette pulled straight from the site's own tokens.
    const NAVY = "#0b1f4d";
    const NAVY_LIGHT = "#17357a";
    const CREAM = "#fbf3e4";
    const AMBER = "#f5c542";

    let phase = PHASE.HOLD_TEXT;
    let phaseStart = performance.now();

    function draw(now) {
      if (cancelled) return;
      const elapsed = now - phaseStart;
      const dur = DURATIONS[phase];
      let raw = dur ? Math.min(1, elapsed / dur) : 1;
      const eased = easeInOutSine(raw);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      // Panel background: navy plate, matches --navy used elsewhere on
      // this same page (mock-btn / mock-bell), so it reads as on-brand.
      const grad = ctx.createLinearGradient(0, 0, cssW, cssH);
      grad.addColorStop(0, NAVY);
      grad.addColorStop(1, NAVY_LIGHT);
      ctx.fillStyle = grad;
      roundRect(ctx, 0, 0, cssW, cssH, 22);
      ctx.fill();

      const sweeping = phase === PHASE.DISSOLVE || phase === PHASE.REFORM;
      const edgeX = sweeping ? eased * cssW : phase === PHASE.HOLD_STATIC ? cssW : 0;

      // Which horizontal band is still/already crisp solid text, vs which
      // band is rendered as flickering static bars.
      let solidX0 = 0;
      let solidX1 = 0;
      if (phase === PHASE.HOLD_TEXT) {
        solidX0 = 0;
        solidX1 = cssW;
      } else if (phase === PHASE.DISSOLVE) {
        // sweep turns solid -> static left to right: right of the edge is
        // still solid, left of it has already dissolved.
        solidX0 = edgeX;
        solidX1 = cssW;
      } else if (phase === PHASE.REFORM) {
        // sweep turns static -> solid left to right: left of the edge is
        // solid again, right of it hasn't reformed yet.
        solidX0 = 0;
        solidX1 = edgeX;
      }

      // Crisp solid glyphs, clipped to the region that's currently "formed".
      if (solidX1 > solidX0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(solidX0, 0, solidX1 - solidX0, cssH);
        ctx.clip();
        ctx.fillStyle = CREAM;
        ctx.font = `${FONT_WEIGHT} ${fontSize}px ${FONT_FAMILY}`;
        ctx.textBaseline = "alphabetic";
        ctx.fillText(label, textX, textY);
        ctx.restore();
      }

      // Flickering static bars for the region that isn't solid right now.
      if (phase !== PHASE.HOLD_TEXT) {
        const bucket = Math.floor(now / 70);
        columns.forEach((col, i) => {
          if (col.x >= solidX0 && col.x <= solidX1) return; // covered by solid glyphs above
          const span = Math.max(4, col.maxY - col.minY);
          const dashCount = 2 + Math.floor(hashRand(i, bucket) * 3);
          for (let d = 0; d < dashCount; d++) {
            const r1 = hashRand(i * 3 + d, bucket);
            const r2 = hashRand(i * 7 + d, bucket + 1);
            const r3 = hashRand(i * 11 + d, bucket + 2);
            const dashH = 2 + r2 * (span * 0.55);
            const dashY = col.minY + r1 * Math.max(1, span - dashH);
            const amber = r3 > 0.78;
            ctx.fillStyle = amber ? AMBER : CREAM;
            ctx.globalAlpha = 0.45 + r3 * 0.55;
            ctx.fillRect(col.x, dashY, 1.6, dashH);
          }
          ctx.globalAlpha = 1;
        });
      }

      // Soft glowing scan line at the sweep edge for a premium, smooth feel.
      if (sweeping) {
        const glowGrad = ctx.createLinearGradient(edgeX - 16, 0, edgeX + 16, 0);
        glowGrad.addColorStop(0, "rgba(245,197,66,0)");
        glowGrad.addColorStop(0.5, "rgba(245,197,66,0.9)");
        glowGrad.addColorStop(1, "rgba(245,197,66,0)");
        ctx.fillStyle = glowGrad;
        ctx.fillRect(edgeX - 16, 8, 32, cssH - 16);
      }

      if (raw >= 1) {
        phase = (phase + 1) % 4;
        phaseStart = now;
      }

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [label, height]);

  return (
    <div className="sr-loader" ref={wrapRef} role="status" aria-live="polite">
      <canvas ref={canvasRef} aria-hidden="true" />
      <span className="sr-loader-caption">{caption}</span>
      <span className="sr-sr">Searching, please wait</span>
    </div>
  );
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
