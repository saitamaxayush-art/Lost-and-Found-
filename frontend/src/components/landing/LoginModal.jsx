import { useEffect, useRef, useState } from "react";
import LoginForm from "../LoginForm";

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export default function LoginModal({ open, onClose, onSuccess }) {
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement;
    setDone(false);
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = dialogRef.current?.querySelectorAll(FOCUSABLE);
      if (!nodes?.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      root.style.overflow = prevOverflow;
      openerRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="lm-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lm-dialog" role="dialog" aria-modal="true" aria-labelledby="lm-title" ref={dialogRef}>
        <button type="button" className="lm-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <div className="lm-brand">
          <span className="brand-mark">FB</span>
          <span>FindBack</span>
        </div>
        <h2 id="lm-title" hidden={done}>Sign in to FindBack</h2>
        <p className="lm-sub" hidden={done}>Tell us who you are and where you study, so matches reach the right person.</p>
        <LoginForm autoFocus onSuccess={onSuccess} onDone={() => setDone(true)} />
      </div>
    </div>
  );
}
