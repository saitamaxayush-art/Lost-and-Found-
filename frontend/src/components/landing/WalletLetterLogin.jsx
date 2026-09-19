import { useEffect, useRef, useState } from "react";
import LoginForm from "../LoginForm";
import { walletState } from "./timeline";

export default function WalletLetterLogin({ subscribe, onSuccess, user }) {
  const rootRef = useRef(null);
  const flapRef = useRef(null);
  const letterRef = useRef(null);
  const [interactive, setInteractive] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    return subscribe((p) => {
      const ws = walletState(p);
      const root = rootRef.current;
      const flap = flapRef.current;
      const letter = letterRef.current;
      if (!root) return;

      // Visibility & entrance: appears as wallet reaches center (p > 0.74)
      const enter = ws.centerT;
      root.style.opacity = enter.toFixed(3);
      root.style.visibility = enter < 0.01 ? "hidden" : "visible";
      
      const scale = (0.92 + 0.08 * enter).toFixed(3);
      const ty = ((1 - enter) * 24).toFixed(1);
      root.style.setProperty("--scale", scale);
      root.style.setProperty("--ty", `${ty}px`);

      // Wallet top flap rotation: folds backwards/upwards as openT increases (0 -> 1)
      if (flap) {
        const flapAngle = ws.openT * -155;
        flap.style.transform = `rotateX(${flapAngle.toFixed(1)}deg)`;
      }

      // Letter sliding upwards out of the wallet pocket
      if (letter) {
        const letterY = (1 - ws.openT) * 70;
        letter.style.transform = `translateY(${letterY.toFixed(1)}px)`;
        // Fade in the interior content as the letter slides out
        const letterOpacity = Math.min(1, ws.openT * 1.3);
        letter.style.opacity = letterOpacity.toFixed(3);
      }

      // Enable form interactivity once sufficiently open
      setInteractive(ws.openT > 0.65);
    });
  }, [subscribe]);

  return (
    <div
      ref={rootRef}
      className={`lp-wallet-letter-wrap ${interactive ? "is-live" : ""}`}
      style={{ pointerEvents: interactive ? "auto" : "none" }}
    >
      <div className="lp-wallet-container">
        {/* Leather Top Flap with Brass Snap (folds open in 3D) */}
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
          {/* Header of the letter with seal and match info */}
          <div className="lp-sheet-header">
            <div className="lp-sheet-badge">
              <span className="lp-sheet-icon">💼</span>
              <span className="lp-sheet-tag">Match Confirmed • Ready to Claim</span>
            </div>
            <h3 className="lp-sheet-title">Black Leather Wallet</h3>
            <p className="lp-sheet-sub">
              Found at Canteen, 2nd floor • Matches your reported lost accessory
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
                <span>Sign in to verify ownership and claim your item</span>
              </div>
              <LoginForm
                autoFocus={false}
                onSuccess={onSuccess}
                onDone={() => setDone(true)}
              />
            </div>
          )}

          <div className="lp-sheet-footer">
            <span>FindBack Official Campus Lost &amp; Found Portal</span>
          </div>
        </div>

        {/* Lower Leather Wallet Pouch / Pocket that holds the letter */}
        <div className="lp-wallet-pocket">
          <span className="lp-wallet-stitch" />
          <div className="lp-wallet-pocket-rim" />
          <div className="lp-wallet-emboss">
            <span>FINDBACK • CAMPUS RETRIEVAL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
