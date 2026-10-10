import { useEffect, useRef } from "react";

/**
 * useTilt: High-end physical 3D card tilt with smooth inertial damping (lerp).
 * Prevents abrupt see-saw snapping and gives the card a velvety, weightless feel.
 */
export function useTilt({
  maxTilt = 2.2,
  perspective = 1200,
  damping = 0.075,
} = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isFinePointer || prefersReducedMotion) return;

    let rafId = null;
    let isHovered = false;

    // Current animated values (lerped)
    let currentTiltX = 0;
    let currentTiltY = 0;
    let currentSpecX = 50;
    let currentSpecY = 30;
    let currentSpecOpacity = 0;

    // Target values based on pointer position
    let targetTiltX = 0;
    let targetTiltY = 0;
    let targetSpecX = 50;
    let targetSpecY = 30;
    let targetSpecOpacity = 0;

    const tick = () => {
      // Damped linear interpolation for silky hydraulic smoothing
      currentTiltX += (targetTiltX - currentTiltX) * damping;
      currentTiltY += (targetTiltY - currentTiltY) * damping;
      currentSpecX += (targetSpecX - currentSpecX) * damping;
      currentSpecY += (targetSpecY - currentSpecY) * damping;
      currentSpecOpacity += (targetSpecOpacity - currentSpecOpacity) * damping;

      el.style.transform = `perspective(${perspective}px) rotateX(${currentTiltX.toFixed(3)}deg) rotateY(${currentTiltY.toFixed(3)}deg) translateZ(0)`;
      el.style.setProperty("--specular-x", `${currentSpecX.toFixed(2)}%`);
      el.style.setProperty("--specular-y", `${currentSpecY.toFixed(2)}%`);
      el.style.setProperty("--specular-opacity", `${currentSpecOpacity.toFixed(3)}`);

      const dx = Math.abs(targetTiltX - currentTiltX);
      const dy = Math.abs(targetTiltY - currentTiltY);
      const dop = Math.abs(targetSpecOpacity - currentSpecOpacity);

      // Continue animating while hovered or while easing back to rest
      if (isHovered || dx > 0.005 || dy > 0.005 || dop > 0.005) {
        rafId = requestAnimationFrame(tick);
      } else {
        // Complete rest state
        currentTiltX = targetTiltX;
        currentTiltY = targetTiltY;
        currentSpecOpacity = targetSpecOpacity;
        el.style.transform = `perspective(${perspective}px) rotateX(${currentTiltX}deg) rotateY(${currentTiltY}deg) translateZ(0)`;
        el.style.setProperty("--specular-opacity", `${currentSpecOpacity}`);
        rafId = null;
      }
    };

    const startLoop = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(tick);
      }
    };

    const onPointerMove = (e) => {
      isHovered = true;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Normalized coordinates from -1 to 1
      const px = (x / rect.width - 0.5) * 2;
      const py = (y / rect.height - 0.5) * 2;

      targetTiltX = -py * maxTilt;
      targetTiltY = px * maxTilt;

      targetSpecX = (x / rect.width) * 100;
      targetSpecY = (y / rect.height) * 100;
      targetSpecOpacity = 0.16;

      startLoop();
    };

    const onPointerLeave = () => {
      isHovered = false;
      targetTiltX = 0;
      targetTiltY = 0;
      targetSpecOpacity = 0;
      startLoop();
    };

    el.addEventListener("pointermove", onPointerMove, { passive: true });
    el.addEventListener("pointerleave", onPointerLeave, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [maxTilt, perspective, damping]);

  return ref;
}
