import { useEffect, useRef } from "react";

/**
 * SearchDissolveLoader
 *
 * A buttery-smooth, ethereal search animation featuring a large, glowing
 * floating oval bubble that moves to-and-fro horizontally with a gentle
 * zero-gravity float. Designed specifically in the website's warm amber,
 * cream, and terracotta theme with soft, rounded edges and no sharp lines.
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
      height = 150; // generous, smooth stage for the floating oval bubble
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

      // 1. Sleek warm dark cocoa stage with soft, rounded corners (26px)
      const r = 26;
      ctx.save();
      roundRect(ctx, 0, 0, width, height, r);
      ctx.clip();

      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#23140a");
      bgGrad.addColorStop(0.5, "#1c0f07");
      bgGrad.addColorStop(1, "#150a04");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Ambient warm radial backlight in the center
      const ambientGrad = ctx.createRadialGradient(
        width / 2,
        height * 0.42,
        15,
        width / 2,
        height * 0.42,
        width * 0.65
      );
      ambientGrad.addColorStop(0, "rgba(217, 130, 43, 0.14)");
      ambientGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = ambientGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Physics of the large floating oval bubble:
      // Smooth sinusoidal to-and-fro horizontal motion
      const speed = 1.7; // calm, luxurious, ultra-smooth cadence
      const phase = t * speed - Math.PI / 2;
      const progress = (Math.sin(phase) + 1) / 2; // 0 to 1

      // Gentle floating vertical oscillation (zero-g float)
      const floatY = Math.sin(t * 2.2) * 5.5;

      const margin = Math.min(110, width * 0.2);
      const travelW = width - margin * 2;
      const bubbleX = margin + progress * travelW;
      const bubbleY = height * 0.42 + floatY;

      // Large oval dimensions with a soft breathing pulse
      const pulse = Math.sin(t * 3.0) * 2.5;
      const radiusX = 66 + pulse; // ~132px wide oval
      const radiusY = 36 + pulse * 0.6; // ~72px high oval

      // 3. Ethereal outer aura bloom around the oval bubble
      const auraGrad = ctx.createRadialGradient(
        bubbleX,
        bubbleY,
        radiusY * 0.4,
        bubbleX,
        bubbleY,
        radiusX * 1.55
      );
      auraGrad.addColorStop(0, "rgba(245, 197, 66, 0.32)");
      auraGrad.addColorStop(0.4, "rgba(217, 130, 43, 0.16)");
      auraGrad.addColorStop(0.8, "rgba(181, 101, 26, 0.05)");
      auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.ellipse(bubbleX, bubbleY, radiusX * 1.55, radiusY * 1.55, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. Large floating oval bubble body with multi-stop radial gradient
      // Offset the gradient light source slightly top-left for organic volume
      const lightOffX = bubbleX - radiusX * 0.22;
      const lightOffY = bubbleY - radiusY * 0.28;

      const bodyGrad = ctx.createRadialGradient(
        lightOffX,
        lightOffY,
        radiusY * 0.12,
        bubbleX,
        bubbleY,
        radiusX * 1.05
      );
      bodyGrad.addColorStop(0, "rgba(255, 252, 242, 0.96)"); // warm incandescent core
      bodyGrad.addColorStop(0.25, "rgba(250, 222, 126, 0.88)"); // luminous sunburst amber
      bodyGrad.addColorStop(0.55, "rgba(224, 134, 42, 0.65)"); // rich warm peach-terracotta
      bodyGrad.addColorStop(0.85, "rgba(181, 95, 22, 0.42)"); // deep amber rim
      bodyGrad.addColorStop(1, "rgba(148, 68, 14, 0.15)"); // soft transparent perimeter

      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.ellipse(bubbleX, bubbleY, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.fill();

      // 5. Delicately rounded glowing rim of the bubble
      ctx.strokeStyle = "rgba(255, 250, 235, 0.65)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(bubbleX, bubbleY, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 6. Floating glassy specular reflection (crescent gloss highlight)
      const specX = bubbleX - radiusX * 0.28;
      const specY = bubbleY - radiusY * 0.32;
      const specRx = radiusX * 0.42;
      const specRy = radiusY * 0.24;

      const specGrad = ctx.createRadialGradient(specX, specY, 1, specX, specY, specRx);
      specGrad.addColorStop(0, "rgba(255, 255, 255, 0.85)");
      specGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.35)");
      specGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = specGrad;
      ctx.beginPath();
      ctx.ellipse(specX, specY, specRx, specRy, (-12 * Math.PI) / 180, 0, Math.PI * 2);
      ctx.fill();

      // 7. Subtle inner floating light bead inside the bubble
      const innerGlow = ctx.createRadialGradient(bubbleX, bubbleY, 0, bubbleX, bubbleY, radiusY * 0.6);
      innerGlow.addColorStop(0, "rgba(255, 255, 255, 0.75)");
      innerGlow.addColorStop(0.5, "rgba(245, 197, 66, 0.3)");
      innerGlow.addColorStop(1, "rgba(217, 130, 43, 0)");
      ctx.fillStyle = innerGlow;
      ctx.beginPath();
      ctx.ellipse(bubbleX, bubbleY, radiusX * 0.5, radiusY * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 8. "Searching..." text centered below the floating bubble
      const textY = height - 24;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = '600 14px "Sora", sans-serif';

      const textAlpha = 0.85 + 0.15 * Math.sin(t * 2.5);
      ctx.fillStyle = `rgba(251, 243, 228, ${textAlpha})`;
      ctx.letterSpacing = "0.03em";

      const displayText = query ? `Searching for "${query}"…` : label;
      ctx.fillText(displayText, width / 2, textY);

      // 9. Delicate warm amber outer border of the stage
      ctx.strokeStyle = "rgba(217, 130, 43, 0.22)";
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
