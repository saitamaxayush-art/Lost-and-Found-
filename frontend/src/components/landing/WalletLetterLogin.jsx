import { useEffect, useRef, useState } from "react";
import LoginForm from "../LoginForm";
import { walletState } from "./timeline";

export default function WalletLetterLogin({ subscribe, onSuccess, user }) {
  const rootRef = useRef(null);
  const blurRef = useRef(null);
  const flapRef = useRef(null);
  const letterRef = useRef(null);
  const [interactive, setInteractive] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    return subscribe((p) => {
      const ws = walletState(p);
      const root = rootRef.current;
      const blur = blurRef.current;
      const flap = flapRef.current;
      const letter = letterRef.current;
      if (!root) return;

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
        // Fade in the interior content as the letter slides out
        const letterOpacity = Math.min(1, ws.openT * 1.35);
        letter.style.opacity = letterOpacity.toFixed(3);
      }

      // Enable form interactivity once sufficiently open
      setInteractive(ws.openT > 0.65);
    });
  }, [subscribe]);

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
        className={`lp-wallet-letter-wrap ${interactive ? "is-live" : ""}`}
        style={{ pointerEvents: interactive ? "auto" : "none" }}
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
            {/* Header of the letter with match badge and prompt */}
            <div className="lp-sheet-header">
              <div className="lp-sheet-badge">
                <span className="lp-sheet-icon">💼</span>
                <span className="lp-sheet-tag">Match Confirmed • Ready to Claim</span>
              </div>
              <h3 className="lp-sheet-title">Sign In to Claim</h3>
              <p className="lp-sheet-sub">
                Black leather wallet matched with your lost report
              </p>
            </div>

            {/* Letter Body: If already logged in, show claim action; else show LoginForm */}
            {user ? (
              <div className="lp-sheet-auth-done">
                <div className="lp-user-welcome-card">
                  <span className="lp-avatar-circle">👤</span>
                  <div className="lp-user-meta">
                    <strong>Hi, {user.name}!</strong>
                    <span>{user.email || user.studentId} • Campus Member</span>
                  </div>
                </div>
                <p className="lp-claim-prompt">
                  Your wallet is safely registered on the campus board. Click below to verify ownership and arrange collection.
                </p>
                <button
                  type="button"
                  className="lp-claim-cta-btn"
                  onClick={onSuccess}
                >
                  Go to Board &amp; Claim Wallet →
                </button>
              </div>
            ) : (
              <div className="lp-sheet-form-wrap">
                <div className="lp-sheet-prompt">
                  <span>Enter your details to verify ownership and retrieve item</span>
                </div>
                <LoginForm
                  autoFocus={false}
                  onSuccess={onSuccess}
                  onDone={() => setDone(true)}
                />
              </div>
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
