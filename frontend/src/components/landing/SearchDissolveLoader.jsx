import { useEffect, useRef } from "react";

/**
 * SearchDissolveLoader
 *
 * A bespoke, ultra-smooth light-streak search animation inspired by the
 * high-end Dribbble reference (horizontal luminous beam with anamorphic lens flare).
 * Rendered at 60/120fps on canvas with the site's warm cream, amber, and terracotta theme.
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
      height = 140; // compact, sleek stage height
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

      // 1. Dark warm espresso/cocoa background plate with rounded corners
      const r = 22;
      ctx.save();
      roundRect(ctx, 0, 0, width, height, r);
      ctx.clip();

      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#26150c");
      bgGrad.addColorStop(0.5, "#1f1008");
      bgGrad.addColorStop(1, "#180c06");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle warm ambient radial back-glow
      const ambientGrad = ctx.createRadialGradient(
        width / 2,
        height * 0.45,
        10,
        width / 2,
        height * 0.45,
        width * 0.6
      );
      ambientGrad.addColorStop(0, "rgba(217, 130, 43, 0.12)");
      ambientGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = ambientGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Physics & trajectory of the glowing light beam
      // Smooth sinusoidal back-and-forth travel
      const speed = 2.4; // smooth, steady cadence
      const phase = t * speed - Math.PI / 2;
      const progress = (Math.sin(phase) + 1) / 2; // 0 to 1
      const velocity = Math.cos(phase); // -1 to +1

      const margin = Math.min(90, width * 0.16);
      const travelW = width - margin * 2;
      const beamX = margin + progress * travelW;
      const beamY = height * 0.44;

      // 3. Horizontal laser guide line (faint across stage, intense near beam)
      const guideGrad = ctx.createLinearGradient(0, 0, width, 0);
      guideGrad.addColorStop(0, "rgba(217, 130, 43, 0.04)");
      guideGrad.addColorStop(Math.max(0, (beamX - 160) / width), "rgba(217, 130, 43, 0.15)");
      guideGrad.addColorStop(beamX / width, "rgba(245, 197, 66, 0.85)");
      guideGrad.addColorStop(Math.min(1, (beamX + 160) / width), "rgba(217, 130, 43, 0.15)");
      guideGrad.addColorStop(1, "rgba(217, 130, 43, 0.04)");

      ctx.fillStyle = guideGrad;
      ctx.fillRect(0, beamY - 0.75, width, 1.5);

      // 4. Anamorphic lens flare petals (angled glowing wings inspired by reference)
      const petalW = 100 + Math.abs(velocity) * 50;
      const petalH = 34 + Math.abs(velocity) * 16;

      ctx.save();
      ctx.translate(beamX, beamY);

      // Petal 1 (+26 deg)
      ctx.save();
      ctx.rotate((26 * Math.PI) / 180);
      const petalGrad1 = ctx.createRadialGradient(0, 0, 4, 0, 0, petalW);
      petalGrad1.addColorStop(0, "rgba(245, 197, 66, 0.22)");
      petalGrad1.addColorStop(0.4, "rgba(217, 130, 43, 0.09)");
      petalGrad1.addColorStop(1, "rgba(217, 130, 43, 0)");
      ctx.fillStyle = petalGrad1;
      ctx.beginPath();
      ctx.ellipse(0, 0, petalW, petalH, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Petal 2 (-26 deg)
      ctx.save();
      ctx.rotate((-26 * Math.PI) / 180);
      const petalGrad2 = ctx.createRadialGradient(0, 0, 4, 0, 0, petalW);
      petalGrad2.addColorStop(0, "rgba(245, 197, 66, 0.22)");
      petalGrad2.addColorStop(0.4, "rgba(217, 130, 43, 0.09)");
      petalGrad2.addColorStop(1, "rgba(217, 130, 43, 0)");
      ctx.fillStyle = petalGrad2;
      ctx.beginPath();
      ctx.ellipse(0, 0, petalW, petalH, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore();

      // 5. Large spherical outer aura bloom
      const auraR = 65 + Math.abs(velocity) * 20;
      const auraGrad = ctx.createRadialGradient(beamX, beamY, 4, beamX, beamY, auraR);
      auraGrad.addColorStop(0, "rgba(245, 197, 66, 0.45)");
      auraGrad.addColorStop(0.35, "rgba(217, 130, 43, 0.22)");
      auraGrad.addColorStop(0.7, "rgba(181, 101, 26, 0.08)");
      auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(beamX, beamY, auraR, 0, Math.PI * 2);
      ctx.fill();

      // 6. Elongated luminous streak (head + trailing comet tail)
      // Tail stretches behind the direction of motion
      const streakLen = 70 + Math.abs(velocity) * 80;
      const tailX = velocity >= 0 ? beamX - streakLen : beamX + streakLen;

      const streakGrad = ctx.createLinearGradient(beamX, 0, tailX, 0);
      streakGrad.addColorStop(0, "rgba(255, 255, 255, 0.98)");
      streakGrad.addColorStop(0.18, "rgba(245, 215, 110, 0.95)");
      streakGrad.addColorStop(0.5, "rgba(224, 132, 40, 0.55)");
      streakGrad.addColorStop(0.82, "rgba(181, 101, 26, 0.18)");
      streakGrad.addColorStop(1, "rgba(181, 101, 26, 0)");

      ctx.fillStyle = streakGrad;
      ctx.beginPath();
      const headH = 8.5;
      const tailH = 3;
      if (velocity >= 0) {
        ctx.moveTo(beamX, beamY - headH / 2);
        ctx.arc(beamX, beamY, headH / 2, -Math.PI / 2, Math.PI / 2, false);
        ctx.lineTo(tailX, beamY + tailH / 2);
        ctx.lineTo(tailX, beamY - tailH / 2);
      } else {
        ctx.moveTo(beamX, beamY - headH / 2);
        ctx.arc(beamX, beamY, headH / 2, Math.PI / 2, -Math.PI / 2, false);
        ctx.lineTo(tailX, beamY - tailH / 2);
        ctx.lineTo(tailX, beamY + tailH / 2);
      }
      ctx.closePath();
      ctx.fill();

      // 7. Hot white-hot laser filament at the center core
      const coreW = 28 + Math.abs(velocity) * 16;
      const coreH = 3.5;
      const coreGrad = ctx.createRadialGradient(beamX, beamY, 1, beamX, beamY, coreW);
      coreGrad.addColorStop(0, "#ffffff");
      coreGrad.addColorStop(0.4, "rgba(255, 250, 220, 0.95)");
      coreGrad.addColorStop(1, "rgba(245, 197, 66, 0)");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.ellipse(beamX, beamY, coreW, coreH, 0, 0, Math.PI * 2);
      ctx.fill();

      // Horizontal bright flare spikes
      const spikeW = 120 + Math.abs(velocity) * 60;
      const spikeGrad = ctx.createLinearGradient(beamX - spikeW, 0, beamX + spikeW, 0);
      spikeGrad.addColorStop(0, "rgba(245, 197, 66, 0)");
      spikeGrad.addColorStop(0.4, "rgba(255, 255, 255, 0.6)");
      spikeGrad.addColorStop(0.5, "rgba(255, 255, 255, 1.0)");
      spikeGrad.addColorStop(0.6, "rgba(255, 255, 255, 0.6)");
      spikeGrad.addColorStop(1, "rgba(245, 197, 66, 0)");
      ctx.fillStyle = spikeGrad;
      ctx.fillRect(beamX - spikeW, beamY - 1, spikeW * 2, 2);

      // 8. "Searching..." text underneath with gentle breathing glow
      const textY = height - 26;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = '600 13.5px "Sora", sans-serif';

      const textAlpha = 0.82 + 0.18 * Math.sin(t * 3);
      ctx.fillStyle = `rgba(251, 243, 228, ${textAlpha})`;
      ctx.letterSpacing = "0.04em";

      const displayText = query ? `Searching for "${query}"…` : label;
      ctx.fillText(displayText, width / 2, textY);

      // 9. Delicate amber inner card border
      ctx.strokeStyle = "rgba(217, 130, 43, 0.25)";
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
        Matching keywords across reported campus items, descriptions & categories…
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
