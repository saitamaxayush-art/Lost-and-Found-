import { useEffect, useRef } from "react";
import { WALLET_STORY } from "./timeline";

/**
 * Cursor = a small yellow dot with a black ring trailing a little behind it.
 * While the visitor is inside the pinned "how it works" story (subscribe's p
 * between FREEZE_FROM and RELEASE_AT) it stops chasing the mouse and instead
 * tracks the wallet's real golden knob element (#walletKnob in Scene.jsx) —
 * whatever that element's live on-screen position actually is, at that exact
 * moment, at this viewport size — shrinking the ring down to hug the dot and
 * then hiding both. Once the wallet finishes gliding to centre screen
 * (WALLET_STORY.centerEnd) it reappears right there and flies back out to
 * wherever the real pointer is, reading as the cursor detaching from the knob.
 */
const FREEZE_FROM = 0.035;
const RELEASE_AT = WALLET_STORY.centerEnd;

// Ring shrinks to roughly the dot's own size while docked (dot ~10px / ring ~22px)
const RING_FIT_SCALE = 0.46;

const HOVER_SELECTOR = "a, button, input, select, textarea, label, [role='button'], .sr-card";

export default function CustomCursor({ subscribe }) {
  const rootRef = useRef(null);
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const isFine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isFine || reduce) return; // touch / reduced-motion visitors keep the native cursor

    const root = rootRef.current;
    document.documentElement.classList.add("cc-on");

    const mid = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const s = {
      mx: mid.x, my: mid.y, // real pointer position
      x: mid.x, y: mid.y, // smoothed dot position
      rx: mid.x, ry: mid.y, // smoothed ring position (trails a touch more)
      dotScale: 1,
      ringScale: 1,
      docked: false,
      dockX: mid.x,
      dockY: mid.y,
      hover: false,
      raf: 0,
    };

    // Live centre of the wallet's actual golden knob, in real screen pixels —
    // accurate at any scroll position / viewport size, since it just reads
    // the element's current transformed bounding box straight off the DOM.
    const knobPoint = () => {
      const el = document.getElementById("walletKnob");
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };

    const onMove = (e) => {
      s.mx = e.clientX;
      s.my = e.clientY;
    };
    const onOver = (e) => {
      // The bell has its own hover animation — an oversized cursor on top of it
      // hides that, so the cursor stays at its normal size there on purpose.
      const overBell = !!e.target.closest?.(".lp-bell-btn");
      s.hover = !overBell && !!e.target.closest?.(HOVER_SELECTOR);
    };
    const onLeaveDoc = () => root?.classList.add("is-hidden");
    const onEnterDoc = () => root?.classList.remove("is-hidden");

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseleave", onLeaveDoc);
    document.addEventListener("mouseenter", onEnterDoc);

    let lastTime = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.064, (now - lastTime) / 1000 || 0.016);
      lastTime = now;

      if (s.docked) {
        const k = knobPoint();
        if (k) {
          s.dockX = k.x;
          s.dockY = k.y;
        }
      }

      const tx = s.docked ? s.dockX : s.mx;
      const ty = s.docked ? s.dockY : s.my;
      const targetDotScale = s.hover && !s.docked ? 1.3 : 1;
      const targetRingScale = s.docked ? RING_FIT_SCALE : s.hover ? 1.7 : 1;

      // Delta-time based exponential damping for organic fluidity
      const fDot = 1 - Math.exp(-28 * dt);
      const fRing = 1 - Math.exp(-14 * dt);
      const fScale = 1 - Math.exp(-20 * dt);

      s.x += (tx - s.x) * fDot;
      s.y += (ty - s.y) * fDot;
      s.rx += (tx - s.rx) * fRing;
      s.ry += (ty - s.ry) * fRing;
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

    const unsub = subscribe?.((p) => {
      const shouldDock = p > FREEZE_FROM && p < RELEASE_AT;
      s.docked = shouldDock;
      root?.classList.toggle("is-docked", shouldDock);
    });

    return () => {
      document.documentElement.classList.remove("cc-on");
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseleave", onLeaveDoc);
      document.removeEventListener("mouseenter", onEnterDoc);
      cancelAnimationFrame(s.raf);
      unsub?.();
    };
  }, [subscribe]);

  return (
    <div className="cc-root" ref={rootRef} aria-hidden="true">
      <div className="cc-ring" ref={ringRef} />
      <div className="cc-dot" ref={dotRef} />
    </div>
  );
}
