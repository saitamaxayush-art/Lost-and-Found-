// One place that defines WHEN things happen as a function of scroll progress p (0..1).
// Everything on the landing page is a pure function of p, so it works
// identically scrolling down and scrolling up.

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/**
 * Organic smootherstep easing (Perlin's smootherstep):
 * 6*t^5 - 15*t^4 + 10*t^3
 * Has 1st and 2nd derivatives of zero at both t=0 and t=1,
 * eliminating all velocity and acceleration discontinuities.
 */
export const ease = (t) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * c * (c * (6 * c - 15) + 10);
};

export const lerp = (a, b, t) => a + (b - a) * t;


// scroll length of the "How it works" animation track, in viewport heights
export const TRACK_VH = 360;

// Box slides from centre to the right side during step 1
export const BOX_MOVE_OUT = [0.04, 0.16];

// Content windows [start, end] for the 4 steps:
// 1. Report lost
// 2. Report found (all items pop out)
// 3. Smart matching (wallet highlighted & glows, other items return into box)
// 4. You get notified (wallet brings to center)
export const HERO_END = 0.10;
export const STEP_RANGES = [
  [0.13, 0.26], // 1 report lost
  [0.26, 0.42], // 2 report found (all items pop out!)
  [0.42, 0.58], // 3 smart matching (wallet spotlight + glow, others in box)
  [0.58, 0.74], // 4 you get notified (wallet glides to center)
];

// Items pop in step 2 and return in step 3
export const ITEMS_POP = {
  riseStart: 0.24,
  riseEnd: 0.35,
  holdEnd: 0.41,
  fallEnd: 0.53,
};

// Wallet progression across steps 2, 3 and 4. The wallet rises, glows gold
// once matched, then glides to center and simply rests there — there is no
// login/letter step anymore, so open/blur never trigger (kept out of the
// 0..1 range on purpose rather than removed, since Scene.jsx still reads them).
export const WALLET_STORY = {
  riseStart: 0.24,
  riseEnd: 0.35,
  glowStart: 0.41,
  glowEnd: 0.95,
  centerStart: 0.58,
  centerEnd: 0.9, // wallet glides to center and stays there
  openStart: 1.5,
  openEnd: 1.6,
  blurStart: 1.5,
  blurEnd: 1.6,
};

/**
 * Other items (book, phone, glasses, scarf):
 * Pop out in step 2, then return safely into the box in step 3.
 */
export function otherItemElevation(p, delay = 0, fallDelay = 0) {
  const { riseStart, riseEnd, holdEnd, fallEnd } = ITEMS_POP;
  const sRise = riseStart + delay * 0.035;
  if (p < sRise) return 0;
  if (p < riseEnd) {
    return ease(clamp((p - sRise) / (riseEnd - sRise)));
  }
  const sFall = holdEnd + fallDelay * 0.035;
  if (p < sFall) return 1;
  if (p < fallEnd) {
    return 1 - ease(clamp((p - sFall) / (fallEnd - sFall)));
  }
  return 0; // resting inside the box
}

/**
 * Wallet state:
 * - elevation: rises in step 2, stays hovering in 3 and 4
 * - glow: 0..1 highlighted golden match aura during step 3 & 4
 * - centerT: 0..1 brings to center during step 4, where it rests
 * - openT / blurT: retained for Scene.jsx compatibility, never trigger
 */
export function walletState(p) {
  const { riseStart, riseEnd, glowStart, glowEnd, centerStart, centerEnd, openStart, openEnd, blurStart, blurEnd } = WALLET_STORY;

  // Elevation out of the box
  const rise = clamp((p - riseStart) / (riseEnd - riseStart));
  const elevation = p < riseStart ? 0 : ease(rise);

  // Golden match glow pulse intensity
  let glow = 0;
  if (p >= glowStart && p <= glowEnd) {
    const fadeIn = clamp((p - glowStart) / 0.04);
    const fadeOut = clamp((glowEnd - p) / 0.04);
    glow = Math.min(fadeIn, fadeOut);
  }

  // Brings to center in step 4
  const centerT = p < centerStart ? 0 : p >= centerEnd ? 1 : ease((p - centerStart) / (centerEnd - centerStart));

  // Opens wallet like a letter/tooltip after step 4
  const openT = p < openStart ? 0 : p >= openEnd ? 1 : ease((p - openStart) / (openEnd - openStart));

  // Full background blur
  const blurT = p < blurStart ? 0 : p >= blurEnd ? 1 : ease((p - blurStart) / (blurEnd - blurStart));

  return { elevation, glow, centerT, openT, blurT };
}

export function boxMove(p) {
  return {
    out: ease(clamp((p - BOX_MOVE_OUT[0]) / (BOX_MOVE_OUT[1] - BOX_MOVE_OUT[0]))),
    back: 0, // no returning to the initial page before scrolling!
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
