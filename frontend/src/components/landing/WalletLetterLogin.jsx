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
  const btnRef = useRef(null);

  const [interactive, setInteractive] = useState(false);
  const [values, setValues] = useState({ name: "", whatsapp: "", campus: "" });
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState("idle"); // idle | loading | confirmed | closing
  const isClosingRef = useRef(false);
  const sleeveRef = useRef(null);
  const currentOpenRef = useRef(0);

  // Synchronize scroll progression when not closing
  useEffect(() => {
    return subscribe((p) => {
      if (isClosingRef.current) return; // ignore scroll updates while closing animation runs

      const ws = walletState(p);
      const root = rootRef.current;
      const blur = blurRef.current;
      const flap = flapRef.current;
      const sleeve = sleeveRef.current;
      const letter = letterRef.current;
      const btn = btnRef.current;
      if (!root) return;

      currentOpenRef.current = ws.openT;

      // Background blur overlay: activates smoothly after 4th point
      if (blur) {
        blur.style.opacity = ws.blurT.toFixed(3);
        blur.style.pointerEvents = ws.blurT > 0.05 ? "auto" : "none";
      }

      // Visibility: activates right when the highlighted wallet reaches the center (p >= 0.738)
      // Zero separate translateY so it opens in one continuous go without coming up first!
      const isAtCenter = p >= 0.738;
      root.style.opacity = isAtCenter ? "1" : "0";
      root.style.visibility = isAtCenter ? "visible" : "hidden";

      // Wallet top flap rotation: folds backwards/upwards as openT increases (0 -> 1)
      if (flap) {
        const flapAngle = ws.openT * -158;
        flap.style.transform = `rotateX(${flapAngle.toFixed(1)}deg)`;
      }

      // Smooth sleeve height expansion: expands from 0px (closed) to full height (open)
      const maxSheetHeight = 390;
      if (sleeve) {
        const sleeveH = ws.openT * maxSheetHeight;
        sleeve.style.height = `${sleeveH.toFixed(1)}px`;
      }

      // Letter pops out upwards from inside the wallet pocket
      if (letter) {
        const letterY = (1 - ws.openT) * 60;
        letter.style.transform = `translateY(${letterY.toFixed(1)}px)`;
        const letterOpacity = Math.min(1, ws.openT * 1.8);
        letter.style.opacity = letterOpacity.toFixed(3);
      }

      // Bottom button smooth fade-in inside the pocket as wallet opens
      if (btn) {
        const enterBtn = Math.min(1, ws.openT * 1.5);
        btn.style.opacity = enterBtn.toFixed(3);
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
        const flapAngle = curOpen * -158;
        flapRef.current.style.transform = `rotateX(${flapAngle.toFixed(1)}deg)`;
      }

      if (sleeveRef.current) {
        const sleeveH = curOpen * 390;
        sleeveRef.current.style.height = `${sleeveH.toFixed(1)}px`;
      }

      if (letterRef.current) {
        const letterY = (1 - curOpen) * 60;
        letterRef.current.style.transform = `translateY(${letterY.toFixed(1)}px)`;
        const letterOpacity = Math.max(0, curOpen * 1.8);
        letterRef.current.style.opacity = letterOpacity.toFixed(3);
      }

      if (btnRef.current) {
        btnRef.current.style.opacity = curOpen.toFixed(3);
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

          {/* The Expanding Sleeve housing the Slide-Out Match Letter & Login Sheet */}
          <div ref={sleeveRef} className="lp-wallet-sleeve">
            <div ref={letterRef} className="lp-wallet-sheet">
              {/* Simple headline SIGN IN TO CONTINUE */}
              <div className="lp-sheet-header">
                <h3 className="lp-sheet-title">SIGN IN TO CONTINUE</h3>
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
                    Your identity is verified. Click the button below to close the wallet and open the campus dashboard.
                  </p>
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
                /* Sign In Form with details */
                <form id="wallet-login-form" className="lp-wallet-form" onSubmit={handleSubmit} noValidate>
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
                </form>
              )}
            </div>
          </div>

          {/* Lower Black Leather Wallet Pocket (bottom-most section of the wallet) */}
          <div className="lp-wallet-pocket">
            <span className="lp-wallet-stitch" />
            <div className="lp-wallet-pocket-rim" />

            {/* Button fitted inside the wallet's bottom-most section */}
            <div className="lp-wallet-pocket-action">
              {user ? (
                <button
                  ref={btnRef}
                  type="button"
                  className="lp-wallet-bottom-action-btn"
                  onClick={triggerWalletCloseAnimation}
                  disabled={status === "closing"}
                >
                  <span>{status === "closing" ? "Closing Wallet…" : "Continue to Dashboard"}</span>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              ) : status === "confirmed" || status === "closing" ? (
                <button
                  ref={btnRef}
                  type="button"
                  className="lp-wallet-bottom-action-btn is-closing"
                  disabled
                >
                  <span className="lp-closing-dot" />
                  <span>{status === "closing" ? "Closing Wallet…" : "Verified • Redirecting…"}</span>
                </button>
              ) : (
                <button
                  ref={btnRef}
                  type="submit"
                  form="wallet-login-form"
                  className="lp-wallet-bottom-action-btn"
                  disabled={status === "loading" || !interactive}
                  onClick={(e) => {
                    if (status === "loading" || !interactive) return;
                    const form = document.getElementById("wallet-login-form");
                    if (form) {
                      if (form.requestSubmit) form.requestSubmit();
                      else form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
                    }
                  }}
                >
                  <span>{status === "loading" ? "Signing In…" : "Sign In & Continue"}</span>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
