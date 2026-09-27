import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../../styles/gateIntro.css";

const SNAP_RADIUS = 72;

export default function GateIntro({ onComplete }) {
  const [phase, setPhase] = useState("rain");
  // phases: "rain" | "hero_descending" | "hero_hover" | "unlocking" | "door_opening" | "door_held" | "zooming" | "complete"
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isNearKeyhole, setIsNearKeyhole] = useState(false);
  const [doorAngle, setDoorAngle] = useState(0); // in degrees
  const [cameraZoom, setCameraZoom] = useState({ scale: 1, x: 0, y: 0 });

  const rootRef = useRef(null);
  const keyholeRef = useRef(null);
  const heroKeyRef = useRef(null);
  const stageRef = useRef(null);
  const timersRef = useRef([]);
  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, initialOffsetX: 0, initialOffsetY: 0 });

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  }, []);

  // Check prefers-reduced-motion
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      onComplete?.();
    }
  }, [onComplete]);

  // Rain particle configuration
  const rainKeys = useMemo(() => {
    const keyImages = ["/gate/key_1.png", "/gate/key_2.png", "/gate/key_3.png"];
    const count = 30;
    const items = [];
    for (let i = 0; i < count; i++) {
      const img = keyImages[i % keyImages.length];
      const left = (i / count) * 94 + (Math.random() * 4 + 2);
      const duration = 5.2 + (i % 5) * 0.9;
      const delay = -((i * 1.3) % duration);
      const steps = 10 + (i % 4) * 2;
      const width = 28 + (i % 6) * 6;
      const rotStart = -40 + ((i * 37) % 80);
      const rotEnd = rotStart + 180 + ((i * 23) % 90);
      const drift = -25 + ((i * 17) % 50);
      const opacity = 0.35 + ((i % 4) * 0.12);

      items.push({
        id: i,
        img,
        left: `${left}%`,
        duration: `${duration.toFixed(2)}s`,
        delay: `${delay.toFixed(2)}s`,
        steps,
        width: `${width}px`,
        rotStart: `${rotStart}deg`,
        rotEnd: `${rotEnd}deg`,
        drift: `${drift}px`,
        opacity,
      });
    }
    return items;
  }, []);

  // Sequence beat timers
  useEffect(() => {
    // Beat 2: After ~2.6s, call out the Correct Key
    const t1 = setTimeout(() => {
      setPhase("hero_descending");
    }, 2600);
    timersRef.current.push(t1);

    // After descent completes (~1.2s), settle into hover position
    const t2 = setTimeout(() => {
      setPhase("hero_hover");
    }, 3850);
    timersRef.current.push(t2);

    return clearAllTimers;
  }, [clearAllTimers]);

  // Trigger unlock sequence
  const startUnlockSequence = useCallback(() => {
    if (phase === "unlocking" || phase === "door_opening" || phase === "door_held" || phase === "zooming" || phase === "complete") {
      return;
    }

    setPhase("unlocking");
    setIsDragging(false);
    setIsNearKeyhole(false);

    // Key slides in and twists over ~340ms
    const t1 = setTimeout(() => {
      // Knob glows and ripple emits
    }, 320);
    timersRef.current.push(t1);

    // Beat 4: Door swings open in true 3D (~1.08s, matching reference deliberate timing)
    const t2 = setTimeout(() => {
      setPhase("door_opening");
      setDoorAngle(-58);
    }, 580);
    timersRef.current.push(t2);

    // Hold door open for ~450ms
    const t3 = setTimeout(() => {
      setPhase("door_held");
    }, 1750);
    timersRef.current.push(t3);

    // Beat 5: Camera dolly zoom-through
    const t4 = setTimeout(() => {
      setPhase("zooming");
      setCameraZoom({ scale: 6.2, x: 18, y: -8 });
    }, 2200);
    timersRef.current.push(t4);

    // Cross-fade into real site at zoom peak
    const t5 = setTimeout(() => {
      setIsFadingOut(true);
    }, 3050);
    timersRef.current.push(t5);

    // Complete and unmount
    const t6 = setTimeout(() => {
      setPhase("complete");
      onComplete?.();
    }, 3500);
    timersRef.current.push(t6);
  }, [phase, onComplete]);

  // Skip button handler
  const handleSkip = useCallback(() => {
    clearAllTimers();
    setIsFadingOut(true);
    setTimeout(() => {
      setPhase("complete");
      onComplete?.();
    }, 180);
  }, [clearAllTimers, onComplete]);

  // Keyboard navigation: Enter or Space triggers auto-insert
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        startUnlockSequence();
      } else if (e.key === "Escape") {
        handleSkip();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [startUnlockSequence, handleSkip]);

  // Pointer drag handling for Beat 3
  const handlePointerDown = (e) => {
    if (phase !== "hero_hover") return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      initialOffsetX: dragOffset.x,
      initialOffsetY: dragOffset.y,
    };
    heroKeyRef.current?.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || phase !== "hero_hover") return;
    const deltaX = e.clientX - dragStartRef.current.pointerX;
    const deltaY = e.clientY - dragStartRef.current.pointerY;
    const nextX = dragStartRef.current.initialOffsetX + deltaX;
    const nextY = dragStartRef.current.initialOffsetY + deltaY;

    // Check proximity to keyhole target
    if (keyholeRef.current && heroKeyRef.current) {
      const keyRect = heroKeyRef.current.getBoundingClientRect();
      const holeRect = keyholeRef.current.getBoundingClientRect();

      // Compare key tip (bottom center of key) to keyhole center
      const keyTipX = keyRect.left + keyRect.width * 0.5;
      const keyTipY = keyRect.top + keyRect.height * 0.82;
      const holeCenterX = holeRect.left + holeRect.width * 0.5;
      const holeCenterY = holeRect.top + holeRect.height * 0.5;

      const dist = Math.hypot(keyTipX - holeCenterX, keyTipY - holeCenterY);
      const inSnapRadius = dist < SNAP_RADIUS;
      setIsNearKeyhole(inSnapRadius);

      if (inSnapRadius) {
        // Magnetic pull toward keyhole
        const magneticFactor = 0.55;
        const snapDeltaX = holeCenterX - keyTipX;
        const snapDeltaY = holeCenterY - keyTipY;
        setDragOffset({
          x: nextX + snapDeltaX * magneticFactor,
          y: nextY + snapDeltaY * magneticFactor,
        });
        return;
      }
    }

    setDragOffset({ x: nextX, y: nextY });
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    heroKeyRef.current?.releasePointerCapture?.(e.pointerId);

    if (isNearKeyhole) {
      startUnlockSequence();
    } else {
      // Ease back smoothly to hover position
      setDragOffset({ x: 0, y: 0 });
      setIsNearKeyhole(false);
    }
  };

  if (phase === "complete") {
    return null;
  }

  // Background rain is dimmed once the correct key appears
  const isRainDimmed = phase !== "rain";
  const isKeyHovering = phase === "hero_hover";
  const isDoorOpen = phase === "door_opening" || phase === "door_held" || phase === "zooming";
  const isLightVisible = isDoorOpen;

  // Compute hero key dynamic style
  const getHeroKeyTransform = () => {
    if (phase === "rain") {
      return "translate3d(0, -120vh, 0)";
    }
    if (phase === "hero_descending") {
      return "translate3d(0, 0, 0)";
    }
    if (phase === "unlocking") {
      // Key snaps to keyhole, aligns upright, slides in and twists
      return "translate3d(62px, -18px, -24px) scale(0.68) rotate(78deg)";
    }
    if (isDoorOpen || phase === "zooming") {
      return "translate3d(62px, -18px, -40px) scale(0.6) rotate(78deg) opacity(0)";
    }
    // phase === "hero_hover"
    return `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`;
  };

  const heroKeyTransition = isDragging
    ? "none"
    : phase === "hero_descending"
    ? "transform 1.25s cubic-bezier(0.22, 1, 0.36, 1)"
    : phase === "unlocking"
    ? "transform 0.4s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.3s ease"
    : "transform 0.42s cubic-bezier(0.25, 1, 0.5, 1)";

  return (
    <div
      ref={rootRef}
      className={`gate-intro-root ${isFadingOut ? "is-fading-out" : ""}`}
      aria-label="FindBack Gate Intro"
      role="region"
      tabIndex={0}
    >
      {/* Skip Button */}
      <button
        type="button"
        className="gate-skip-btn"
        onClick={handleSkip}
        aria-label="Skip introduction animation"
      >
        Skip intro
      </button>

      {/* Near-black Vignette Room */}
      <div className="gate-room" aria-hidden="true">
        <div className="gate-room-floor">
          <div className="gate-room-floor-grid" />
        </div>
      </div>

      {/* Beat 1: Key Rain Layer */}
      <div className={`gate-rain-field ${isRainDimmed ? "is-dimmed" : ""}`} aria-hidden="true">
        {rainKeys.map((k) => (
          <div
            key={k.id}
            className="gate-rain-key"
            style={{
              left: k.left,
              width: k.width,
              animationDuration: k.duration,
              animationDelay: k.delay,
              animationTimingFunction: `steps(${k.steps}, end)`,
              "--rot-start": k.rotStart,
              "--rot-end": k.rotEnd,
              "--drift-x": k.drift,
              "--base-opacity": k.opacity,
            }}
          >
            <img src={k.img} alt="" loading="eager" decoding="async" />
          </div>
        ))}
      </div>

      {/* 3D Camera Rig & Door Stage */}
      <div className="gate-camera-rig">
        <div
          ref={stageRef}
          className="gate-stage"
          style={{
            transform: `scale(${cameraZoom.scale}) translate3d(${cameraZoom.x}%, ${cameraZoom.y}%, 0)`,
          }}
        >
          {/* Architectural Outer Frame Trim */}
          <div className="gate-door-casing" />

          {/* Aperture behind door leaf */}
          <div className="gate-door-portal">
            {/* Static warm gold/cream light panel */}
            <div className={`gate-light-source ${isLightVisible ? "is-visible" : ""}`}>
              <div className="gate-bloom-core" />
              <div className="gate-bloom-outer" />
              <div className="gate-bloom-wide" />
            </div>

            {/* Floor light spill expanding as door swings open */}
            <div className={`gate-floor-spill ${isDoorOpen ? "is-active" : ""}`} />
          </div>

          {/* 3D Door Leaf */}
          <div
            className="gate-door-leaf"
            style={{
              transform: `rotateY(${doorAngle}deg)`,
            }}
          >
            {/* 3D Door Thickness Edge */}
            <div className="gate-door-thickness" />

            {/* Brass Door Hardware */}
            <div
              className={`gate-door-hardware ${
                isNearKeyhole || phase === "unlocking" || isDoorOpen ? "is-glowing" : ""
              }`}
            >
              {/* Knob Specular Glow */}
              <div className="gate-knob-glow" />

              {/* Keyhole Target & Magnetic Snapping Halo */}
              <div ref={keyholeRef} className="gate-keyhole-target">
                <div
                  className={`gate-keyhole-magnetic-halo ${
                    isNearKeyhole ? "is-active" : ""
                  }`}
                />
              </div>

              {/* Soft unlock ripple emitted on key turn */}
              <div
                className={`gate-unlock-ripple ${
                  phase === "unlocking" ? "is-firing" : ""
                }`}
              />
            </div>
          </div>

          {/* Beats 2 & 3: The Correct Key */}
          {phase !== "complete" && (
            <div
              ref={heroKeyRef}
              className={`gate-hero-key-rig ${isDragging ? "is-dragging" : ""} ${
                phase !== "hero_hover" ? "is-locked" : ""
              }`}
              style={{
                top: "47%",
                left: "calc(50% - 105px)",
                transform: getHeroKeyTransform(),
                transition: heroKeyTransition,
                zIndex: isDragging ? 100 : 50,
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              role="button"
              tabIndex={isKeyHovering ? 0 : -1}
              aria-label="Draggable key to unlock door. Press Enter or Space to auto-unlock."
            >
              {/* Soft spotlight following the correct key */}
              <div
                className={`gate-key-spotlight ${
                  phase !== "rain" ? "is-active" : ""
                }`}
              />

              {/* Shimmer particle trail */}
              <div
                className={`gate-key-particles ${
                  phase !== "rain" && !isDoorOpen ? "is-active" : ""
                }`}
              >
                <div className="gate-particle" />
                <div className="gate-particle" />
                <div className="gate-particle" />
                <div className="gate-particle" />
              </div>

              {/* Hero Key Item */}
              <div
                className={`gate-hero-key-inner ${
                  isKeyHovering && !isDragging ? "is-hovering" : ""
                }`}
              >
                <img src="/gate/key_3.png" alt="" draggable={false} />

                {/* Bow affordance pulse ring */}
                <div
                  className={`gate-key-affordance-pulse ${
                    isKeyHovering && !isDragging ? "is-visible" : ""
                  }`}
                />
              </div>

              {/* Hint badge */}
              <div
                className={`gate-affordance-hint ${
                  isKeyHovering && !isDragging ? "is-visible" : ""
                }`}
                aria-live="polite"
              >
                <span>Drag key to keyhole</span>
                <span className="gate-hint-kbd">Space</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
