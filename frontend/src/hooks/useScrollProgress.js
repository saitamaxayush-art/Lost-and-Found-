import { useCallback, useEffect, useRef } from "react";

const clamp = (v) => Math.min(1, Math.max(0, v));

/**
 * Turns the scroll position inside a tall "track" element into a smoothed
 * progress value 0..1. Components call `subscribe(fn)` to get every frame's value.
 * Works in both scroll directions and only runs rAF while there is motion.
 */
export function useScrollProgress(trackRef) {
  const subs = useRef(new Set());
  const st = useRef({ target: 0, current: 0, raf: 0 });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const s = st.current;

    const emit = () => subs.current.forEach((fn) => fn(s.current));

    const read = () => {
      const top = track.getBoundingClientRect().top + window.scrollY;
      const range = Math.max(1, track.offsetHeight - window.innerHeight);
      s.target = clamp((window.scrollY - top) / range);
      if (!s.raf) s.raf = requestAnimationFrame(tick);
    };

    const tick = () => {
      s.raf = 0;
      s.current = reduce ? s.target : s.current + (s.target - s.current) * 0.2;
      if (Math.abs(s.target - s.current) < 0.0001) s.current = s.target;
      emit();
      if (s.current !== s.target) s.raf = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    read();
    s.current = s.target; // no fly-in on first paint / refresh mid-page
    emit();

    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
      cancelAnimationFrame(s.raf);
      s.raf = 0;
    };
  }, [trackRef]);

  // Jump straight to the target value (used after an instant section jump so the
  // animation never "catches up" visibly).
  const snap = useCallback(() => {
    const s = st.current;
    s.current = s.target;
    subs.current.forEach((fn) => fn(s.current));
  }, []);

  const subscribe = useCallback((fn) => {
    subs.current.add(fn);
    fn(st.current.current);
    return () => subs.current.delete(fn);
  }, []);

  return { subscribe, snap };
}
