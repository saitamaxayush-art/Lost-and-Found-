import { useCallback, useEffect, useRef, useState } from "react";
import "../../styles/gateIntro.css";

const SNAP_RADIUS = 76;

const CLUSTER_KEYS = [
  {
    id: "key-1",
    img: "/gate/key_1.png",
    label: "Antique brass key",
    isCorrect: false,
    width: 32,
    height: 95,
  },
  {
    id: "key-3",
    img: "/gate/key_3.png",
    label: "Ornate skeleton key",
    isCorrect: true,
    width: 38,
    height: 93,
  },
  {
    id: "key-2",
    img: "/gate/key_2.png",
    label: "Ring handle brass key",
    isCorrect: false,
    width: 36,
    height: 92,
  },
];

function shuffleKeys(keys) {
  const arr = [...keys];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function GateIntro({ onComplete }) {
  const [shuffledKeys] = useState(() => shuffleKeys(CLUSTER_KEYS));
  const [phase, setPhase] = useState("ready");
  // phases: "ready" | "inserted" | "turning" | "door_opening" | "door_held" | "zooming" | "complete"
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [activeKeyId, setActiveKeyId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isNearKeyhole, setIsNearKeyhole] = useState(false);
  const [insertedKey, setInsertedKey] = useState(null);
  const [keyTwisted, setKeyTwisted] = useState(false);
  const [rejectMessage, setRejectMessage] = useState(null);
  const [recoilingKeyId, setRecoilingKeyId] = useState(null);
  const [doorAngle, setDoorAngle] = useState(0);
  const [cameraZoom, setCameraZoom] = useState({ scale: 1, x: 0, y: 0 });
  const [isBloomWashActive, setIsBloomWashActive] = useState(false);

  const rootRef = useRef(null);
  const keyholeRef = useRef(null);
  const keyRefs = useRef({});
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

  // Clean timers on unmount
  useEffect(() => {
    return clearAllTimers;
  }, [clearAllTimers]);

  // Skip handler
  const handleSkip = useCallback(() => {
    clearAllTimers();
    setIsFadingOut(true);
    const t = setTimeout(() => {
      setPhase("complete");
      onComplete?.();
    }, 180);
    timersRef.current.push(t);
  }, [clearAllTimers, onComplete]);

  // Trigger lock turn and door opening once correct key is inserted
  const triggerDoorOpen = useCallback(() => {
    if (phase !== "inserted" || keyTwisted) return;

    // Step 1: Turn the lock and key around 90 degrees
    setPhase("turning");
    setKeyTwisted(true);

    // Step 2: Once the lock has turned around completely (~440ms), then swing open the door
    const t1 = setTimeout(() => {
      setPhase("door_opening");
      setDoorAngle(-58);
    }, 440);
    timersRef.current.push(t1);

    // Step 3: Warm golden bloom expands until it washes over the entire screen
    const t2 = setTimeout(() => {
      setIsBloomWashActive(true);
    }, 1150);
    timersRef.current.push(t2);

    // Step 4: Camera pushes forward through the doorway
    const t3 = setTimeout(() => {
      setPhase("zooming");
      setCameraZoom({ scale: 6.5, x: 18, y: -8 });
    }, 1750);
    timersRef.current.push(t3);

    // Step 5: Cross-fade into real site at peak of light wash
    const t4 = setTimeout(() => {
      setIsFadingOut(true);
    }, 2650);
    timersRef.current.push(t4);

    // Step 6: Complete intro
    const t5 = setTimeout(() => {
      setPhase("complete");
      onComplete?.();
    }, 3150);
    timersRef.current.push(t5);
  }, [phase, keyTwisted, onComplete]);

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

  // Drag interaction for keys
  const handlePointerDown = (e, key) => {
    if (phase !== "ready" || insertedKey) return;
    e.preventDefault();
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
      // Correct key inserted into lock
      setInsertedKey(key);
      setPhase("inserted");
      setActiveKeyId(null);
      setDragOffset({ x: 0, y: 0 });
      setIsNearKeyhole(false);
      setRejectMessage(null);
    } else if (nearHole && !key?.isCorrect) {
      // Incorrect key rejected
      setRejectMessage("That's not the right key");
      setRecoilingKeyId(key.id);
      setActiveKeyId(null);
      setDragOffset({ x: 0, y: 0 });
      setIsNearKeyhole(false);

      const t1 = setTimeout(() => {
        setRecoilingKeyId(null);
      }, 500);
      const t2 = setTimeout(() => {
        setRejectMessage(null);
      }, 3500);
      timersRef.current.push(t1, t2);
    } else {
      // Released away from lock; ease back to cluster
      setActiveKeyId(null);
      setDragOffset({ x: 0, y: 0 });
      setIsNearKeyhole(false);
    }
  };

  // Direct click/tap fallback for touch or accessibility users
  const handleKeyClick = (key) => {
    if (phase !== "ready" || insertedKey) return;
    if (key.isCorrect) {
      setInsertedKey(key);
      setPhase("inserted");
      setRejectMessage(null);
    } else {
      setRejectMessage("That's not the right key");
      setRecoilingKeyId(key.id);
      const t1 = setTimeout(() => setRecoilingKeyId(null), 500);
      const t2 = setTimeout(() => setRejectMessage(null), 3500);
      timersRef.current.push(t1, t2);
    }
  };

  if (phase === "complete") {
    return null;
  }

  const isDoorOpen = phase === "door_opening" || phase === "zooming";

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

      {/* Opening Tagline */}
      <div className="gate-header">
        <h1 className="gate-tagline">
          Nothing is truly lost when someone is looking for it.
        </h1>
      </div>

      {/* Full-screen Bloom Wash */}
      <div className={`gate-bloom-wash ${isBloomWashActive ? "is-active" : ""}`} aria-hidden="true" />

      {/* 3D Camera Rig & Door Stage */}
      <div className="gate-scene-container">
        <div
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
            <div className={`gate-light-source ${isDoorOpen ? "is-visible" : ""}`}>
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
                isNearKeyhole || phase === "turning" || isDoorOpen ? "is-glowing" : ""
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

              {/* Inserted Key inside lock cylinder - fits cleanly and turns on command */}
              {insertedKey && (
                <div
                  className={`gate-inserted-key ${keyTwisted ? "is-twisted" : ""}`}
                  onClick={triggerDoorOpen}
                  title="Click or press Space to turn lock and open"
                  role="button"
                  tabIndex={0}
                  aria-label="Inserted key. Press Space or click to turn lock."
                >
                  <img src={insertedKey.img} alt="" draggable={false} />
                </div>
              )}

              {/* Soft unlock ripple emitted on key turn */}
              <div
                className={`gate-unlock-ripple ${
                  phase === "turning" ? "is-firing" : ""
                }`}
              />
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
            <div className="gate-reject-feedback" role="alert">
              {rejectMessage}
            </div>
          )}
        </div>
      </div>

      {/* Static Key Cluster Tray (Smooth idle floating, drag-to-lock) */}
      <div className="gate-tray">
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
                className={`gate-cluster-item ${key.isCorrect ? "is-highlighted" : ""} ${
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
                aria-label={`${key.label}. Drag to keyhole or tap to select.`}
              >
                {/* Ambient contact shadow on surface */}
                <div className="gate-key-shadow" />

                {/* Soft spotlight behind the highlighted correct key */}
                {key.isCorrect && <div className="gate-cluster-spotlight" />}

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
