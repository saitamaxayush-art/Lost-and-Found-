import { useEffect, useState } from "react";

export function useCountUp(target, duration = 650, startOnMount = true) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!startOnMount) return;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const numTarget = Number(target) || 0;
    if (prefersReducedMotion || duration <= 0) {
      setCount(numTarget);
      return;
    }

    let startTimestamp = null;
    let rafId = null;
    const startValue = 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (numTarget - startValue) * ease);
      setCount(current);

      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        setCount(numTarget);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [target, duration, startOnMount]);

  return count;
}
