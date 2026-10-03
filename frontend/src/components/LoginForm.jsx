import { useEffect, useId, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { sound } from "../utils/sound";

const cleanPhone = (v) => v.replace(/[\s()-]/g, "");

export function validate(values) {
  const errors = {};
  if (!values.name || values.name.trim().length < 2) {
    errors.name = "Enter your full name.";
  }
  if (!values.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid campus or personal email address.";
  }
  if (!/^\+?\d{10,14}$/.test(cleanPhone(values.whatsapp || ""))) {
    errors.whatsapp = "Enter a valid WhatsApp number (e.g. +91 98765 43210).";
  }
  if (!values.campus || values.campus.trim().length < 2) {
    errors.campus = "Enter your college or campus name.";
  }
  return errors;
}

/**
 * High-craft, multi-step professional login & email OTP verification modal.
 */
export default function LoginForm({ onSuccess, onDone, autoFocus = false }) {
  const { login } = useApp();
  const uid = useId();

  // Multi-step: "details" -> "otp" -> "done"
  const [step, setStep] = useState("details");
  const [values, setValues] = useState({ name: "", email: "", whatsapp: "", campus: "" });
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending_otp | verifying | done

  // OTP State
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [generatedOtp, setGeneratedOtp] = useState("684920");
  const [otpError, setOtpError] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const firstInputRef = useRef(null);
  const otpInputRefs = useRef([]);
  const timerRef = useRef(0);
  const countdownIntervalRef = useRef(0);

  // Focus management
  useEffect(() => {
    if (step === "details" && autoFocus) {
      firstInputRef.current?.focus();
    } else if (step === "otp") {
      otpInputRefs.current[0]?.focus();
    }
  }, [step, autoFocus]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (step === "otp") {
      setCountdown(30);
      setCanResend(false);
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdownIntervalRef.current);
  }, [step]);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const errors = validate(values);
  const set = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (touched[k]) {
      setTouched((t) => ({ ...t, [k]: false }));
    }
  };
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));
  const show = (k) => touched[k] && errors[k];

  // Submit Step 1: Validate and send OTP
  function handleContinueToOtp(e) {
    e.preventDefault();
    sound.playUiClick();
    const allTouched = { name: true, email: true, whatsapp: true, campus: true };
    setTouched(allTouched);

    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) return;

    // Generate random 6-digit OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setOtp(["", "", "", "", "", ""]);
    setOtpError("");

    setStatus("sending_otp");
    timerRef.current = setTimeout(() => {
      setStatus("idle");
      setStep("otp");
      setToastMsg(`Verification code sent to ${values.email.trim()}`);
      setTimeout(() => setToastMsg(""), 4000);
    }, 600);
  }

  // Handle individual OTP digits
  function handleOtpChange(index, val) {
    const char = val.replace(/\D/g, "").slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = char;
    setOtp(nextOtp);
    setOtpError("");
    sound.playOtpKey();

    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        const nextOtp = [...otp];
        nextOtp[index - 1] = "";
        setOtp(nextOtp);
        otpInputRefs.current[index - 1]?.focus();
        sound.playOtpKey();
      } else if (otp[index]) {
        const nextOtp = [...otp];
        nextOtp[index] = "";
        setOtp(nextOtp);
        sound.playOtpKey();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpPaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const nextOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      nextOtp[i] = pasted[i] || "";
    }
    setOtp(nextOtp);
    sound.playOtpKey();
    const nextIdx = Math.min(pasted.length, 5);
    otpInputRefs.current[nextIdx]?.focus();
  }

  // Resend OTP
  function handleResendOtp() {
    if (!canResend) return;
    sound.playUiClick();
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newCode);
    setOtp(["", "", "", "", "", ""]);
    setOtpError("");
    setCanResend(false);
    setCountdown(30);

    setToastMsg(`New OTP sent to ${values.email.trim()}!`);
    setTimeout(() => setToastMsg(""), 4500);

    clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // Auto-fill demo OTP
  function handleAutofillOtp() {
    sound.playOtpKey();
    const codeArr = generatedOtp.split("");
    setOtp(codeArr);
    setOtpError("");
    otpInputRefs.current[5]?.focus();
  }

  // Verify OTP
  function handleVerifyOtp(e) {
    e?.preventDefault();
    sound.playUiClick();
    const enteredCode = otp.join("");

    if (enteredCode.length < 6) {
      setOtpError("Please enter all 6 digits of the code.");
      return;
    }

    if (enteredCode !== generatedOtp) {
      setOtpError("Incorrect OTP code. Please check your email or use the demo code.");
      return;
    }

    setStatus("verifying");
    timerRef.current = setTimeout(() => {
      sound.playSuccess();
      const profile = {
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        whatsapp: cleanPhone(values.whatsapp),
        campus: values.campus.trim(),
      };
      login(profile);
      setStatus("done");
      setStep("done");
      onDone?.();
      timerRef.current = setTimeout(() => onSuccess?.(profile), 1500);
    }, 600);
  }

  /* ------------------- Render Step 3: Success ------------------- */
  if (step === "done") {
    return (
      <div className="lf-done" role="status">
        <div className="lf-check" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>
        <div className="lf-badge lf-badge-success">
          <span className="lf-badge-dot" /> Verified Account
        </div>
        <h3>Welcome, {values.name.trim().split(" ")[0]}!</h3>
        <p>Your identity has been authenticated. Connecting you to {values.campus.trim()}…</p>
        <button type="button" className="lf-submit" onClick={() => onSuccess?.()}>
          <span>Enter Dashboard</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  }

  /* ------------------- Render Step 2: OTP Verification ------------------- */
  if (step === "otp") {
    return (
      <div className="lf-container">
        {/* Step Header */}
        <div className="lf-header">
          <div className="lf-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Step 2 of 2: Security Verification</span>
          </div>

          <h2 className="lf-title">Verify your email</h2>
          <p className="lf-desc">
            We sent a 6-digit confirmation code to:
          </p>

          <div className="lf-email-badge">
            <span className="lf-email-text">{values.email}</span>
            <button
              type="button"
              className="lf-change-btn"
              onClick={() => {
                sound.playUiClick();
                setStep("details");
              }}
            >
              Change
            </button>
          </div>
        </div>

        {/* Demo / Sandbox Notification Toast */}
        <div className="lf-demo-banner">
          <div className="lf-demo-content">
            <span className="lf-demo-tag">SIMULATED INBOX</span>
            <span className="lf-demo-code">Code: <strong>{generatedOtp}</strong></span>
          </div>
          <button type="button" className="lf-autofill-btn" onClick={handleAutofillOtp}>
            Auto-fill
          </button>
        </div>

        {toastMsg && <div className="lf-toast-msg">{toastMsg}</div>}

        {/* 6-Digit OTP Boxes */}
        <form onSubmit={handleVerifyOtp} noValidate>
          <div className="lf-otp-group" onPaste={handleOtpPaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (otpInputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                className={`lf-otp-box ${digit ? "is-filled" : ""} ${otpError ? "has-error" : ""}`}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                aria-label={`Digit ${idx + 1}`}
              />
            ))}
          </div>

          {otpError && (
            <div className="lf-otp-error" role="alert">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{otpError}</span>
            </div>
          )}

          {/* Resend timer */}
          <div className="lf-resend-row">
            {canResend ? (
              <button type="button" className="lf-resend-btn" onClick={handleResendOtp}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19" />
                </svg>
                <span>Resend code</span>
              </button>
            ) : (
              <span className="lf-timer-text">
                Resend code in <strong>0:{countdown < 10 ? `0${countdown}` : countdown}</strong>
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="lf-actions-stack">
            <button
              className="lf-submit"
              type="submit"
              disabled={status === "verifying" || otp.join("").length < 6}
            >
              <span>{status === "verifying" ? "Verifying code…" : "Verify & Sign in"}</span>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>

            <button
              type="button"
              className="lf-back-btn"
              onClick={() => {
                sound.playUiClick();
                setStep("details");
              }}
            >
              ← Back to Details
            </button>
          </div>
        </form>
      </div>
    );
  }

  /* ------------------- Render Step 1: User Details Form ------------------- */
  return (
    <div className="lf-container">
      {/* Step Header */}
      <div className="lf-header">
        <div className="lf-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>Campus Authentication</span>
        </div>

        <h2 className="lf-title">Sign in to FindBack</h2>
        <p className="lf-desc">
          Enter your details and email address. We'll send an OTP to verify your identity.
        </p>

        {/* Step Indicator */}
        <div className="lf-stepper" aria-hidden="true">
          <div className="lf-step-item is-active">
            <span className="lf-step-num">1</span>
            <span className="lf-step-label">Your Details</span>
          </div>
          <div className="lf-step-divider" />
          <div className="lf-step-item">
            <span className="lf-step-num">2</span>
            <span className="lf-step-label">Email OTP</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleContinueToOtp} noValidate>
        {/* Full Name */}
        <div className="lf-field-wrap">
          <label htmlFor={`${uid}-name`} className="lf-label">
            <span>Full Name</span>
          </label>
          <div className="lf-input-box">
            <span className="lf-input-icon" aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <input
              id={`${uid}-name`}
              ref={firstInputRef}
              type="text"
              autoComplete="name"
              placeholder="e.g. Aditi Sharma"
              value={values.name}
              onChange={set("name")}
              onBlur={blur("name")}
              aria-invalid={show("name") ? "true" : "false"}
              aria-describedby={show("name") ? `${uid}-name-err` : undefined}
            />
          </div>
          {show("name") && <span className="lf-err" id={`${uid}-name-err`}>{errors.name}</span>}
        </div>

        {/* Email Address (Requested specifically by user) */}
        <div className="lf-field-wrap">
          <label htmlFor={`${uid}-email`} className="lf-label">
            <span>Email Address</span>
            <span className="lf-badge-hint">OTP will be sent here</span>
          </label>
          <div className="lf-input-box">
            <span className="lf-input-icon" aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </span>
            <input
              id={`${uid}-email`}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="e.g. aditi.sharma@campus.edu"
              value={values.email}
              onChange={set("email")}
              onBlur={blur("email")}
              aria-invalid={show("email") ? "true" : "false"}
              aria-describedby={show("email") ? `${uid}-email-err` : undefined}
            />
          </div>
          {show("email") && <span className="lf-err" id={`${uid}-email-err`}>{errors.email}</span>}
        </div>

        {/* WhatsApp Phone */}
        <div className="lf-field-wrap">
          <label htmlFor={`${uid}-whatsapp`} className="lf-label">
            <span>WhatsApp Phone Number</span>
            <span className="lf-badge-hint">For handover alerts</span>
          </label>
          <div className="lf-input-box">
            <span className="lf-input-icon" aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </span>
            <input
              id={`${uid}-whatsapp`}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              value={values.whatsapp}
              onChange={set("whatsapp")}
              onBlur={blur("whatsapp")}
              aria-invalid={show("whatsapp") ? "true" : "false"}
              aria-describedby={show("whatsapp") ? `${uid}-whatsapp-err` : undefined}
            />
          </div>
          {show("whatsapp") && <span className="lf-err" id={`${uid}-whatsapp-err`}>{errors.whatsapp}</span>}
        </div>

        {/* Campus / College */}
        <div className="lf-field-wrap">
          <label htmlFor={`${uid}-campus`} className="lf-label">
            <span>College / Campus Name</span>
          </label>
          <div className="lf-input-box">
            <span className="lf-input-icon" aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4" />
              </svg>
            </span>
            <input
              id={`${uid}-campus`}
              type="text"
              autoComplete="organization"
              placeholder="e.g. PCCOE, Pune"
              value={values.campus}
              onChange={set("campus")}
              onBlur={blur("campus")}
              aria-invalid={show("campus") ? "true" : "false"}
              aria-describedby={show("campus") ? `${uid}-campus-err` : undefined}
            />
          </div>
          {show("campus") && <span className="lf-err" id={`${uid}-campus-err`}>{errors.campus}</span>}
        </div>

        {/* Submit */}
        <button className="lf-submit" type="submit" disabled={status === "sending_otp"}>
          <span>{status === "sending_otp" ? "Sending verification code…" : "Continue to Verification"}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>

        <p className="lf-security-footer">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Encrypted campus credential verification. We never share your data.</span>
        </p>
      </form>
    </div>
  );
}
