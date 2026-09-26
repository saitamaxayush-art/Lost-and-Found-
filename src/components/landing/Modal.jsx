import { useEffect, useRef } from "react";

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

/**
 * Shared accessible dialog shell: Esc / backdrop / close button, focus trap,
 * page scroll lock and focus restore. Mount it to open it, unmount to close.
 */
export default function Modal({ onClose, labelledBy, size = "md", children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";

    const dlg = dialogRef.current;
    if (dlg && !dlg.contains(document.activeElement)) {
      (dlg.querySelector("input, textarea, select") || dlg).focus?.({ preventScroll: true });
    }

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
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
      opener?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  return (
    <div className="lm-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={`lm-dialog lm-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        ref={dialogRef}
      >
        <button type="button" className="lm-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}
