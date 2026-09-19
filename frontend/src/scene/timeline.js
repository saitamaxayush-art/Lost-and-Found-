/**
 * Pure timeline calculations for the FindBack scroll-driven story experience.
 * Everything is a pure function of smoothed progress p in [0, 1].
 */

export function clamp(v, min = 0, max = 1) {
  return Math.min(max, Math.max(min, v));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function remap(v, inMin, inMax, outMin = 0, outMax = 1) {
  if (inMax === inMin) return outMin;
  const t = clamp((v - inMin) / (inMax - inMin), 0, 1);
  return outMin + (outMax - outMin) * t;
}

export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutQuad(t) {
  return 1 - (1 - t) * (1 - t);
}

export function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function easeOutBack(t, s = 1.4) {
  return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
}

/**
 * Step timing windows:
 * Step 1: Report lost  (0.13 - 0.29)
 * Step 2: Report found (0.29 - 0.44)
 * Step 3: We match     (0.44 - 0.57)
 * Step 4: Notification (0.57 - 0.70)
 * Step 5: Item found   (0.70 - 0.85)
 */
export const STEP_RANGES = [
  { start: 0.13, peak: 0.21, end: 0.29 },
  { start: 0.29, peak: 0.365, end: 0.44 },
  { start: 0.44, peak: 0.505, end: 0.57 },
  { start: 0.57, peak: 0.635, end: 0.70 },
  { start: 0.70, peak: 0.775, end: 0.85 },
];

/**
 * Item stagger offsets for pop-out (0.17 - 0.42) and return (0.70 - 0.85)
 */
export const ITEM_DEFS = [
  { id: "glasses",  launchStart: 0.17, launchEnd: 0.34, returnStart: 0.72, returnEnd: 0.85, dest: { x: -350, y: -230, rot: -16, scale: 1.0 } },
  { id: "phone",    launchStart: 0.20, launchEnd: 0.37, returnStart: 0.70, returnEnd: 0.83, dest: { x: -160, y: -330, rot: 12,  scale: 0.95 } },
  { id: "notebook", launchStart: 0.23, launchEnd: 0.40, returnStart: 0.71, returnEnd: 0.84, dest: { x: -340, y: -60,  rot: -8,  scale: 1.05 } },
  { id: "wallet",   launchStart: 0.25, launchEnd: 0.41, returnStart: 0.69, returnEnd: 0.82, dest: { x: 130,  y: -290, rot: 18,  scale: 0.9 } },
  { id: "scarf",    launchStart: 0.27, launchEnd: 0.42, returnStart: 0.68, returnEnd: 0.81, dest: { x: 170,  y: -110, rot: -10, scale: 1.1 } },
];

/**
 * Pure evaluation of the entire scene timeline at progress p (0..1).
 */
export function evaluateTimeline(p, { isPortrait = false } = {}) {
  // 1. Hero headline (visible at 0, fades out by 0.12)
  const heroOpacity = remap(p, 0.02, 0.11, 1, 0);
  const heroTranslateY = remap(p, 0.0, 0.11, 0, -40);

  // 2. Left Scrim (fades in 0.05..0.15, fades out 0.85..0.92)
  const scrimFadeIn = remap(p, 0.05, 0.15, 0, 1);
  const scrimFadeOut = remap(p, 0.85, 0.92, 1, 0);
  const scrimOpacity = Math.min(scrimFadeIn, scrimFadeOut);

  // 3. Cardboard Box Position & Scale
  let boxX, boxY, boxScale, boxRot;
  if (!isPortrait) {
    // Desktop / Landscape:
    // p=0..0.03: centered (600, 440, scale 1.15)
    // 0.03..0.15: glides to right (790, 480, scale 0.88)
    // 0.15..0.87: stays anchored on right
    // 0.87..0.96: glides back to center (600, 450, scale 1.1)
    if (p < 0.03) {
      boxX = 600;
      boxY = 440;
      boxScale = 1.15;
      boxRot = 0;
    } else if (p < 0.15) {
      const t = easeInOutCubic(remap(p, 0.03, 0.15, 0, 1));
      boxX = lerp(600, 790, t);
      boxY = lerp(440, 480, t);
      boxScale = lerp(1.15, 0.88, t);
      boxRot = lerp(0, 1.5, t);
    } else if (p < 0.87) {
      boxX = 790;
      boxY = 480;
      boxScale = 0.88;
      boxRot = 1.5;
    } else if (p < 0.96) {
      const t = easeInOutCubic(remap(p, 0.87, 0.96, 0, 1));
      boxX = lerp(790, 600, t);
      boxY = lerp(480, 450, t);
      boxScale = lerp(0.88, 1.1, t);
      boxRot = lerp(1.5, 0, t);
    } else {
      boxX = 600;
      boxY = 450;
      boxScale = 1.1;
      boxRot = 0;
    }
  } else {
    // Mobile / Portrait:
    // Box centered and placed near the bottom
    if (p < 0.03) {
      boxX = 600;
      boxY = 460;
      boxScale = 0.95;
      boxRot = 0;
    } else if (p < 0.15) {
      const t = easeInOutCubic(remap(p, 0.03, 0.15, 0, 1));
      boxX = 600;
      boxY = lerp(460, 580, t);
      boxScale = lerp(0.95, 0.72, t);
      boxRot = 0;
    } else if (p < 0.87) {
      boxX = 600;
      boxY = 580;
      boxScale = 0.72;
      boxRot = 0;
    } else if (p < 0.96) {
      const t = easeInOutCubic(remap(p, 0.87, 0.96, 0, 1));
      boxX = 600;
      boxY = lerp(580, 480, t);
      boxScale = lerp(0.72, 0.92, t);
      boxRot = 0;
    } else {
      boxX = 600;
      boxY = 480;
      boxScale = 0.92;
      boxRot = 0;
    }
  }

  // 4. Five Steps evaluation
  const steps = STEP_RANGES.map((range) => {
    if (p < range.start || p > range.end) {
      return { opacity: 0, translateY: 30, blur: 6, pointerEvents: "none" };
    }
    let op, transY, blur;
    if (p < range.peak) {
      const t = easeOutQuad(remap(p, range.start, range.peak, 0, 1));
      op = t;
      transY = lerp(28, 0, t);
      blur = lerp(6, 0, t);
    } else {
      const t = easeInOutQuad(remap(p, range.peak, range.end, 0, 1));
      op = lerp(1, 0, t);
      transY = lerp(0, -22, t);
      blur = lerp(0, 6, t);
    }
    return {
      opacity: Math.max(0, Math.min(1, op)),
      translateY: transY,
      blur: Math.max(0, blur),
      pointerEvents: op > 0.4 ? "auto" : "none",
    };
  });

  // 5. Burst, Rays & Mouth Glow (expands during pop-out 0.17..0.35, stays mild 0.35..0.70, collapses 0.70..0.85)
  let burstProgress;
  if (p < 0.17) {
    burstProgress = 0;
  } else if (p < 0.38) {
    burstProgress = easeOutQuad(remap(p, 0.17, 0.38, 0, 1));
  } else if (p < 0.70) {
    burstProgress = 0.85;
  } else if (p < 0.85) {
    burstProgress = easeOutQuad(remap(p, 0.70, 0.85, 1, 0));
  } else {
    burstProgress = 0;
  }

  // 6. Five Floating Items
  // Pure symmetrical curve: up and down follow the EXACT same path
  const items = ITEM_DEFS.map((def) => {
    let t = 0;
    if (p <= def.launchStart) {
      t = 0;
    } else if (p < def.launchEnd) {
      // Launching
      const raw = remap(p, def.launchStart, def.launchEnd, 0, 1);
      t = easeOutBack(raw, 1.15);
    } else if (p <= def.returnStart) {
      // Hovering in air
      t = 1.0;
    } else if (p < def.returnEnd) {
      // Returning to box along the EXACT same eased path in reverse
      const raw = remap(p, def.returnStart, def.returnEnd, 1, 0);
      t = easeOutBack(raw, 1.15);
    } else {
      t = 0;
    }

    t = Math.max(0, t);

    // Adjust destination for mobile/portrait so items stay in visible slice area
    let destX = def.dest.x;
    let destY = def.dest.y;
    if (isPortrait) {
      // Shift items upward and spread horizontally around box center
      destX = def.dest.x * 0.65;
      destY = def.dest.y * 0.7 - 50;
    }

    // Box mouth origin (relative to box center)
    const mouthX = 0;
    const mouthY = -35;

    // Curved parabolic arc:
    // An intermediate apex gives realistic physical launch trajectory
    const apexOffset = -40 * Math.sin(Math.PI * Math.min(1, t));
    const curX = lerp(mouthX, destX, Math.min(1, t));
    const curY = lerp(mouthY, destY, Math.min(1, t)) + apexOffset;

    const curScale = lerp(0.25, def.dest.scale, Math.min(1, t));
    const curRot = lerp(0, def.dest.rot, Math.min(1, t));
    const opacity = t < 0.05 ? t / 0.05 : 1;

    return {
      id: def.id,
      t,
      x: curX,
      y: curY,
      scale: curScale,
      rot: curRot,
      opacity: clamp(opacity),
    };
  });

  // 7. Finale Call To Action (fades in 0.88..0.98)
  const finaleOpacity = remap(p, 0.88, 0.98, 0, 1);
  const finaleTranslateY = remap(p, 0.88, 0.98, 40, 0);

  return {
    heroText: {
      opacity: Math.max(0, heroOpacity),
      translateY: heroTranslateY,
    },
    scrim: {
      opacity: scrimOpacity,
    },
    box: {
      x: boxX,
      y: boxY,
      scale: boxScale,
      rot: boxRot,
    },
    burst: {
      scale: burstProgress,
      opacity: burstProgress,
    },
    items,
    steps,
    finale: {
      opacity: Math.max(0, finaleOpacity),
      translateY: finaleTranslateY,
      pointerEvents: finaleOpacity > 0.4 ? "auto" : "none",
    },
  };
}
