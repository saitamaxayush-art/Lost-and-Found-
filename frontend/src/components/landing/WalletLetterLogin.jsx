import { useEffect, useRef, useState } from "react";
import { useApp } from "../../context/AppContext";
import { walletState } from "./timeline";

const cleanPhone = (v) => v.replace(/[\s()-]/g, "");

function validate({ name, whatsapp, campus }) {
  const errors = {};
  if (name.trim().length < 2) errors.name = "Enter your full name.";
  if (!/^\+?\d{10,14}$/.test(cleanPhone(whatsapp))) {
    errors.whatsapp = "Enter a valid WhatsApp number (e.g. +91 98765 43210).";
  }
  if (campus.trim().length < 2) errors.campus = "Enter your campus name.";
  return errors;
}

export default function WalletLetterLogin({ subscribe, onSuccess, user }) {
  const { login } = useApp();
  const rootRef = useRef(null);
  const blurRef = useRef(null);
  const flapRef = useRef(null);
  const letterRef = useRef(null);

  const [interactive, setInteractive] = useState(false);
  const [values, setValues] = useState({ name: "", whatsapp: "", campus: "" });
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState("idle"); // idle | loading | confirmed | closing
  const isClosingRef = useRef(false);
  const currentOpenRef = useRef(0);

  // Synchronize scroll progression when not closing
  useEffect(() => {
    return subscribe((p) => {
      if (isClosingRef.current) return; // ignore scroll updates while closing animation runs

      const ws = walletState(p);
      const root = rootRef.current;
      const blur = blurRef.current;
      const flap = flapRef.current;
      const letter = letterRef.current;
      if (!root) return;

      currentOpenRef.current = ws.openT;

      // Background blur overlay: activates smoothly after 4th point
      if (blur) {
        blur.style.opacity = ws.blurT.toFixed(3);
        blur.style.pointerEvents = ws.blurT > 0.05 ? "auto" : "none";
      }

      // Visibility & entrance: appears smoothly as wallet reaches center (p >= 0.74)
      const enter = Math.max(ws.centerT, ws.openT);
      root.style.opacity = enter.toFixed(3);
      root.style.visibility = enter < 0.01 ? "hidden" : "visible";

      const scale = (0.94 + 0.06 * enter).toFixed(3);
      const ty = ((1 - enter) * 16).toFixed(1);
      root.style.setProperty("--scale", scale);
      root.style.setProperty("--ty", `${ty}px`);

      // Wallet top flap rotation: folds backwards/upwards as openT increases (0 -> 1)
      if (flap) {
        const flapAngle = ws.openT * -155;
        flap.style.transform = `rotateX(${flapAngle.toFixed(1)}deg)`;
      }

      // Letter sliding upwards out of the wallet pocket
      if (letter) {
        const letterY = (1 - ws.openT) * 75;
        letter.style.transform = `translateY(${letterY.toFixed(1)}px)`;
        const letterOpacity = Math.min(1, ws.openT * 1.35);
        letter.style.opacity = letterOpacity.toFixed(3);
      }

      // Enable form interactivity once sufficiently open
      setInteractive(ws.openT > 0.65);
    });
  }, [subscribe]);

  // Smooth wallet closing animation in the exact same manner as it opened
  function triggerWalletCloseAnimation() {
    isClosingRef.current = true;
    setStatus("closing");

    const startOpen = currentOpenRef.current || 1;
    const startTime = performance.now();
    const duration = 750; // ms

    function step(now) {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // cubic easeInOut
      const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const curOpen = startOpen * (1 - easeT);

      if (flapRef.current) {
        const flapAngle = curOpen * -155;
        flapRef.current.style.transform = `rotateX(${flapAngle.toFixed(1)}deg)`;
      }

      if (letterRef.current) {
        const letterY = (1 - curOpen) * 75;
        letterRef.current.style.transform = `translateY(${letterY.toFixed(1)}px)`;
        const letterOpacity = Math.max(0, curOpen * 1.35);
        letterRef.current.style.opacity = letterOpacity.toFixed(3);
      }

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        // Crisp moment before redirecting to dashboard
        setTimeout(() => {
          onSuccess?.();
        }, 180);
      }
    }

    requestAnimationFrame(step);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setTouched({ name: true, whatsapp: true, campus: true });
    const errors = validate(values);
    if (Object.keys(errors).length) return;

    setStatus("loading");
    const profile = {
      name: values.name.trim(),
      whatsapp: cleanPhone(values.whatsapp),
      campus: values.campus.trim(),
    };

    // Save profile to app state
    login(profile);

    // Show animated confirmation tick inside the wallet tooltip
    setTimeout(() => {
      setStatus("confirmed");

      // Give user time to see the animated tick confirmation, then close wallet smoothly
      setTimeout(() => {
        triggerWalletCloseAnimation();
      }, 1100);
    }, 450);
  }

  const errors = validate(values);
  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));
  const showErr = (k) => touched[k] && errors[k];

  return (
    <>
      {/* Background full blur backdrop driven by scroll */}
      <div
        ref={blurRef}
        className="lp-wallet-blur-backdrop"
        aria-hidden="true"
      />

      <div
        ref={rootRef}
        className={`lp-wallet-letter-wrap ${interactive ? "is-live" : ""} ${status === "closing" ? "is-closing" : ""}`}
        style={{ pointerEvents: interactive && status !== "closing" ? "auto" : "none" }}
      >
        <div className="lp-wallet-container">
          {/* Black Leather Top Flap with Brass Snap (folds open in 3D) */}
          <div ref={flapRef} className="lp-wallet-flap">
            <div className="lp-wallet-flap-front">
              <span className="lp-wallet-stitch" />
              <div className="lp-wallet-snap">
                <span className="lp-snap-brass" />
              </div>
            </div>
            <div className="lp-wallet-flap-back">
              <span className="lp-wallet-stitch" />
            </div>
          </div>

          {/* The Slide-Out Match Letter & Login Sheet */}
          <div ref={letterRef} className="lp-wallet-sheet">
            {/* Header: clearly indicates sign in required to continue */}
            <div className="lp-sheet-header">
              <div className="lp-sheet-badge">
                <span className="lp-sheet-icon">🔒</span>
                <span className="lp-sheet-tag">Sign In Required to Continue</span>
              </div>
              <h3 className="lp-sheet-title">Sign In to Continue</h3>
              <p className="lp-sheet-sub">
                Please sign in to verify your ownership and continue to the lost &amp; found board.
              </p>
            </div>

            {/* Authenticated user view */}
            {user ? (
              <div className="lp-sheet-auth-done">
                <div className="lp-user-welcome-card">
                  <span className="lp-avatar-circle">👤</span>
                  <div className="lp-user-meta">
                    <strong>Hi, {user.name}!</strong>
                    <span>{user.campus || user.email || "Campus Member"}</span>
                  </div>
                </div>
                <p className="lp-claim-prompt">
                  Your identity is verified. Click below to close the wallet and open the campus dashboard.
                </p>
                <button
                  type="button"
                  className="lp-wallet-sign-btn"
                  onClick={triggerWalletCloseAnimation}
                  disabled={status === "closing"}
                >
                  <span className="lp-wallet-btn-brass-snap" />
                  <span>{status === "closing" ? "Closing Wallet…" : "Continue to Campus Dashboard"}</span>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            ) : status === "confirmed" || status === "closing" ? (
              /* Confirmation view with animated tick inside the tooltip */
              <div className="lp-wallet-success-box" role="status">
                <div className="lp-wallet-tick-circle" aria-hidden="true">
                  <svg viewBox="0 0 52 52" className="lp-wallet-tick-svg">
                    <circle className="lp-tick-circle-bg" cx="26" cy="26" r="23" fill="none" />
                    <path className="lp-tick-check" fill="none" d="M15 27 l8 8 l16 -16" />
                  </svg>
                </div>
                <h4 className="lp-wallet-success-title">Signed In Successfully!</h4>
                <p className="lp-wallet-success-desc">
                  Welcome, <strong>{values.name.trim().split(" ")[0]}</strong>. Taking you to the {values.campus.trim()} dashboard…
                </p>
                <div className="lp-wallet-closing-badge">
                  <span className="lp-closing-dot" />
                  <span>{status === "closing" ? "Closing wallet…" : "Closing wallet & redirecting…"}</span>
                </div>
              </div>
            ) : (
              /* Sign In Form with button at the bottom of the wallet */
              <form className="lp-wallet-form" onSubmit={handleSubmit} noValidate>
                <div className="lp-sheet-prompt">
                  <span>Enter your details below to sign in easily</span>
                </div>

                <div className="lp-wallet-input-row">
                  <label htmlFor="wallet-name">Full Name</label>
                  <input
                    id="wallet-name"
                    type="text"
                    autoComplete="name"
                    placeholder="e.g. Aditi Sharma"
                    value={values.name}
                    onChange={set("name")}
                    onBlur={blur("name")}
                    aria-invalid={showErr("name") ? "true" : "false"}
                  />
                  {showErr("name") && <span className="lf-err">{errors.name}</span>}
                </div>

                <div className="lp-wallet-input-row">
                  <label htmlFor="wallet-whatsapp">WhatsApp Number</label>
                  <input
                    id="wallet-whatsapp"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+91 98765 43210"
                    value={values.whatsapp}
                    onChange={set("whatsapp")}
                    onBlur={blur("whatsapp")}
                    aria-invalid={showErr("whatsapp") ? "true" : "false"}
                  />
                  {showErr("whatsapp") && <span className="lf-err">{errors.whatsapp}</span>}
                </div>

                <div className="lp-wallet-input-row">
                  <label htmlFor="wallet-campus">Campus Name</label>
                  <input
                    id="wallet-campus"
                    type="text"
                    autoComplete="organization"
                    placeholder="e.g. PCCOE, Pune"
                    value={values.campus}
                    onChange={set("campus")}
                    onBlur={blur("campus")}
                    aria-invalid={showErr("campus") ? "true" : "false"}
                  />
                  {showErr("campus") && <span className="lf-err">{errors.campus}</span>}
                </div>

                {/* Prominent sign in button at the bottom of the wallet */}
                <button
                  type="submit"
                  className="lp-wallet-sign-btn"
                  disabled={status === "loading"}
                >
                  <span className="lp-wallet-btn-brass-snap" />
                  <span>{status === "loading" ? "Signing In…" : "Sign In & Continue to Dashboard"}</span>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </form>
            )}
          </div>

          {/* Lower Black Leather Wallet Pocket that holds the letter */}
          <div className="lp-wallet-pocket">
            <span className="lp-wallet-stitch" />
            <div className="lp-wallet-pocket-rim" />
          </div>
        </div>
      </div>
    </>
  );
}
