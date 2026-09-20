import { useEffect, useRef } from "react";
import { WALLET_STORY } from "./timeline";

/**
 * A small dot cursor plus a soft amber glow that both track the real
 * pointer. While the visitor is inside the pinned "how it works" story
 * (subscribe's p is between FREEZE_FROM and RELEASE_AT) the cursor stops
 * chasing the mouse, glides to the centre of the stage instead — right
 * about where the wallet ends up once it's centred — and fades out there,
 * as if it had been set down on the wallet's brass clasp. It reappears
 * and flies back out to the pointer once the wallet finishes gliding to
 * the centre of the screen (WALLET_STORY.centerEnd), which reads as the
 * cursor "detaching" from the golden knob.
 */
const FREEZE_FROM = 0.035;
const RELEASE_AT = WALLET_STORY.centerEnd;

const HOVER_SELECTOR = "a, button, input, select, textarea, label, [role='button'], .sr-card";

export default function CustomCursor({ subscribe }) {
  const rootRef = useRef(null);
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const auraRef = useRef(null);

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
      ax: mid.x, ay: mid.y, // smoothed glow position (a touch more lag)
      scale: 1,
      docked: false,
      dockX: mid.x,
      dockY: mid.y,
      hover: false,
      raf: 0,
    };

    const setDock = () => {
      const r = document.querySelector(".lp-stage")?.getBoundingClientRect();
      if (!r) return;
      s.dockX = r.left + r.width / 2;
      s.dockY = r.top + r.height / 2;
    };

    const onMove = (e) => {
      s.mx = e.clientX;
      s.my = e.clientY;
    };
    const onOver = (e) => {
      s.hover = !!e.target.closest?.(HOVER_SELECTOR);
    };
    const onLeaveDoc = () => root?.classList.add("is-hidden");
    const onEnterDoc = () => root?.classList.remove("is-hidden");

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseleave", onLeaveDoc);
    document.addEventListener("mouseenter", onEnterDoc);
    window.addEventListener("resize", setDock);
    setDock();

    const tick = () => {
      const tx = s.docked ? s.dockX : s.mx;
      const ty = s.docked ? s.dockY : s.my;
      const targetScale = s.docked ? 0.4 : s.hover ? 1.9 : 1;

      s.x += (tx - s.x) * 0.32;
      s.y += (ty - s.y) * 0.32;
      s.ax += (tx - s.ax) * 0.1;
      s.ay += (ty - s.ay) * 0.1;
      s.scale += (targetScale - s.scale) * 0.22;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -50%) scale(${s.scale.toFixed(3)})`;
      }
      if (ringRef.current) {
        const ringScale = s.docked ? s.scale : s.hover ? 1.4 : 1;
        ringRef.current.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -50%) scale(${ringScale.toFixed(3)})`;
      }
      if (auraRef.current) {
        auraRef.current.style.setProperty("--gx", `${s.ax}px`);
        auraRef.current.style.setProperty("--gy", `${s.ay}px`);
      }

      s.raf = requestAnimationFrame(tick);
    };
    s.raf = requestAnimationFrame(tick);

    const unsub = subscribe?.((p) => {
      const shouldDock = p > FREEZE_FROM && p < RELEASE_AT;
      if (shouldDock && !s.docked) setDock(); // re-measure right as it docks (layout may have shifted)
      s.docked = shouldDock;
      root?.classList.toggle("is-docked", shouldDock);
    });

    return () => {
      document.documentElement.classList.remove("cc-on");
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseleave", onLeaveDoc);
      document.removeEventListener("mouseenter", onEnterDoc);
      window.removeEventListener("resize", setDock);
      cancelAnimationFrame(s.raf);
      unsub?.();
    };
  }, [subscribe]);

  return (
    <div className="cc-root" ref={rootRef} aria-hidden="true">
      <div className="cc-aura" ref={auraRef} />
      <div className="cc-ring" ref={ringRef} />
      <div className="cc-dot" ref={dotRef} />
    </div>
  );
}
