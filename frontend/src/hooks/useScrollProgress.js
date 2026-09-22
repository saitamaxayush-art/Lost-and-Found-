import { useCallback, useEffect, useRef } from "react";

const clamp = (v) => Math.min(1, Math.max(0, v));

/**
 * Turns the scroll position inside a tall "track" element into a smoothed
 * progress value 0..1. Components call `subscribe(fn)` to get every frame's value.
 * Works in both scroll directions and only runs rAF while there is motion.
 */
export function useScrollProgress(trackRef) {
  const subs = useRef(new Set());
  const st = useRef({
    target: 0,
    current: 0,
    raf: 0,
    lastTime: 0,
    top: 0,
    range: 1,
  });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const s = st.current;

    const emit = () => {
      const val = s.current;
      subs.current.forEach((fn) => fn(val));
    };

    // Cache track metrics so scroll handlers never trigger layout reflow
    const measure = () => {
      const rect = track.getBoundingClientRect();
      s.top = rect.top + window.scrollY;
      s.range = Math.max(1, track.offsetHeight - window.innerHeight);
    };

    const updateTarget = (scrollY = window.scrollY) => {
      s.target = clamp((scrollY - s.top) / s.range);
      if (!s.raf) {
        s.lastTime = performance.now();
        s.raf = requestAnimationFrame(tick);
      }
    };

    const tick = (now) => {
      s.raf = 0;
      const dt = Math.min(0.064, (now - s.lastTime) / 1000 || 0.016);
      s.lastTime = now;

      if (reduce) {
        s.current = s.target;
      } else {
        // Framerate-independent exponential smoothing (~12 factor gives luxurious cinematic weight)
        const factor = 1 - Math.exp(-12.5 * dt);
        s.current += (s.target - s.current) * factor;

        // Snap when difference is imperceptible to prevent infinite micro-ticks
        if (Math.abs(s.target - s.current) < 0.00008) {
          s.current = s.target;
        }
      }

      emit();

      if (s.current !== s.target) {
        s.raf = requestAnimationFrame(tick);
      }
    };

    const onScroll = () => {
      updateTarget(window.scrollY);
    };

    const onResize = () => {
      measure();
      updateTarget(window.scrollY);
    };

    measure();
    updateTarget(window.scrollY);
    s.current = s.target; // prevent jump on initial page load / refresh
    emit();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(onResize);
      ro.observe(track);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (ro) ro.disconnect();
      if (s.raf) cancelAnimationFrame(s.raf);
      s.raf = 0;
    };
  }, [trackRef]);

  // Jump straight to the target value (used after an instant section jump so the
  // animation never "catches up" visibly).
  const snap = useCallback(() => {
    const s = st.current;
    if (trackRef.current) {
      const rect = trackRef.current.getBoundingClientRect();
      s.top = rect.top + window.scrollY;
      s.range = Math.max(1, trackRef.current.offsetHeight - window.innerHeight);
    }
    s.target = clamp((window.scrollY - s.top) / s.range);
    s.current = s.target;
    if (s.raf) {
      cancelAnimationFrame(s.raf);
      s.raf = 0;
    }
    subs.current.forEach((fn) => fn(s.current));
  }, [trackRef]);

  const subscribe = useCallback((fn) => {
    subs.current.add(fn);
    fn(st.current.current);
    return () => subs.current.delete(fn);
  }, []);

  return { subscribe, snap };
}

