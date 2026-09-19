// One place that defines WHEN things happen as a function of scroll progress p (0..1).
// Everything on the landing page is a pure function of p, so it works
// identically scrolling down and scrolling up.

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const lerp = (a, b, t) => a + (b - a) * t;

// scroll length of the whole landing page, in viewport heights (480vh is comfortable and natural)
export const TRACK_VH = 480;

// Box slides from centre to the right side, then back to centre for the finale
export const BOX_MOVE_OUT = [0.04, 0.16];
export const BOX_MOVE_BACK = [0.86, 0.95];

// Items: rise gracefully during steps 1-2, showcase during steps 3-4, and return smoothly in step 5
export const POP = { riseStart: 0.16, riseEnd: 0.36, holdEnd: 0.68, fallEnd: 0.84 };

// Content windows [start, end]
export const HERO_END = 0.10;
export const STEP_RANGES = [
  [0.14, 0.28], // 1 report lost
  [0.28, 0.43], // 2 report found
  [0.43, 0.58], // 3 matching
  [0.58, 0.72], // 4 notify
  [0.72, 0.86], // 5 item found
];
export const FINALE_START = 0.89;

/**
 * Computes smooth 0..1 elevation progress for each item.
 * Staggered rise and staggered return curves eliminate abrupt cuts and freezing.
 */
export function itemProgress(p, riseDelay = 0, fallDelay = 0) {
  const { riseStart, riseEnd, holdEnd, fallEnd } = POP;
  // Rise phase (0 -> 1)
  const rSpan = riseEnd - riseStart;
  const rStart = riseStart + riseDelay * (rSpan * 0.4);
  const tRise = p <= rStart ? 0 : p >= riseEnd ? 1 : ease((p - rStart) / (riseEnd - rStart));

  // Fall phase (0 -> 1)
  const fSpan = fallEnd - holdEnd;
  const fStart = holdEnd + fallDelay * (fSpan * 0.4);
  const tFall = p <= fStart ? 0 : p >= fallEnd ? 1 : ease((p - fStart) / (fallEnd - fStart));

  return tRise * (1 - tFall);
}

/** 0 = items resting in the box, 1 = fully popped. Same value going up and down. */
export function popU(p) {
  const { riseStart, riseEnd, holdEnd, fallEnd } = POP;
  if (p <= riseStart) return 0;
  if (p < riseEnd) return ease((p - riseStart) / (riseEnd - riseStart));
  if (p <= holdEnd) return 1;
  if (p < fallEnd) return 1 - ease((p - holdEnd) / (fallEnd - holdEnd));
  return 0;
}

export function boxMove(p) {
  return {
    out: ease(clamp((p - BOX_MOVE_OUT[0]) / (BOX_MOVE_OUT[1] - BOX_MOVE_OUT[0]))),
    back: ease(clamp((p - BOX_MOVE_BACK[0]) / (BOX_MOVE_BACK[1] - BOX_MOVE_BACK[0]))),
  };
}

/** fade-in / hold / fade-out visibility for a content window */
export function windowVis(p, [a, b], edge = 0.22) {
  if (p <= a || p >= b) return { v: 0, dir: 0 };
  const f = (b - a) * edge;
  if (p < a + f) return { v: ease((p - a) / f), dir: 1 }; // entering from below
  if (p > b - f) return { v: ease((b - p) / f), dir: -1 }; // leaving upward
  return { v: 1, dir: 0 };
}
