import { useEffect, useRef } from "react";

/**
 * SearchDissolveLoader
 *
 * An organic "flow state" fluid orb animation inspired by high-end AI product loading
 * motions (Dribbble reference: afroman AI technology loading animation).
 * Features an undulating, morphing liquid blob with internal chromatic flow,
 * graded in rich warm cocoa, mocha, caramel, and terracotta tones that seamlessly
 * match the website's warm palette without being overly yellow/golden.
 */
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

    function resize() {
      if (!container) return;
      width = container.clientWidth;
      height = 160; // generous canvas height for the flow state fluid orb
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

    function render(now) {
      if (cancelled) return;
      const t = (now - startTime) / 1000;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // 1. Stage container: deep roasted espresso / dark cocoa plate with rounded corners
      const r = 26;
      ctx.save();
      roundRect(ctx, 0, 0, width, height, r);
      ctx.clip();

      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#20120a");
      bgGrad.addColorStop(0.5, "#180c06");
      bgGrad.addColorStop(1, "#120803");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Physics & Center of the Flow State Orb
      const cx = width / 2;
      // Gentle floating zero-g vertical drift
      const cy = height * 0.43 + Math.sin(t * 1.5) * 6;

      const baseR = Math.min(48, width * 0.1);
      const aspectX = 1.48; // elongated horizontal flow shape
      const aspectY = 0.88;

      // 3. Ambient warm mocha/caramel backlight aura bloom
      const auraPulse = Math.sin(t * 2.0) * 4;
      const auraGrad = ctx.createRadialGradient(
        cx,
        cy,
        baseR * 0.3,
        cx,
        cy,
        baseR * aspectX * 1.8 + auraPulse
      );
      auraGrad.addColorStop(0, "rgba(184, 106, 52, 0.28)"); // warm caramel
      auraGrad.addColorStop(0.45, "rgba(115, 70, 43, 0.15)"); // mocha
      auraGrad.addColorStop(0.75, "rgba(74, 40, 20, 0.05)"); // deep cocoa
      auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, baseR * aspectX * 1.8 + auraPulse, baseR * aspectY * 1.8 + auraPulse, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. Trace the organic undulating fluid boundary (harmonic bezier points)
      // Generates a soft, breathing, continuous flow-state morph
      const points = [];
      const numSteps = 72;
      for (let i = 0; i < numSteps; i++) {
        const theta = (i / numSteps) * Math.PI * 2;
        // Fluid harmonic wave frequencies
        const w1 = Math.sin(theta * 2 + t * 1.6) * 6.5;
        const w2 = Math.cos(theta * 3 - t * 1.3) * 4.2;
        const w3 = Math.sin(theta * 4 + t * 2.1) * 2.8;
        const radius = baseR + w1 + w2 + w3;

        const px = cx + Math.cos(theta) * (radius * aspectX);
        const py = cy + Math.sin(theta) * (radius * aspectY);
        points.push({ x: px, y: py });
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

      // 5. Flowing internal color gradient (Brown-Graded & On-Theme)
      // Rotates and morphs slowly between rich cocoa, warm caramel, mocha, and cream
      ctx.save();
      drawFluidPath();
      ctx.clip();

      // Primary internal body gradient: warm mocha -> caramel -> roasted espresso
      const flowAngle = t * 0.9;
      const gradX0 = cx + Math.cos(flowAngle) * (baseR * 0.9);
      const gradY0 = cy + Math.sin(flowAngle) * (baseR * 0.6);
      const gradX1 = cx - Math.cos(flowAngle) * (baseR * 0.9);
      const gradY1 = cy - Math.sin(flowAngle) * (baseR * 0.6);

      const flowGrad = ctx.createLinearGradient(gradX0, gradY0, gradX1, gradY1);
      flowGrad.addColorStop(0, "#c97a44"); // warm caramel terracotta
      flowGrad.addColorStop(0.3, "#944e26"); // rich spiced mocha
      flowGrad.addColorStop(0.65, "#5a2d16"); // deep roasted cocoa brown
      flowGrad.addColorStop(1, "#36180a"); // dark espresso base
      ctx.fillStyle = flowGrad;
      ctx.fillRect(0, 0, width, height);

      // Secondary internal fluid swirl (dynamic rotating light current)
      const swirlX = cx + Math.sin(t * 1.4) * (baseR * 0.45);
      const swirlY = cy + Math.cos(t * 1.8) * (baseR * 0.3);
      const swirlGrad = ctx.createRadialGradient(swirlX, swirlY, 2, swirlX, swirlY, baseR * 1.2);
      swirlGrad.addColorStop(0, "rgba(242, 206, 178, 0.75)"); // soft cream highlight
      swirlGrad.addColorStop(0.35, "rgba(212, 125, 62, 0.55)"); // warm caramel amber
      swirlGrad.addColorStop(0.7, "rgba(148, 78, 38, 0.25)"); // mocha
      swirlGrad.addColorStop(1, "rgba(54, 24, 10, 0)");
      ctx.fillStyle = swirlGrad;
      ctx.fillRect(0, 0, width, height);

      // Tertiary deep shadow pocket for 3D liquid depth
      const shadowX = cx - Math.sin(t * 1.3) * (baseR * 0.5);
      const shadowY = cy - Math.cos(t * 1.5) * (baseR * 0.35);
      const shadowGrad = ctx.createRadialGradient(shadowX, shadowY, 5, shadowX, shadowY, baseR * 0.95);
      shadowGrad.addColorStop(0, "rgba(30, 14, 6, 0.85)"); // deep cocoa shadow
      shadowGrad.addColorStop(0.6, "rgba(50, 24, 10, 0.3)");
      shadowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle warm incandescent core light
      const coreX = cx + Math.sin(t * 2.2) * 10;
      const coreY = cy + Math.cos(t * 2.0) * 6;
      const coreGrad = ctx.createRadialGradient(coreX, coreY, 0, coreX, coreY, baseR * 0.55);
      coreGrad.addColorStop(0, "rgba(255, 238, 222, 0.8)"); // warm cream pearl
      coreGrad.addColorStop(0.5, "rgba(224, 142, 85, 0.35)"); // caramel
      coreGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = coreGrad;
      ctx.fillRect(0, 0, width, height);

      ctx.restore();

      // 6. Translucent glowing glass perimeter rim (soft caramel-cream stroke)
      ctx.save();
      drawFluidPath();
      ctx.strokeStyle = "rgba(240, 205, 175, 0.55)";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Delicate outer rim glow
      ctx.strokeStyle = "rgba(184, 106, 52, 0.25)";
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.restore();

      // 7. Organic fluid specular highlight (curves along top surface)
      ctx.save();
      ctx.beginPath();
      const specStart = Math.floor(numSteps * 0.65);
      const specEnd = Math.floor(numSteps * 0.88);
      ctx.moveTo(points[specStart].x, points[specStart].y);
      for (let i = specStart; i <= specEnd; i++) {
        const pt = points[i];
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = "rgba(255, 245, 235, 0.72)";
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();

      // 8. "Searching..." typography centered below the flow state orb
      const textY = height - 24;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = '600 14px "Sora", sans-serif';

      const textAlpha = 0.85 + 0.15 * Math.sin(t * 2.4);
      ctx.fillStyle = `rgba(251, 243, 228, ${textAlpha})`;
      ctx.letterSpacing = "0.03em";

      const displayText = query ? `Searching for "${query}"…` : label;
      ctx.fillText(displayText, width / 2, textY);

      // 9. Subtle outer border around the stage plate
      ctx.strokeStyle = "rgba(184, 106, 52, 0.22)";
      ctx.lineWidth = 1;
      roundRect(ctx, 0.5, 0.5, width - 1, height - 1, r);
      ctx.stroke();

      ctx.restore();

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
        Scanning reported campus items, descriptions & categories…
      </p>
      <span className="sr-sr">Searching reported items, please wait</span>
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
