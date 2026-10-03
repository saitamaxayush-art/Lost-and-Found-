import { useEffect, useRef } from "react";

const HOVER_SELECTOR = [
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "label",
  "[role='button']",
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
      dotScale: 1,
      ringScale: 1,
      hover: false,
      down: false,
      raf: 0,
      hasMoved: false,
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
    };

    const onOver = (e) => {
      const isInteractive = !!e.target.closest?.(HOVER_SELECTOR);
      if (s.hover !== isInteractive) {
        s.hover = isInteractive;
        root?.classList.toggle("is-hover", isInteractive);
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

    const onLeaveDoc = () => root?.classList.add("is-hidden");
    const onEnterDoc = () => root?.classList.remove("is-hidden");

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseleave", onLeaveDoc);
    document.addEventListener("mouseenter", onEnterDoc);

    let lastTime = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.064, (now - lastTime) / 1000 || 0.016);
      lastTime = now;

      const targetDotScale = s.down ? 0.8 : s.hover ? 1.35 : 1;
      const targetRingScale = s.down ? 0.88 : s.hover ? 1.65 : 1;

      // Silky-smooth responsive tracking physics
      const fDot = 1 - Math.exp(-36 * dt);
      const fRing = 1 - Math.exp(-18 * dt);
      const fScale = 1 - Math.exp(-22 * dt);

      s.x += (s.mx - s.x) * fDot;
      s.y += (s.my - s.y) * fDot;
      s.rx += (s.mx - s.rx) * fRing;
      s.ry += (s.my - s.ry) * fRing;
      s.dotScale += (targetDotScale - s.dotScale) * fScale;
      s.ringScale += (targetRingScale - s.ringScale) * fScale;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px, 0) scale(${s.dotScale.toFixed(3)})`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${s.rx.toFixed(2)}px, ${s.ry.toFixed(2)}px, 0) scale(${s.ringScale.toFixed(3)})`;
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
