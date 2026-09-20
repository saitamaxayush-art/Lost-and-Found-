import { useEffect, useState } from "react";
import LoginForm from "../LoginForm";
import Modal from "./Modal";

export default function LoginModal({ open, onClose, onSuccess }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) setDone(false);
  }, [open]);

  if (!open) return null;

  return (
    <Modal onClose={onClose} labelledBy="lm-title" size="sm">
      <div className="lm-brand">
        <span className="brand-mark">FB</span>
        <span>FindBack</span>
      </div>
      <h2 id="lm-title" hidden={done}>Sign in to FindBack</h2>
      <p className="lm-sub" hidden={done}>Tell us who you are and where you study, so matches reach the right person.</p>
      <LoginForm autoFocus onSuccess={onSuccess} onDone={() => setDone(true)} />
    </Modal>
  );
}
