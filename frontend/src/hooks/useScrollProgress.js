import { useEffect, useRef, useCallback } from "react";

/**
 * Hook providing smoothed scroll progress p in [0, 1] on a scrollable track.
 * Progress is smoothed via rAF + lerp.
 * Subscribers receive smoothed p imperatively to avoid React re-renders.
 */
export function useScrollProgress(trackRef) {
  const subscribersRef = useRef(new Set());
  const currentPRef = useRef(0);
  const targetPRef = useRef(0);
  const isRunningRef = useRef(false);
  const isReducedMotionRef = useRef(false);

  const subscribe = useCallback((callback) => {
    subscribersRef.current.add(callback);
    // Call immediately with current value
    callback(currentPRef.current);
    return () => {
      subscribersRef.current.delete(callback);
    };
  }, []);

  const getProgress = useCallback(() => currentPRef.current, []);

  useEffect(() => {
    // Check prefers-reduced-motion
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    isReducedMotionRef.current = motionQuery.matches;
    const handleMotionChange = (e) => {
      isReducedMotionRef.current = e.matches;
    };
    motionQuery.addEventListener("change", handleMotionChange);

    const updateTarget = () => {
      const track = trackRef?.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const trackHeight = track.scrollHeight || rect.height;
      const windowHeight = window.innerHeight;
      const maxScroll = trackHeight - windowHeight;

      if (maxScroll <= 0) {
        targetPRef.current = 0;
      } else {
        const scrolled = -rect.top;
        targetPRef.current = Math.min(1, Math.max(0, scrolled / maxScroll));
      }

      if (!isRunningRef.current) {
        startLoop();
      }
    };

    const loop = () => {
      const target = targetPRef.current;
      let current = currentPRef.current;

      if (isReducedMotionRef.current) {
        current = target;
      } else {
        const diff = target - current;
        if (Math.abs(diff) < 0.0001) {
          current = target;
        } else {
          current += diff * 0.09;
        }
      }

      currentPRef.current = current;

      // Broadcast to all imperative subscribers
      subscribersRef.current.forEach((fn) => {
        try {
          fn(current);
        } catch (err) {
          console.error("Scroll subscriber error:", err);
        }
      });

      // Keep running if not reached target
      if (Math.abs(target - current) >= 0.0001) {
        requestAnimationFrame(loop);
      } else {
        isRunningRef.current = false;
      }
    };

    const startLoop = () => {
      isRunningRef.current = true;
      requestAnimationFrame(loop);
    };

    window.addEventListener("scroll", updateTarget, { passive: true });
    window.addEventListener("resize", updateTarget, { passive: true });
    updateTarget();

    return () => {
      motionQuery.removeEventListener("change", handleMotionChange);
      window.removeEventListener("scroll", updateTarget);
      window.removeEventListener("resize", updateTarget);
    };
  }, [trackRef]);

  return { subscribe, getProgress };
}
