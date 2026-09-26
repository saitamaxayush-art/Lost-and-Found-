import { useEffect, useRef } from "react";

/**
 * SearchDissolveLoader
 *
 * A dark-stage, glowing morphing-orb loader inspired by the reference video:
 * an organic blob with a soft neon rim-light that continuously reshapes
 * itself while its glow cycles slowly through the site's own warm amber →
 * coral → terracotta palette, floating over a black glass stage with a
 * drifting ambient bloom behind it.
 */

// Warm, on-theme glow stops (amber gold → coral → orange accent → deep peach)
const PALETTE = [
  [245, 197, 66], // amber gold
  [232, 140, 74], // warm coral
  [217, 130, 43], // peach accent
  [181, 101, 26], // deep peach accent
];

function lerp(a, b, f) {
  return a + (b - a) * f;
}

// smoothstep easing so the hue cross-fade never "pops"
function ease(f) {
  return f * f * (3 - 2 * f);
}

function paletteColor(phase) {
  const n = PALETTE.length;
  const wrapped = ((phase % n) + n) % n;
  const i0 = Math.floor(wrapped);
  const i1 = (i0 + 1) % n;
  const f = ease(wrapped - i0);
  const a = PALETTE[i0];
  const b = PALETTE[i1];
  return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];
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

export default function SearchDissolveLoader({
  label = "Searching campus records…",
  query = "",
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    let animId = 0;
    let cancelled = false;
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function resize() {
      if (!container) return;
      width = container.clientWidth;
      height = 220;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const startTime = performance.now();
    // Two large, slow-drifting ambient cloud blooms behind the orb — echoes the
    // soft smoky glow surrounding the reference orb, kept fully on-theme.
    const clouds = [
      { dx: -0.28, dy: -0.12, speed: 0.18, scale: 1.35, phase: 0 },
      { dx: 0.32, dy: 0.16, speed: 0.14, scale: 1.6, phase: 2.1 },
    ];

    function render(now) {
      if (cancelled) return;
      const t = reduceMotion ? 0 : (now - startTime) / 1000;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const r = 28;
      ctx.save();
      roundRect(ctx, 0, 0, width, height, r);
      ctx.clip();

      // 1. Deep near-black glass stage with a faint warm vignette
      const bgGrad = ctx.createRadialGradient(
        width / 2,
        height * 0.32,
        0,
        width / 2,
        height * 0.55,
        Math.max(width, height) * 0.75
      );
      bgGrad.addColorStop(0, "#0f0906");
      bgGrad.addColorStop(0.55, "#080402");
      bgGrad.addColorStop(1, "#030201");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height * 0.44 + Math.sin(t * 0.9) * 6;
      const baseR = Math.min(52, width * 0.11);

      // 2. Palette phase — cycles slowly through the theme's warm hues
      const cyclePeriod = 6.5;
      const phase = t / cyclePeriod;
      const [cr, cg, cb] = paletteColor(phase);
      const glow = `rgba(${cr | 0}, ${cg | 0}, ${cb | 0}`;

      // 3. Drifting ambient cloud blooms (soft, blurred, on-theme)
      clouds.forEach((c) => {
        const ccx = cx + Math.sin(t * c.speed + c.phase) * width * c.dx;
        const ccy = cy + Math.cos(t * c.speed * 0.8 + c.phase) * height * c.dy;
        const rad = baseR * 3.4 * c.scale;
        const cloudGrad = ctx.createRadialGradient(ccx, ccy, 0, ccx, ccy, rad);
        cloudGrad.addColorStop(0, `${glow}, 0.16)`);
        cloudGrad.addColorStop(1, `${glow}, 0)`);
        ctx.fillStyle = cloudGrad;
        ctx.fillRect(0, 0, width, height);
      });

      // 4. Organic, continuously morphing blob outline (harmonic + phase-shifted)
      const aspectX = 1.02;
      const aspectY = 1.0;
      const points = [];
      const numSteps = 96;
      for (let i = 0; i < numSteps; i++) {
        const theta = (i / numSteps) * Math.PI * 2;
        const w1 = Math.sin(theta * 2 + t * 0.85) * 8.5;
        const w2 = Math.cos(theta * 3 - t * 0.62) * 5.2;
        const w3 = Math.sin(theta * 5 + t * 1.05) * 2.4;
        const radius = baseR + w1 + w2 + w3;
        points.push({
          x: cx + Math.cos(theta) * radius * aspectX,
          y: cy + Math.sin(theta) * radius * aspectY,
        });
      }

      function drawFluidPath() {
        ctx.beginPath();
        const len = points.length;
        ctx.moveTo((points[0].x + points[len - 1].x) / 2, (points[0].y + points[len - 1].y) / 2);
        for (let i = 0; i < len; i++) {
          const next = points[(i + 1) % len];
          const midX = (points[i].x + next.x) / 2;
          const midY = (points[i].y + next.y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
        }
        ctx.closePath();
      }

      // 5. Near-black glassy interior with a faint inner sheen (depth, not flat)
      ctx.save();
      drawFluidPath();
      ctx.clip();
      const innerGrad = ctx.createRadialGradient(
        cx - baseR * 0.3,
        cy - baseR * 0.35,
        2,
        cx,
        cy,
        baseR * 1.5
      );
      innerGrad.addColorStop(0, `${glow}, 0.22)`);
      innerGrad.addColorStop(0.45, "rgba(10, 6, 4, 0.9)");
      innerGrad.addColorStop(1, "rgba(2, 1, 1, 0.98)");
      ctx.fillStyle = innerGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // 6. Soft neon rim glow — layered blurred strokes, brightest at the core
      ctx.save();
      drawFluidPath();
      ctx.shadowColor = `${glow}, 0.95)`;
      ctx.shadowBlur = 26;
      ctx.strokeStyle = `${glow}, 0.55)`;
      ctx.lineWidth = 5;
      ctx.stroke();

      ctx.shadowBlur = 14;
      ctx.strokeStyle = `${glow}, 0.85)`;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      ctx.shadowBlur = 4;
      ctx.strokeStyle = "rgba(255, 248, 235, 0.9)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      ctx.restore(); // release stage clip

      // 7. "Loading" caption — gentle breathing pulse, warm cream on black
      const textY = height - 30;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = '600 14px "Sora", sans-serif';
      const textAlpha = 0.72 + 0.22 * Math.sin(t * 1.8);
      ctx.fillStyle = `rgba(251, 243, 228, ${textAlpha})`;
      const displayText = query ? `Searching for "${query}"…` : label;
      ctx.fillText(displayText, cx, textY);

      // 8. Hairline border around the stage plate
      ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      ctx.lineWidth = 1;
      roundRect(ctx, 0.5, 0.5, width - 1, height - 1, r);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);

    return () => {
      cancelled = true;
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [label, query]);

  return (
    <div className="sr-loader-container" role="status" aria-live="polite">
      <div className="sr-streak-stage" ref={containerRef}>
        <canvas ref={canvasRef} aria-hidden="true" />
      </div>
      <p className="sr-streak-caption">
        Scanning reported campus items, descriptions &amp; categories…
      </p>
      <span className="sr-sr">Searching reported items, please wait</span>
    </div>
  );
}
