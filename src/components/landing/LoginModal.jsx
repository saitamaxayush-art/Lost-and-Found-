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
      <h2 id="lm-title" hidden={done}>Sign in to FindBack</h2>
      <p className="lm-sub" hidden={done}>Tell us who you are and where you study, so matches reach the right person.</p>
      <LoginForm autoFocus onSuccess={onSuccess} onDone={() => setDone(true)} />
    </Modal>
  );
}
