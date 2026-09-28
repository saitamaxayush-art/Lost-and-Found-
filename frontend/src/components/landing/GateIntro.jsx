import { useCallback, useEffect, useRef, useState } from "react";
import "../../styles/gateIntro.css";

const SNAP_RADIUS = 76;

const CLUSTER_KEYS = [
  {
    id: "key-1",
    img: "/gate/key_1.png",
    label: "Antique brass key",
    tag: "Library",
    isCorrect: false,
    width: 32,
    height: 95,
  },
  {
    id: "key-3",
    img: "/gate/key_3.png",
    label: "Ornate skeleton key",
    tag: "Yours",
    isCorrect: true,
    width: 38,
    height: 93,
  },
  {
    id: "key-2",
    img: "/gate/key_2.png",
    label: "Ring handle brass key",
    tag: "Canteen",
    isCorrect: false,
    width: 36,
    height: 92,
  },
];

const TAGLINE_WORDS = "Nothing is truly lost when someone is looking for it.".split(" ");

function shuffleKeys(keys) {
  const arr = [...keys];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function clamp(val, min = 0, max = 1) {
  return Math.max(min, Math.min(max, val));
}

function progress(t, start, end) {
  if (t <= start) return 0;
  if (t >= end) return 1;
  return (t - start) / (end - start);
}

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
}

function easeInOutQuartic(x) {
  return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
}

/* ==========================================================================
   Self-Contained Web Audio Synthesizer (Zero asset dependencies, instant response)
   ========================================================================== */
class WebAudioEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  playKeySlide() {
    if (!this.ctx) return;
    this.init();
    const t = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * 0.18);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const flt = this.ctx.createBiquadFilter();
    flt.type = "bandpass";
    flt.frequency.setValueAtTime(2200, t);
    flt.frequency.exponentialRampToValueAtTime(1200, t + 0.18);
    flt.Q.value = 5.0;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.07, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    src.connect(flt);
    flt.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(t);
  }

  playKeySeat() {
    if (!this.ctx) return;
    this.init();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1600, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.06);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.065);
  }

  playLockClick() {
    if (!this.ctx) return;
    this.init();
    const t = this.ctx.currentTime;
    [0, 0.022].forEach((offset, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = idx === 0 ? "sawtooth" : "square";
      osc.frequency.setValueAtTime(idx === 0 ? 760 : 1300, t + offset);
      osc.frequency.exponentialRampToValueAtTime(180, t + offset + 0.045);
      const flt = this.ctx.createBiquadFilter();
      flt.type = "bandpass";
      flt.frequency.value = idx === 0 ? 1150 : 2200;
      flt.Q.value = 6;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.14, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.05);
      osc.connect(flt);
      flt.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + offset);
      osc.stop(t + offset + 0.06);
    });
  }

  playDoorCreak() {
    if (!this.ctx) return;
    this.init();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.linearRampToValueAtTime(65, t + 0.45);
    const flt = this.ctx.createBiquadFilter();
    flt.type = "lowpass";
    flt.frequency.setValueAtTime(300, t);
    flt.frequency.linearRampToValueAtTime(160, t + 0.45);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.05, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc.connect(flt);
    flt.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.48);
  }

  playLightSwell() {
    if (!this.ctx) return;
    this.init();
    const t = this.ctx.currentTime;
    [130.81, 196.0, 261.63, 329.63].forEach((f) => {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, t);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.03, t + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 3.0);
    });
  }
}

