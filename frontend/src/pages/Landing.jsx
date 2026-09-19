import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useScrollProgress } from "../hooks/useScrollProgress";
import Scene from "../components/landing/Scene";
import Steps from "../components/landing/Steps";
import LoginModal from "../components/landing/LoginModal";
import { TRACK_VH } from "../components/landing/timeline";
import "../styles/landing.css";

export default function Landing() {
  const trackRef = useRef(null);
  const { subscribe } = useScrollProgress(trackRef);
  const { user } = useApp();
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);
  const [finaleLive, setFinaleLive] = useState(false);
  const hintRef = useRef(null);

  useEffect(() => {
    document.title = "FindBack — Find what you've lost. Return what you've found.";
    return subscribe((p) => {
      setFinaleLive(p > 0.93);
      if (hintRef.current) hintRef.current.style.opacity = String(Math.max(0, 1 - p / 0.05));
    });
  }, [subscribe]);

  const onCta = useCallback(() => {
    if (user) navigate("/browse");
    else setLoginOpen(true);
  }, [user, navigate]);

  const closeLogin = useCallback(() => setLoginOpen(false), []);
  const afterLogin = useCallback(() => navigate("/browse"), [navigate]);

  return (
    <div className="lp-root">
      {/* Top right direct login button with tinted glass effect */}
      <div className="lp-top-bar">
        <button
          type="button"
          className="lp-glass-btn"
          onClick={onCta}
          aria-label={user ? "Go to board" : "Log in"}
          id="direct-login-btn"
        >
          {user ? (
            <>
              <span className="lp-glass-dot" />
              <span>Go to Board</span>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              <span>Log in</span>
            </>
          )}
        </button>
      </div>

      <div className="lp-track" ref={trackRef} style={{ height: `${TRACK_VH}vh` }}>
        <div className="lp-stage">
          <Scene subscribe={subscribe} />
          <Steps
            subscribe={subscribe}
            onCta={onCta}
            finaleLive={finaleLive}
            ctaLabel={user ? "Open the lost & found board" : "Log in to get started"}
          />
          <div className="lp-hint" ref={hintRef} aria-hidden="true">
            <span>Scroll</span>
            <i />
          </div>
        </div>
      </div>
      <LoginModal open={loginOpen} onClose={closeLogin} onSuccess={afterLogin} />
    </div>
  );
}
