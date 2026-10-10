import { useEffect, useRef } from "react";

const HOVER_SELECTOR = [
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "label",
  "[role='button']",
  "[role='tab']",
  ".sr-card",
  ".hs-item",
  ".co-card",
  ".sr-chip",
  ".mock-bell",
  ".lp-bell-btn",
  ".gate-cluster-item",
  ".gate-skip-btn",
  ".gate-prompt-btn",
  ".lp-btn-primary",
  ".lp-btn-secondary",
  ".lp-report-trigger",
  ".lp-nav-pill a",
  ".lp-nav-pill button",
  ".gate-inserted-key",
  ".lf-autofill-btn",
  ".lf-otp-box",
  ".pf-item-clean-card",
  ".pf-item-main-row",
  ".pf-tab-btn",
  ".pf-seg-btn",
  ".pf-drawer-image-thumb",
  ".pf-return-btn-action",
  ".pf-back-nav",
  ".pf-ghost-btn",
  ".pf-status-trigger",
].join(", ");

// Morphing of border applies STRICTLY to navigation pills and profile & logout buttons on the same line
const MORPH_SELECTOR = [
  ".lp-nav-links a",
  ".lp-user-btn",
  ".lp-nav-cta",
].join(", ");

export default function CustomCursor({ subscribe }) {
  const rootRef = useRef(null);
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const isFine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isFine || reduce) return;

    const root = rootRef.current;
    document.documentElement.classList.add("cc-on");

    const mid = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const s = {
      mx: mid.x,
      my: mid.y,
      x: mid.x,
      y: mid.y,
      rx: mid.x,
      ry: mid.y,
      rw: 26,
      rh: 26,
      rr: 13,
      dotScale: 1,
      dotOpacity: 1,
      hover: false,
      morphed: false,
      down: false,
      raf: 0,
      hasMoved: false,
    };

    let currentMorphEl = null;

    const findMorphTarget = (target) => {
      if (!target || !target.closest) return null;
      // Strictly restricted to navigation pills and profile + logout buttons on the same line
      const el = target.closest(MORPH_SELECTOR);
      if (!el || el.disabled || el.getAttribute("aria-disabled") === "true") return null;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      return el;
    };

    const updateTargetFromPoint = (x, y, fallbackTarget) => {
      let morphEl = null;
      if (typeof document.elementsFromPoint === "function") {
        const els = document.elementsFromPoint(x, y);
        for (const el of els) {
          if (el.closest?.(".cc-root")) continue;
          morphEl = findMorphTarget(el);
          if (morphEl) break;
        }
      }
      if (!morphEl && fallbackTarget) {
        morphEl = findMorphTarget(fallbackTarget);
      }

      currentMorphEl = morphEl;
      const isMorphed = !!morphEl;
      if (s.morphed !== isMorphed) {
        s.morphed = isMorphed;
        root?.classList.toggle("is-morphed", isMorphed);
      }
      return morphEl;
    };

    const onMove = (e) => {
      s.mx = e.clientX;
      s.my = e.clientY;
      if (!s.hasMoved) {
        s.hasMoved = true;
        s.x = s.mx;
        s.y = s.my;
        s.rx = s.mx;
        s.ry = s.my;
      }
      root?.classList.remove("is-hidden");
      updateTargetFromPoint(e.clientX, e.clientY, e.target);
    };

    const onOver = (e) => {
      updateTargetFromPoint(e.clientX, e.clientY, e.target);
      const isInteractive = s.morphed || !!e.target.closest?.(HOVER_SELECTOR);
      if (s.hover !== isInteractive) {
        s.hover = isInteractive;
        root?.classList.toggle("is-hover", isInteractive);
      }
    };

    const onOut = (e) => {
      if (!e.relatedTarget) {
        currentMorphEl = null;
        if (s.morphed) {
          s.morphed = false;
          root?.classList.remove("is-morphed");
        }
        return;
      }
      const newMorph = findMorphTarget(e.relatedTarget);
      if (newMorph !== currentMorphEl) {
        currentMorphEl = newMorph;
        const isMorphed = !!newMorph;
        if (s.morphed !== isMorphed) {
          s.morphed = isMorphed;
          root?.classList.toggle("is-morphed", isMorphed);
        }
      }
    };

    const onDown = () => {
      s.down = true;
      root?.classList.add("is-down");
    };

    const onUp = () => {
      s.down = false;
      root?.classList.remove("is-down");
    };

    const onLeaveDoc = () => {
      root?.classList.add("is-hidden");
      currentMorphEl = null;
      s.morphed = false;
      root?.classList.remove("is-morphed");
    };

    const onEnterDoc = () => root?.classList.remove("is-hidden");

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseout", onOut, { passive: true });
    document.addEventListener("mouseleave", onLeaveDoc);
    document.addEventListener("mouseenter", onEnterDoc);

    let lastTime = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.064, (now - lastTime) / 1000 || 0.016);
      lastTime = now;

      let targetW = 26;
      let targetH = 26;
      let targetR = 13;
      let targetX = s.mx;
      let targetY = s.my;
      let targetDotScale = s.down ? 0.75 : s.hover ? 1.25 : 1;
      let targetDotOpacity = 1;

      // If hovering over an interactive element without a visible border (e.g. text nav links/pills)
      if (s.hover && !currentMorphEl) {
        targetW = 34;
        targetH = 34;
        targetR = 17;
      }

      // When hovering over a pill, button or nav section, take its exact shape
      if (currentMorphEl && currentMorphEl.isConnected) {
        const rect = currentMorphEl.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const cs = window.getComputedStyle(currentMorphEl);
          const rawRadius = parseFloat(cs.borderTopLeftRadius) || 0;

          // Align EXACTLY with the target element's dimensions with 0 pixel drift
          targetW = rect.width;
          targetH = rect.height;

          // Corner radius: capsule radius for pills/circles, or matching rounded corner
          const maxCapsuleR = Math.min(targetW, targetH) / 2;
          const isPillOrCircle =
            rawRadius >= rect.height / 2 - 3 ||
            cs.borderRadius.includes("999") ||
            cs.borderRadius.includes("50%");

          if (isPillOrCircle) {
            targetR = maxCapsuleR;
          } else {
            targetR = Math.min(rawRadius, maxCapsuleR);
          }

          // Exact center of the target element: perfectly centered with zero alignment offset
          targetX = rect.left + rect.width / 2;
          targetY = rect.top + rect.height / 2;

          // While morphed, hide the center dot so text inside pill is 100% unobstructed
          targetDotScale = 0;
          targetDotOpacity = 0;
        } else {
          currentMorphEl = null;
          s.morphed = false;
          root?.classList.remove("is-morphed");
        }
      } else if (currentMorphEl) {
        currentMorphEl = null;
        s.morphed = false;
        root?.classList.remove("is-morphed");
      }

      // High-refresh fluid spring physics
      const fDot = 1 - Math.exp(-42 * dt);
      const fRingPos = s.morphed ? (1 - Math.exp(-34 * dt)) : (1 - Math.exp(-22 * dt));
      const fRingSize = 1 - Math.exp(-32 * dt);
      const fScale = 1 - Math.exp(-24 * dt);

      s.x += (s.mx - s.x) * fDot;
      s.y += (s.my - s.y) * fDot;

      s.rx += (targetX - s.rx) * fRingPos;
      s.ry += (targetY - s.ry) * fRingPos;
      s.rw += (targetW - s.rw) * fRingSize;
      s.rh += (targetH - s.rh) * fRingSize;
      s.rr += (targetR - s.rr) * fRingSize;

      s.dotScale += (targetDotScale - s.dotScale) * fScale;
      s.dotOpacity += (targetDotOpacity - s.dotOpacity) * fScale;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px, 0) scale(${s.dotScale.toFixed(3)})`;
        dotRef.current.style.opacity = s.dotOpacity.toFixed(3);
      }
      if (ringRef.current) {
        const pressScale = s.down ? (s.morphed ? 0.97 : 0.88) : 1;
        const left = (s.rx - s.rw / 2).toFixed(2);
        const top = (s.ry - s.rh / 2).toFixed(2);
        ringRef.current.style.width = `${s.rw.toFixed(1)}px`;
        ringRef.current.style.height = `${s.rh.toFixed(1)}px`;
        ringRef.current.style.borderRadius = `${s.rr.toFixed(1)}px`;
        ringRef.current.style.transform = `translate3d(${left}px, ${top}px, 0) scale(${pressScale})`;
      }

      s.raf = requestAnimationFrame(tick);
    };
    s.raf = requestAnimationFrame(tick);

    return () => {
      document.documentElement.classList.remove("cc-on");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      document.removeEventListener("mouseleave", onLeaveDoc);
      document.removeEventListener("mouseenter", onEnterDoc);
      cancelAnimationFrame(s.raf);
    };
  }, []);

  return (
    <div className="cc-root" ref={rootRef} aria-hidden="true">
      <div className="cc-ring" ref={ringRef} />
      <div className="cc-dot" ref={dotRef} />
    </div>
  );
}
