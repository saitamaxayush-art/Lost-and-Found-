import { useEffect, useId, useRef, useState } from "react";
import { useApp } from "../context/AppContext";

const cleanPhone = (v) => v.replace(/[\s()-]/g, "");

export function validate({ name, whatsapp, campus }) {
  const errors = {};
  if (name.trim().length < 2) errors.name = "Enter your full name.";
  if (!/^\+?\d{10,14}$/.test(cleanPhone(whatsapp))) errors.whatsapp = "Enter a valid WhatsApp number, e.g. +91 98765 43210.";
  if (campus.trim().length < 2) errors.campus = "Enter your campus name.";
  return errors;
}

/**
 * Shared sign-in form (landing pop-up + /login page).
 * Mock auth: saves the profile through AppContext.login (localStorage).
 * Swap the body of `handleSubmit` for a real API call later.
 */
export default function LoginForm({ onSuccess, onDone, autoFocus = false }) {
  const { login } = useApp();
  const uid = useId();
  const [values, setValues] = useState({ name: "", whatsapp: "", campus: "" });
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState("idle"); // idle | loading | done
  const firstRef = useRef(null);
  const timer = useRef(0);

  useEffect(() => {
    if (autoFocus) firstRef.current?.focus();
    return () => clearTimeout(timer.current);
  }, [autoFocus]);

  const errors = validate(values);
  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));
  const show = (k) => touched[k] && errors[k];

  function handleSubmit(e) {
    e.preventDefault();
    setTouched({ name: true, whatsapp: true, campus: true });
    if (Object.keys(errors).length) return;
    setStatus("loading");
    timer.current = setTimeout(() => {
      const profile = {
        name: values.name.trim(),
        whatsapp: cleanPhone(values.whatsapp),
        campus: values.campus.trim(),
      };
      login(profile);
      setStatus("done");
      onDone?.();
      timer.current = setTimeout(() => onSuccess?.(profile), 1400);
    }, 650);
  }

  if (status === "done") {
    return (
      <div className="lf-done" role="status">
        <div className="lf-check" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>
        <h3>You're signed in, {values.name.trim().split(" ")[0]}.</h3>
        <p>Taking you to {values.campus.trim()}'s lost &amp; found board…</p>
        <button type="button" className="lf-submit" onClick={() => onSuccess?.()}>
          Continue now
        </button>
      </div>
    );
  }

  const field = (key, label, props) => (
    <div className="lf-row">
      <label htmlFor={`${uid}-${key}`}>{label}</label>
      <input
        id={`${uid}-${key}`}
        ref={key === "name" ? firstRef : undefined}
        value={values[key]}
        onChange={set(key)}
        onBlur={blur(key)}
        aria-invalid={show(key) ? "true" : "false"}
        aria-describedby={show(key) ? `${uid}-${key}-err` : undefined}
        {...props}
      />
      {show(key) && (
        <span className="lf-err" id={`${uid}-${key}-err`}>
          {errors[key]}
        </span>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      {field("name", "Full name", { type: "text", autoComplete: "name", placeholder: "e.g. Aditi Sharma" })}
      {field("whatsapp", "WhatsApp number", { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "+91 98765 43210" })}
      {field("campus", "Campus", { type: "text", autoComplete: "organization", placeholder: "e.g. PCCOE, Pune" })}
      <button className="lf-submit" type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
