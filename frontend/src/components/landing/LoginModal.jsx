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
    <Modal onClose={onClose} labelledBy="lm-title" size="login">
      <LoginForm autoFocus onSuccess={onSuccess} onDone={() => setDone(true)} />
    </Modal>
  );
}
