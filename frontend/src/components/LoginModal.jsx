import { useEffect, useRef } from "react";
import LoginForm from "./LoginForm";

export default function LoginModal({ isOpen, onClose }) {
  const modalRef = useRef(null);
  const triggerElementRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Store currently focused element to restore upon close
      triggerElementRef.current = document.activeElement;

      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // Focus first input in modal
      const timer = setTimeout(() => {
        const firstInput = modalRef.current?.querySelector(
          'input, button:not(.modal-close-btn), [tabindex="0"]'
        );
        firstInput?.focus();
      }, 50);

      // Handle Escape key & Focus trap
      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
          return;
        }

        if (e.key === "Tab") {
          const focusable = modalRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (!focusable || focusable.length === 0) return;

          const firstEl = focusable[0];
          const lastEl = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstEl) {
              e.preventDefault();
              lastEl.focus();
            }
          } else {
            if (document.activeElement === lastEl) {
              e.preventDefault();
              firstEl.focus();
            }
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        document.removeEventListener("keydown", handleKeyDown);
        clearTimeout(timer);

        // Restore focus to trigger element
        if (triggerElementRef.current && typeof triggerElementRef.current.focus === "function") {
          triggerElementRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      aria-hidden="false"
    >
      <div
        className="modal-dialog-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        ref={modalRef}
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          ✕
        </button>

        <div className="modal-header">
          <div className="modal-badge">Campus Sign-in</div>
          <h2 id="login-modal-title">Welcome to HYT<span className="logo-dot">.</span></h2>
          <p className="modal-lede">
            <strong>Have Your Thing</strong> — Sign in to track reported valuables, receive instant campus alerts, and claim items at the desk.
          </p>
        </div>

        <LoginForm onSuccess={onClose} initialRedirect="/browse" />
      </div>
    </div>
  );
}