export default function GateIntro({ onComplete, heroRef }) {
  const [shuffledKeys] = useState(() => shuffleKeys(CLUSTER_KEYS));
  const [phase, setPhase] = useState("ready");
  // phases: "ready" | "inserting" | "inserted" | "turning" | "opening" | "complete"
  const [activeKeyId, setActiveKeyId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isNearKeyhole, setIsNearKeyhole] = useState(false);
  const [insertedKey, setInsertedKey] = useState(null);
  const [keyTwisted, setKeyTwisted] = useState(false);
  const [rejectMessage, setRejectMessage] = useState(null);
  const [recoilingKeyId, setRecoilingKeyId] = useState(null);
  const [showIdleHint, setShowIdleHint] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");

  const rootRef = useRef(null);
  const roomRef = useRef(null);
  const flashlightRef = useRef(null);
  const headerRef = useRef(null);
  const bloomWashRef = useRef(null);
  const stageRef = useRef(null);
  const casingRef = useRef(null);
  const portalRef = useRef(null);
  const lightSourceRef = useRef(null);
  const floorSpillRef = useRef(null);
  const doorLeafRef = useRef(null);
  const hardwareRef = useRef(null);
  const specularRef = useRef(null);
  const thresholdLightRef = useRef(null);
  const trayRef = useRef(null);
  const keyholeRef = useRef(null);
  const insertedKeyWrapRef = useRef(null);
  const keyBladeWrapRef = useRef(null);
  const keyPlateShadowRef = useRef(null);

  const keyRefs = useRef({});
  const timersRef = useRef([]);
  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, initialOffsetX: 0, initialOffsetY: 0 });
  const rafOpenRef = useRef(null);
  const rafInsertionRef = useRef(null);
  const rafAmbianceRef = useRef(null);
  const soundEngineRef = useRef(new WebAudioEngine());
  const soundEnabledRef = useRef(false);

  // Parallax & Flashlight state
  const mousePos = useRef({ x: window.innerWidth * 0.5, y: window.innerHeight * 0.45 });
  const flPos = useRef({ x: window.innerWidth * 0.5, y: window.innerHeight * 0.45 });
  const parPos = useRef({ x: 0, y: 0 });
  const isTouchDevice = useRef(false);

  soundEnabledRef.current = soundEnabled;

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  }, []);

  // Preload and decode images before intro becomes interactive
  useEffect(() => {
    const urls = [
      "/gate/key_1.png",
      "/gate/key_2.png",
      "/gate/key_3.png",
      "/gate/door_leaf.jpg",
      "/gate/door_hardware.png",
    ];
    Promise.all(
      urls.map((src) => {
        const img = new Image();
        img.src = src;
        return img.decode?.().catch(() => {});
      })
    );
  }, []);

  // Idle hint after 6 seconds of inactivity
  useEffect(() => {
    const t = setTimeout(() => {
      setShowIdleHint(true);
    }, 6000);
    timersRef.current.push(t);
    return () => clearTimeout(t);
  }, []);

  const dismissIdleHint = useCallback(() => {
    setShowIdleHint(false);
  }, []);

  // Check prefers-reduced-motion: skip straight to site, no blur or zoom
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const heroEl = heroRef?.current || document.getElementById("top");
      if (heroEl) {
        heroEl.style.opacity = "";
        heroEl.style.transform = "";
        heroEl.style.filter = "";
        heroEl.style.willChange = "";
      }
      onComplete?.();
    }
  }, [heroRef, onComplete]);

  // Set initial focus pull prep on hero underneath (unless reduced motion)
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      const heroEl = heroRef?.current || document.getElementById("top");
      if (heroEl) {
        heroEl.style.opacity = "0";
        heroEl.style.transform = "scale(1.06)";
        heroEl.style.filter = "blur(14px)";
        heroEl.style.transformOrigin = "center center";
      }
    }
  }, [heroRef]);

  // Ambient Flashlight & Depth Parallax loop
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    function onPointerMove(e) {
      if (e.pointerType === "touch") isTouchDevice.current = true;
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;
      dismissIdleHint();
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    function ambientStep() {
      // Lerp flashlight position (factor 0.1)
      flPos.current.x += (mousePos.current.x - flPos.current.x) * 0.1;
      flPos.current.y += (mousePos.current.y - flPos.current.y) * 0.1;

      if (flashlightRef.current) {
        flashlightRef.current.style.transform =
          `translate3d(${flPos.current.x - 240}px, ${flPos.current.y - 240}px, 0)`;
      }

      // Desktop depth parallax (lerp factor 0.08, disabled on touch/open)
      if (!isTouchDevice.current && (phase === "ready" || phase === "inserted" || phase === "inserting")) {
        const nx = (mousePos.current.x - window.innerWidth * 0.5) / (window.innerWidth * 0.5);
        const ny = (mousePos.current.y - window.innerHeight * 0.5) / (window.innerHeight * 0.5);

        parPos.current.x += (nx - parPos.current.x) * 0.08;
        parPos.current.y += (ny - parPos.current.y) * 0.08;

        if (roomRef.current) {
          roomRef.current.style.transform =
            `translate3d(${-parPos.current.x * 10}px, ${-parPos.current.y * 6}px, 0)`;
        }
        if (stageRef.current && phase !== "opening") {
          stageRef.current.style.transform =
            `translate3d(${-parPos.current.x * 6}px, ${-parPos.current.y * 4}px, 0) rotateY(${parPos.current.x * 2.4}deg) rotateX(${-parPos.current.y * 1.4}deg)`;
        }
      }

      rafAmbianceRef.current = requestAnimationFrame(ambientStep);
    }

    rafAmbianceRef.current = requestAnimationFrame(ambientStep);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      if (rafAmbianceRef.current) cancelAnimationFrame(rafAmbianceRef.current);
    };
  }, [phase, dismissIdleHint]);

  // Clean timers and rAF on unmount
  useEffect(() => {
    return () => {
      if (rafOpenRef.current) cancelAnimationFrame(rafOpenRef.current);
      if (rafInsertionRef.current) cancelAnimationFrame(rafInsertionRef.current);
      if (rafAmbianceRef.current) cancelAnimationFrame(rafAmbianceRef.current);
      clearAllTimers();
      const heroEl = heroRef?.current || document.getElementById("top");
      if (heroEl) {
        heroEl.style.opacity = "";
        heroEl.style.transform = "";
        heroEl.style.filter = "";
        heroEl.style.willChange = "";
      }
    };
  }, [clearAllTimers, heroRef]);

  // Sound toggle handler
  const toggleSound = () => {
    soundEngineRef.current.init();
    setSoundEnabled((prev) => !prev);
  };

  // Skip handler: skip straight to site, no blur or zoom
  const handleSkip = useCallback(() => {
    if (rafOpenRef.current) cancelAnimationFrame(rafOpenRef.current);
    if (rafInsertionRef.current) cancelAnimationFrame(rafInsertionRef.current);
    clearAllTimers();
    const heroEl = heroRef?.current || document.getElementById("top");
    if (heroEl) {
      heroEl.style.opacity = "";
      heroEl.style.transform = "";
      heroEl.style.filter = "";
      heroEl.style.willChange = "";
    }
    setPhase("complete");
    onComplete?.();
  }, [clearAllTimers, heroRef, onComplete]);

  // --------------------------------------------------------------------------
  // SECTION 2: Physical Key Insertion Sequence (~1.1s total)
  // Lift -> Align -> Insert (clip-path hiding blade) -> Seat (1px settle)
  // --------------------------------------------------------------------------
  const startKeyInsertion = useCallback((key) => {
    dismissIdleHint();
    setPhase("inserting");
    setInsertedKey(key);
    setActiveKeyId(null);
    setDragOffset({ x: 0, y: 0 });
    setIsNearKeyhole(false);
    setRejectMessage(null);

    // Reset under-door proximity light
    if (thresholdLightRef.current) {
      thresholdLightRef.current.style.opacity = "0.08";
      thresholdLightRef.current.style.filter = "blur(1.5px)";
    }

    if (soundEnabledRef.current) {
      soundEngineRef.current.playKeySlide();
    }

    const startTime = performance.now();

    function insertStep(now) {
      const elapsed = now - startTime;

      if (elapsed < 200) {
        // a) Lift (0-200ms, ease-out cubic): 60px in front, 3/4 perspective view
        const p = easeOutCubic(elapsed / 200);
        const ty = -24 + (1 - p) * 12;
        const rotY = -38 * p;
        const rotZ = -6 * p;
        const tz = 60 * p;
        if (insertedKeyWrapRef.current) {
          insertedKeyWrapRef.current.style.transform =
            `translate(-50%, -50%) translate3d(0, ${ty.toFixed(1)}px, ${tz.toFixed(1)}px) perspective(700px) rotateY(${rotY.toFixed(1)}deg) rotateZ(${rotZ.toFixed(1)}deg)`;
        }
        if (keyPlateShadowRef.current) {
          keyPlateShadowRef.current.style.opacity = (0.15 + 0.25 * p).toFixed(3);
          keyPlateShadowRef.current.style.transform = `translate(-50%, -50%) scale(${0.8 + 0.4 * p})`;
        }
        if (keyBladeWrapRef.current) {
          keyBladeWrapRef.current.style.clipPath = "inset(0 0 0% 0)";
        }
      } else if (elapsed < 450) {
        // b) Align (200-450ms, 250ms): rotates to face lock squarely, shaft points straight at keyhole
        const p = easeInOutCubic((elapsed - 200) / 250);
        const rotY = -38 * (1 - p);
        const rotZ = -6 * (1 - p);
        const tz = 60 - 30 * p;
        const ty = -24 + 10 * p;
        if (insertedKeyWrapRef.current) {
          insertedKeyWrapRef.current.style.transform =
            `translate(-50%, -50%) translate3d(0, ${ty.toFixed(1)}px, ${tz.toFixed(1)}px) perspective(700px) rotateY(${rotY.toFixed(1)}deg) rotateZ(${rotZ.toFixed(1)}deg)`;
        }
        if (keyPlateShadowRef.current) {
          keyPlateShadowRef.current.style.opacity = (0.4 + 0.2 * p).toFixed(3);
          keyPlateShadowRef.current.style.transform = `translate(-50%, -50%) scale(1.1)`;
        }
        if (keyBladeWrapRef.current) {
          keyBladeWrapRef.current.style.clipPath = "inset(0 0 0% 0)";
        }
      } else if (elapsed < 1000) {
        // c) Insert (450-1000ms, 550ms, ease-in-out): travels into keyhole along shaft axis.
        // Fake depth with scale 1.0 to 0.9, blade progressively hidden via clip-path
        const p = easeInOutCubic((elapsed - 450) / 550);
        const tz = 30 * (1 - p);
        const ty = -14 + 18 * p; // bow centers on keyhole
        const sc = 1.0 - 0.1 * p;
        const scY = 1.0 - 0.08 * p;
        const clipBottom = p * 64; // blade disappears into keyhole slot, bow stays visible

        if (insertedKeyWrapRef.current) {
          insertedKeyWrapRef.current.style.transform =
            `translate(-50%, -50%) translate3d(0, ${ty.toFixed(1)}px, ${tz.toFixed(1)}px) scale(${sc.toFixed(3)}) scaleY(${scY.toFixed(3)})`;
        }
        if (keyBladeWrapRef.current) {
          keyBladeWrapRef.current.style.clipPath = `inset(0 0 ${clipBottom.toFixed(2)}% 0)`;
        }
        if (keyPlateShadowRef.current) {
          keyPlateShadowRef.current.style.opacity = (0.6 - 0.2 * p).toFixed(3);
          keyPlateShadowRef.current.style.transform = `translate(-50%, -50%) scale(${1.1 - 0.3 * p})`;
        }
      } else if (elapsed < 1120) {
        // d) Seat (1000-1120ms, 120ms): 1px settle toward door and back, plate shadow tightens
        const p = (elapsed - 1000) / 120;
        const settle = Math.sin(p * Math.PI) * 1.0;
        if (insertedKeyWrapRef.current) {
          insertedKeyWrapRef.current.style.transform =
            `translate(-50%, -50%) translate3d(0, ${(4 + settle).toFixed(1)}px, ${(-settle).toFixed(1)}px) scale(0.9) scaleY(0.92)`;
        }
        if (keyBladeWrapRef.current) {
          keyBladeWrapRef.current.style.clipPath = "inset(0 0 64% 0)";
        }
        if (keyPlateShadowRef.current) {
          keyPlateShadowRef.current.style.opacity = (0.4 + 0.15 * Math.sin(p * Math.PI)).toFixed(3);
          keyPlateShadowRef.current.style.transform = `translate(-50%, -50%) scale(0.8)`;
        }
      } else {
        // Seated! No glow, clean brass physical rest
        if (insertedKeyWrapRef.current) {
          insertedKeyWrapRef.current.style.transform =
            `translate(-50%, -50%) translate3d(0, 4px, 0) scale(0.9) scaleY(0.92)`;
        }
        if (keyBladeWrapRef.current) {
          keyBladeWrapRef.current.style.clipPath = "inset(0 0 64% 0)";
        }
        if (keyPlateShadowRef.current) {
          keyPlateShadowRef.current.style.opacity = "0.45";
          keyPlateShadowRef.current.style.transform = "translate(-50%, -50%) scale(0.8)";
        }
        if (soundEnabledRef.current) {
          soundEngineRef.current.playKeySeat();
        }
        setPhase("inserted");
        setLiveAnnouncement("Key inserted. Press space to turn the lock.");
        return;
      }

      rafInsertionRef.current = requestAnimationFrame(insertStep);
    }

    rafInsertionRef.current = requestAnimationFrame(insertStep);
  }, [dismissIdleHint]);

  // Wrong Key Rejection: approach, cannot insert, 3px twitch twice (200ms), 1px door shake, ease back
  const triggerWrongKeyReject = useCallback((key) => {
    dismissIdleHint();
    setRecoilingKeyId(key.id);
    setRejectMessage("That is not the right key");
    setLiveAnnouncement("That is not the right key.");

    // Twitch key
    const el = keyRefs.current[key.id];
    if (el) {
      el.style.animation = "gateKeyRecoil 0.45s ease-out";
    }

    // 1px door leaf shake
    if (doorLeafRef.current) {
      doorLeafRef.current.style.transform = "rotateY(0deg) translate3d(1px, 0, 0)";
      setTimeout(() => {
        if (doorLeafRef.current) doorLeafRef.current.style.transform = "rotateY(0deg)";
      }, 140);
    }

    const t1 = setTimeout(() => {
      setRecoilingKeyId(null);
      if (el) el.style.animation = "";
    }, 500);
    const t2 = setTimeout(() => {
      setRejectMessage(null);
    }, 3500);
    timersRef.current.push(t1, t2);
  }, [dismissIdleHint]);

  // --------------------------------------------------------------------------
  // SECTION 3: Lock Turn (~900ms) and Continuous Open Timeline (~4.8s)
  // Anticipation (-5deg) -> Turn (+90deg with resistance) -> Click (1.5px leaf nudge,
  // 1px plate shake, specular sweep, audio click) -> Door swing inward, dolly, arrival
  // --------------------------------------------------------------------------
  const triggerDoorOpen = useCallback(() => {
    if (phase !== "inserted" || keyTwisted) return;
    dismissIdleHint();

    setPhase("turning");
    setKeyTwisted(true);

    const heroEl = heroRef?.current || document.getElementById("top");
    if (heroEl) {
      heroEl.style.willChange = "transform, opacity, filter";
      heroEl.style.opacity = "0";
      heroEl.style.transform = "scale(1.06)";
      heroEl.style.filter = "blur(14px)";
    }
    if (stageRef.current) stageRef.current.style.willChange = "transform, filter";
    if (bloomWashRef.current) bloomWashRef.current.style.willChange = "opacity";
    if (rootRef.current) rootRef.current.style.willChange = "opacity";

    const turnStartTime = performance.now();
    let hasClicked = false;
    let hasPlayedCreak = false;
    let hasPlayedSwell = false;

    function turnAndOpenStep(now) {
      const elapsedTurn = now - turnStartTime;

      // --------------------------------------------------------
      // SECTION 3: Lock Turn (~900ms)
      // --------------------------------------------------------
      if (elapsedTurn < 900) {
        if (elapsedTurn < 120) {
          // a) Anticipation (120ms): key rotates -5deg about keyhole center
          const p = elapsedTurn / 120;
          const antRot = -5 * Math.sin((p * Math.PI) / 2);
          if (insertedKeyWrapRef.current) {
            insertedKeyWrapRef.current.style.transform =
              `translate(-50%, -50%) translate3d(0, 4px, 0) scale(0.9) scaleY(0.92) rotateZ(${antRot.toFixed(2)}deg)`;
          }
        } else if (elapsedTurn < 640) {
          // b) Turn (520ms, ease-in-out with center resistance): rotates from -5deg to +90deg
          const p = (elapsedTurn - 120) / 520;
          // Easing with resistance in the middle
          const eased = easeInOutCubic(p);
          const currentRot = -5 + 95 * eased;
          if (insertedKeyWrapRef.current) {
            insertedKeyWrapRef.current.style.transform =
              `translate(-50%, -50%) translate3d(0, 4px, 0) scale(0.9) scaleY(0.92) rotateZ(${currentRot.toFixed(2)}deg)`;
          }
        } else if (elapsedTurn < 760) {
          // c) Click (120ms): moment turn ends, 1.5px leaf nudge, 1px plate shake, specular highlight sweep
          const p = (elapsedTurn - 640) / 120;
          if (!hasClicked) {
            hasClicked = true;
            if (soundEnabledRef.current) {
              soundEngineRef.current.playLockClick();
            }
          }
          // Door leaf nudges 1.5px toward frame and back
          const leafNudge = Math.sin(p * Math.PI) * 1.5;
          if (doorLeafRef.current) {
            doorLeafRef.current.style.transform = `rotateY(0deg) translate3d(${leafNudge.toFixed(2)}px, 0, 0)`;
          }
          // Hardware plate 1px shake
          const plateShake = Math.sin(p * Math.PI * 2) * 1.0;
          if (hardwareRef.current) {
            hardwareRef.current.style.transform = `translateY(-50%) translate3d(${plateShake.toFixed(2)}px, 0, 0)`;
          }
          // Specular highlight sweep across brass hardware
          const specX = -150 + p * 350;
          if (specularRef.current) {
            specularRef.current.style.transform = `translateX(${specX.toFixed(1)}%)`;
          }
          if (insertedKeyWrapRef.current) {
            insertedKeyWrapRef.current.style.transform =
              `translate(-50%, -50%) translate3d(0, 4px, 0) scale(0.9) scaleY(0.92) rotateZ(90deg)`;
          }
        } else {
          // Settle before door swing begins
          if (doorLeafRef.current) doorLeafRef.current.style.transform = "rotateY(0deg)";
          if (hardwareRef.current) hardwareRef.current.style.transform = "translateY(-50%)";
          if (specularRef.current) specularRef.current.style.transform = "translateX(200%)";
        }

        rafOpenRef.current = requestAnimationFrame(turnAndOpenStep);
        return;
      }

      // --------------------------------------------------------
      // Continuous Door Open & Walk-Through Sequence (~4.8s)
      // Clock t starts at 0 right after the 900ms lock turn
      // --------------------------------------------------------
      const t = (elapsedTurn - 900) / 1000;

      // Play audio cues
      if (t >= 0.5 && !hasPlayedCreak) {
        hasPlayedCreak = true;
        if (soundEnabledRef.current) soundEngineRef.current.playDoorCreak();
      }
      if (t >= 0.8 && !hasPlayedSwell) {
        hasPlayedSwell = true;
        if (soundEnabledRef.current) soundEngineRef.current.playLightSwell();
      }

      // 0. Fade UI tagline and key tray smoothly out from t = 0 to 1.0s
      const uiFade = 1 - clamp(t / 1.0, 0, 1);
      if (headerRef.current) {
        headerRef.current.style.opacity = uiFade.toFixed(4);
        headerRef.current.style.pointerEvents = "none";
      }
      if (trayRef.current) {
        trayRef.current.style.opacity = uiFade.toFixed(4);
        trayRef.current.style.pointerEvents = "none";
      }

      // 1. t 0.5 to 2.4s: door swing
      // The leaf rotates about its left hinge to about 102 degrees, swinging INWARD (away from camera)
      // Ease: ease-in-out cubic (slow start, heavy feel, no snap)
      // Darken the leaf slightly as it turns edge-on
      const swingP = easeInOutCubic(progress(t, 0.5, 2.4));
      const doorAngle = swingP * 102;
      const angleRad = (doorAngle * Math.PI) / 180;
      const brightness = 0.55 + 0.45 * Math.max(0, Math.cos(angleRad * 0.95));

      // 3. t 1.8 to 4.1s: camera dolly
      // Scale stage from 1 to about 11 with ease-in-out quartic
      // transform-origin: exact centre of doorway aperture (50% 50%)
      const dollyP = easeInOutQuartic(progress(t, 1.8, 4.1));
      const scale = 1 + dollyP * 10; // 1 to 11

      // 4. During dolly, remove every dark element before it can be magnified:
      // - .gate-door-casing opacity 1 to 0 while scale goes 1.4 to 2.8, remove box-shadow after 1.4
      const casingP = clamp((scale - 1.4) / (2.8 - 1.4), 0, 1);
      const casingOpacity = 1 - casingP;
      if (casingRef.current) {
        casingRef.current.style.opacity = casingOpacity.toFixed(4);
        casingRef.current.style.boxShadow = scale >= 1.4 ? "none" : "";
      }

      // - Door leaf opacity 1 to 0 while scale goes 3 to 5
      const leafP = clamp((scale - 3) / (5 - 3), 0, 1);
      const leafOpacity = 1 - leafP;
      if (doorLeafRef.current) {
        doorLeafRef.current.style.transform = `rotateY(${doorAngle.toFixed(2)}deg)`;
        doorLeafRef.current.style.filter = `brightness(${brightness.toFixed(3)})`;
        doorLeafRef.current.style.opacity = leafOpacity.toFixed(4);
      }

      // 2. t 0.6 to 2.2s: light
      // Light panel (.gate-light-source) ramps opacity 0 to 1 with ease-out cubic
      const lightP = easeOutCubic(progress(t, 0.6, 2.2));
      if (lightSourceRef.current) {
        lightSourceRef.current.style.opacity = lightP.toFixed(4);
      }

      // Floor spill fades in with it and fades out again once camera scale passes 2
      let spillOpacity = lightP * 0.94;
      if (scale > 2) {
        const spillFade = clamp((scale - 2) / 0.8, 0, 1);
        spillOpacity *= (1 - spillFade);
      }
      if (floorSpillRef.current) {
        floorSpillRef.current.style.opacity = spillOpacity.toFixed(4);
        floorSpillRef.current.style.transform = `scaleY(${lightP.toFixed(3)}) scaleX(${lightP.toFixed(3)})`;
      }

      // Stage blur: filter blur from 0 to 9px as scale goes 3 to 11 (motion blur)
      const blurP = clamp((scale - 3) / (11 - 3), 0, 1);
      const stageBlur = blurP * 9;
      if (stageRef.current) {
        stageRef.current.style.transform = `scale(${scale.toFixed(4)})`;
        stageRef.current.style.filter = stageBlur > 0.01 ? `blur(${stageBlur.toFixed(2)}px)` : "none";
      }

      // 5. t 3.0 to 4.3s: light wash (opacity 0 to 1 with ease-in-out cubic)
      const washP = easeInOutCubic(progress(t, 3.0, 4.3));
      if (bloomWashRef.current) {
        bloomWashRef.current.style.opacity = washP.toFixed(4);
      }

      // 6. t 3.9 to 4.8s: arrival
      // Focus pull on real hero: opacity 0 -> 1, scale(1.06) -> scale(1), blur(14px) -> blur(0)
      const hEl = heroRef?.current || document.getElementById("top");
      if (t >= 3.9) {
        const arrivalP = easeInOutCubic(progress(t, 3.9, 4.8));
        const heroOpacity = arrivalP;
        const heroScale = 1.06 - arrivalP * 0.06;
        const heroBlur = (1 - arrivalP) * 14;

        if (hEl) {
          hEl.style.opacity = heroOpacity.toFixed(4);
          hEl.style.transform = `scale(${heroScale.toFixed(4)})`;
          hEl.style.filter = heroBlur > 0.01 ? `blur(${heroBlur.toFixed(2)}px)` : "none";
        }

        if (rootRef.current) {
          rootRef.current.style.opacity = (1 - arrivalP).toFixed(4);
        }
      }

      // 7. Complete at t >= 4.8s: hero fully resolved, unmount intro, call onComplete
      if (t >= 4.8) {
        if (hEl) {
          hEl.style.opacity = "";
          hEl.style.transform = "";
          hEl.style.filter = "";
          hEl.style.willChange = "";
        }
        if (stageRef.current) stageRef.current.style.willChange = "";
        if (bloomWashRef.current) bloomWashRef.current.style.willChange = "";
        if (rootRef.current) rootRef.current.style.willChange = "";

        setPhase("complete");
        onComplete?.();
        return;
      }

      rafOpenRef.current = requestAnimationFrame(turnAndOpenStep);
    }

    rafOpenRef.current = requestAnimationFrame(turnAndOpenStep);
  }, [phase, keyTwisted, dismissIdleHint, heroRef, onComplete]);

  // Keyboard navigation
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") {
        handleSkip();
        return;
      }
      if (phase === "inserted") {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          triggerDoorOpen();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, triggerDoorOpen, handleSkip]);

  // Pointer drag interaction
  const handlePointerDown = (e, key) => {
    if (phase !== "ready" || insertedKey) return;
    e.preventDefault();
    dismissIdleHint();
    setActiveKeyId(key.id);
    setRejectMessage(null);
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      initialOffsetX: 0,
      initialOffsetY: 0,
    };
    keyRefs.current[key.id]?.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!activeKeyId || phase !== "ready") return;
    const deltaX = e.clientX - dragStartRef.current.pointerX;
    const deltaY = e.clientY - dragStartRef.current.pointerY;

    // Check proximity to keyhole target
    if (keyholeRef.current && keyRefs.current[activeKeyId]) {
      const activeEl = keyRefs.current[activeKeyId];
      const keyRect = activeEl.getBoundingClientRect();
      const holeRect = keyholeRef.current.getBoundingClientRect();

      const keyTipX = keyRect.left + keyRect.width * 0.5;
      const keyTipY = keyRect.top + keyRect.height * 0.82;
      const holeCenterX = holeRect.left + holeRect.width * 0.5;
      const holeCenterY = holeRect.top + holeRect.height * 0.5;

      const dist = Math.hypot(keyTipX - holeCenterX, keyTipY - holeCenterY);
      const isTargetKey = activeKeyId === "key-3";
      const inRadius = dist < SNAP_RADIUS;

      setIsNearKeyhole(inRadius && isTargetKey);

      // Section 4.b: Proximity light under door gets brighter while dragging correct key
      if (isTargetKey && thresholdLightRef.current) {
        const proximity = 1 - clamp(dist / 320, 0, 1);
        thresholdLightRef.current.style.opacity = (0.08 + 0.52 * proximity).toFixed(3);
        thresholdLightRef.current.style.filter = `blur(${(1.5 + 2 * proximity).toFixed(1)}px)`;
      }

      if (inRadius && isTargetKey) {
        // Magnetic snap towards keyhole
        const magneticFactor = 0.55;
        const snapDeltaX = holeCenterX - keyTipX;
        const snapDeltaY = holeCenterY - keyTipY;
        setDragOffset({
          x: deltaX + snapDeltaX * magneticFactor,
          y: deltaY + snapDeltaY * magneticFactor,
        });
        return;
      }
    }

    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handlePointerUp = (e) => {
    if (!activeKeyId) return;
    const key = shuffledKeys.find((k) => k.id === activeKeyId);
    keyRefs.current[activeKeyId]?.releasePointerCapture?.(e.pointerId);

    // Proximity check on release
    let nearHole = false;
    if (keyholeRef.current && keyRefs.current[activeKeyId]) {
      const activeEl = keyRefs.current[activeKeyId];
      const keyRect = activeEl.getBoundingClientRect();
      const holeRect = keyholeRef.current.getBoundingClientRect();
      const keyTipX = keyRect.left + keyRect.width * 0.5;
      const keyTipY = keyRect.top + keyRect.height * 0.82;
      const holeCenterX = holeRect.left + holeRect.width * 0.5;
      const holeCenterY = holeRect.top + holeRect.height * 0.5;
      nearHole = Math.hypot(keyTipX - holeCenterX, keyTipY - holeCenterY) < SNAP_RADIUS + 20;
    }

    if (key?.isCorrect && (isNearKeyhole || nearHole)) {
      startKeyInsertion(key);
    } else if (nearHole && !key?.isCorrect) {
      setActiveKeyId(null);
      setDragOffset({ x: 0, y: 0 });
      setIsNearKeyhole(false);
      triggerWrongKeyReject(key);
    } else {
      setActiveKeyId(null);
      setDragOffset({ x: 0, y: 0 });
      setIsNearKeyhole(false);
      if (thresholdLightRef.current) {
        thresholdLightRef.current.style.opacity = "0.08";
        thresholdLightRef.current.style.filter = "blur(1.5px)";
      }
    }
  };

  // Direct click fallback
  const handleKeyClick = (key) => {
    if (phase !== "ready" || insertedKey) return;
    if (key.isCorrect) {
      startKeyInsertion(key);
    } else {
      triggerWrongKeyReject(key);
    }
  };

  if (phase === "complete") {
    return null;
  }

  return (
    <div
      ref={rootRef}
      className="gate-intro-root"
      aria-label="FindBack Gate Intro"
      role="region"
      tabIndex={0}
    >
      {/* Hidden ARIA Live region for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      {/* Controls Bar: Sound Toggle & Skip Button */}
      <div className="gate-controls-bar">
        <button
          type="button"
          className={`gate-sound-btn ${soundEnabled ? "is-active" : ""}`}
          onClick={toggleSound}
          aria-label={soundEnabled ? "Mute ambient audio" : "Enable ambient audio"}
          title={soundEnabled ? "Sound enabled" : "Enable sound"}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {soundEnabled ? (
              <>
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </>
            ) : (
              <>
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </>
            )}
          </svg>
          <span>{soundEnabled ? "Sound On" : "Sound"}</span>
        </button>

        <button
          type="button"
          className="gate-skip-btn"
          onClick={handleSkip}
          aria-label="Skip introduction animation"
        >
          Skip intro
        </button>
      </div>

      {/* Dark Room & Floor Vignette */}
      <div ref={roomRef} className="gate-room" aria-hidden="true">
        <div className="gate-room-floor">
          <div className="gate-room-floor-grid" />
        </div>
      </div>

      {/* Soft warm flashlight following cursor */}
      <div ref={flashlightRef} className="gate-flashlight" aria-hidden="true" />

      {/* Floating warm dust motes */}
      <div className="gate-dust-field" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="gate-dust-mote" />
        ))}
      </div>

      {/* Opening Tagline (Word-by-word reveal & 6s idle hint) */}
      <div ref={headerRef} className="gate-header">
        <h1 className="gate-tagline">
          {TAGLINE_WORDS.map((word, i) => (
            <span
              key={i}
              className="gate-tagline-word"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {word}{" "}
            </span>
          ))}
        </h1>

        <div className={`gate-idle-hint ${showIdleHint ? "is-visible" : ""}`} aria-hidden="true">
          Look closely. One of them has your name on it.
        </div>
      </div>

      {/* Full-screen Bloom Wash */}
      <div ref={bloomWashRef} className="gate-bloom-wash" aria-hidden="true" />

      {/* 3D Camera Rig & Door Stage */}
      <div className="gate-scene-container">
        <div ref={stageRef} className="gate-stage">
          {/* Architectural Outer Frame Trim */}
          <div ref={casingRef} className="gate-door-casing" />

          {/* Aperture behind door leaf */}
          <div ref={portalRef} className="gate-door-portal">
            {/* Static warm gold/cream light panel */}
            <div ref={lightSourceRef} className="gate-light-source">
              <div className="gate-bloom-core" />
              <div className="gate-bloom-outer" />
              <div className="gate-bloom-wide" />
            </div>

            {/* Floor light spill expanding as door swings open */}
            <div ref={floorSpillRef} className="gate-floor-spill" />
          </div>

          {/* 3D Door Leaf */}
          <div ref={doorLeafRef} className="gate-door-leaf">
            {/* 3D Door Thickness Edge */}
            <div className="gate-door-thickness" />

            {/* Engraved Brass Plaque at Eye Level */}
            <div className="gate-door-plaque" aria-hidden="true">
              <div className="gate-plaque-rivet" />
              <span className="gate-plaque-text">Lost &amp; Found</span>
              <div className="gate-plaque-rivet" />
            </div>

            {/* Brass Door Hardware */}
            <div ref={hardwareRef} className="gate-door-hardware">
              {/* Thin specular highlight sweeping across plate on turn */}
              <div ref={specularRef} className="gate-hardware-specular" />

              {/* Keyhole Target */}
              <div ref={keyholeRef} className="gate-keyhole-target" />

              {/* Physical Inserted Key inside lock cylinder */}
              {insertedKey && (
                <div
                  ref={insertedKeyWrapRef}
                  className="gate-inserted-key-wrapper"
                  onClick={triggerDoorOpen}
                  title="Press Space or click to turn lock and open"
                  role="button"
                  tabIndex={0}
                  aria-label="Inserted key. Press Space or click to turn lock."
                >
                  {/* Contact shadow on brass plate under the bit */}
                  <div ref={keyPlateShadowRef} className="gate-key-plate-shadow" />

                  {/* Key blade wrap with animated clip-path for depth */}
                  <div ref={keyBladeWrapRef} className="gate-key-blade-wrap">
                    <img
                      src={insertedKey.img}
                      alt=""
                      draggable={false}
                      className="gate-key-image"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Door threshold strip and under-door proximity light */}
            <div className="gate-door-threshold" aria-hidden="true">
              <div ref={thresholdLightRef} className="gate-threshold-light" />
            </div>
          </div>

          {/* Lock Action Prompt: "Press space to open" + Touch button */}
          {phase === "inserted" && (
            <div className="gate-lock-prompt" aria-live="polite">
              <div className="gate-prompt-badge">
                <span>Press space to open</span>
                <span className="gate-hint-kbd">Space</span>
              </div>
              <button
                type="button"
                className="gate-prompt-btn"
                onClick={triggerDoorOpen}
              >
                Turn &amp; Open
              </button>
            </div>
          )}

          {/* Inline Rejection Feedback for Incorrect Keys */}
          {rejectMessage && (
            <div className="gate-reject-feedback" role="alert" aria-live="assertive">
              {rejectMessage}
            </div>
          )}
        </div>
      </div>

      {/* Static Key Cluster Tray with Paper Tags */}
      <div ref={trayRef} className="gate-tray">
        <p className="gate-instruction">
          Find your lost key to open the door
        </p>

        <div className="gate-key-cluster" role="group" aria-label="Key selection cluster">
          {shuffledKeys.map((key) => {
            const isBeingDragged = activeKeyId === key.id;
            const isInserted = insertedKey?.id === key.id;
            const isRecoiling = recoilingKeyId === key.id;

            return (
              <div
                key={key.id}
                ref={(el) => (keyRefs.current[key.id] = el)}
                className={`gate-cluster-item ${
                  isBeingDragged ? "is-dragging" : ""
                }`}
                style={{
                  visibility: isInserted ? "hidden" : "visible",
                  zIndex: isBeingDragged ? 100 : 2,
                }}
                onPointerDown={(e) => handlePointerDown(e, key)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onClick={() => handleKeyClick(key)}
                role="button"
                tabIndex={0}
                aria-label={`${key.label}, labeled ${key.tag}. Drag to keyhole or tap to select.`}
              >
                {/* Hanging Paper Key Tag */}
                <div className="gate-key-tag" aria-hidden="true">
                  <div className="gate-tag-string" />
                  <div className="gate-tag-body">{key.tag}</div>
                </div>

                {/* Ambient contact shadow on surface */}
                <div className="gate-key-shadow" />

                {/* Key Graphic with 60fps Smooth Idle Floating Drift */}
                <div
                  className={`gate-key-graphic ${
                    !isBeingDragged && !isRecoiling ? "is-idle" : ""
                  } ${isRecoiling ? "is-recoiling" : ""}`}
                  style={{
                    transform: isBeingDragged
                      ? `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) scale(1.12)`
                      : undefined,
                    transition: isBeingDragged ? "none" : "transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)",
                  }}
                >
                  <img src={key.img} alt="" draggable={false} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
