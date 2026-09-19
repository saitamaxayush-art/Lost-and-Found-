// One place that defines WHEN things happen as a function of scroll progress p (0..1).
// Everything on the landing page is a pure function of p, so it works
// identically scrolling down and scrolling up.

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const lerp = (a, b, t) => a + (b - a) * t;

// scroll length of the whole landing page, in viewport heights (460vh is comfortable and natural)
export const TRACK_VH = 460;

// Box slides from centre to the right side during steps 1-4, then rests back for the finale
export const BOX_MOVE_OUT = [0.04, 0.16];
export const BOX_MOVE_BACK = [0.75, 0.90];

// Content windows [start, end] for 4 clear steps
export const HERO_END = 0.10;
export const STEP_RANGES = [
  [0.13, 0.28], // 1 report lost
  [0.28, 0.42], // 2 report found
  [0.42, 0.58], // 3 smart matching (wallet spotlight & glow)
  [0.58, 0.74], // 4 you get notified
];

// Wallet Spotlight & Centered Letter Progression
export const WALLET_SPOTLIGHT = {
  riseStart: 0.38,
  riseEnd: 0.47,
  glowStart: 0.42,
  glowEnd: 0.74,
  centerStart: 0.74,
  centerEnd: 0.86,
  openStart: 0.82,
  openEnd: 0.96,
};

export const FINALE_START = 0.75;

/**
 * Detailed state of the wallet across all scroll stages:
 * - elevation: 0 = resting in box, 1 = floating above box
 * - glow: 0..1 intensity of match glow aura during steps 3 & 4
 * - centerT: 0 = at box on right, 1 = center screen
 * - openT: 0 = closed wallet, 1 = unfolded letter
 */
export function walletState(p) {
  const { riseStart, riseEnd, glowStart, glowEnd, centerStart, centerEnd, openStart, openEnd } = WALLET_SPOTLIGHT;

  // Elevation out of the box
  const rise = clamp((p - riseStart) / (riseEnd - riseStart));
  const elevation = p < riseStart ? 0 : p < centerStart ? ease(rise) : 1;

  // Golden match glow pulse intensity
  let glow = 0;
  if (p >= glowStart && p <= glowEnd) {
    const fadeIn = clamp((p - glowStart) / 0.05);
    const fadeOut = clamp((glowEnd - p) / 0.05);
    glow = Math.min(fadeIn, fadeOut);
  }

  // Glide into center stage
  const centerT = p < centerStart ? 0 : p >= centerEnd ? 1 : ease((p - centerStart) / (centerEnd - centerStart));

  // Unfolding into letter
  const openT = p < openStart ? 0 : p >= openEnd ? 1 : ease((p - openStart) / (openEnd - openStart));

  return { elevation, glow, centerT, openT };
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
