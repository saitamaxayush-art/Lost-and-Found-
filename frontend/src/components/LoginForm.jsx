import { useState, useId } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function LoginForm({ onSuccess, initialRedirect = "/browse" }) {
  const { login } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [campus, setCampus] = useState("");

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successName, setSuccessName] = useState("");

  const nameId = useId();
  const whatsappId = useId();
  const campusId = useId();
  const nameErrorId = useId();
  const whatsappErrorId = useId();
  const campusErrorId = useId();

  function validate(fields = { name, whatsapp, campus }) {
    const errs = {};

    if (!fields.name.trim()) {
      errs.name = "Please enter your full name.";
    } else if (fields.name.trim().length < 2) {
      errs.name = "Name must be at least 2 characters.";
    }

    // WhatsApp validation: 10 to 14 digits, optional leading +
    const digitsOnly = fields.whatsapp.replace(/[^0-9]/g, "");
    if (!fields.whatsapp.trim()) {
      errs.whatsapp = "WhatsApp number is required for claim updates.";
    } else if (digitsOnly.length < 10 || digitsOnly.length > 14) {
      errs.whatsapp = "Enter a valid 10-14 digit number (e.g. +91 98765 43210).";
    }

    if (!fields.campus.trim()) {
      errs.campus = "Please specify your college or campus.";
    }

    return errs;
  }

  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errs = validate({ name, whatsapp, campus });
    setErrors(errs);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setTouched({ name: true, whatsapp: true, campus: true });
    const errs = validate({ name, whatsapp, campus });
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      return;
    }

    setIsLoading(true);

    // Fake authentication delay
    setTimeout(() => {
      const firstName = name.trim().split(" ")[0];
      setSuccessName(firstName);
      setIsLoading(false);

      login({
        name: name.trim(),
        whatsapp: whatsapp.trim(),
        campus: campus.trim(),
      });

      if (onSuccess) {
        onSuccess({ name, whatsapp, campus });
      }

      // Navigate after ~1.4s
      setTimeout(() => {
        navigate(initialRedirect, { replace: true });
      }, 1400);
    }, 750);
  }

  if (successName) {
    return (
      <div className="login-success-state" role="status" aria-live="polite">
        <div className="success-icon-badge">🎉</div>
        <h3>You're signed in, {successName}!</h3>
        <p>Taking you to the campus lost &amp; found board...</p>
        <div className="loading-bar-pill">
          <div className="loading-bar-fill"></div>
        </div>
      </div>
    );
  }

  return (
    <form className="accessible-login-form" onSubmit={handleSubmit} noValidate>
      {/* Full Name */}
      <div className={`form-row ${touched.name && errors.name ? "has-error" : ""}`}>
        <label htmlFor={nameId}>
          Full name <span className="req">*</span>
        </label>
        <input
          id={nameId}
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (touched.name) {
              setErrors(validate({ name: e.target.value, whatsapp, campus }));
            }
          }}
          onBlur={() => handleBlur("name")}
          placeholder="e.g. Aditi Sharma"
          aria-required="true"
          aria-invalid={touched.name && !!errors.name}
          aria-describedby={touched.name && errors.name ? nameErrorId : undefined}
          autoComplete="name"
          disabled={isLoading}
        />
        {touched.name && errors.name && (
          <span className="field-error-msg" id={nameErrorId} role="alert">
            {errors.name}
          </span>
        )}
      </div>

      {/* WhatsApp Number */}
      <div className={`form-row ${touched.whatsapp && errors.whatsapp ? "has-error" : ""}`}>
        <label htmlFor={whatsappId}>
          WhatsApp Number <span className="req">*</span>
        </label>
        <input
          id={whatsappId}
          type="tel"
          value={whatsapp}
          onChange={(e) => {
            setWhatsapp(e.target.value);
            if (touched.whatsapp) {
              setErrors(validate({ name, whatsapp: e.target.value, campus }));
            }
          }}
          onBlur={() => handleBlur("whatsapp")}
          placeholder="+91 98765 43210"
          aria-required="true"
          aria-invalid={touched.whatsapp && !!errors.whatsapp}
          aria-describedby={touched.whatsapp && errors.whatsapp ? whatsappErrorId : undefined}
          autoComplete="tel"
          disabled={isLoading}
        />
        <span className="field-hint">Used for instant match notifications and desk verification.</span>
        {touched.whatsapp && errors.whatsapp && (
          <span className="field-error-msg" id={whatsappErrorId} role="alert">
            {errors.whatsapp}
          </span>
        )}
      </div>

      {/* Campus Name */}
      <div className={`form-row ${touched.campus && errors.campus ? "has-error" : ""}`}>
        <label htmlFor={campusId}>
          College / Campus <span className="req">*</span>
        </label>
        <input
          id={campusId}
          type="text"
          value={campus}
          onChange={(e) => {
            setCampus(e.target.value);
            if (touched.campus) {
              setErrors(validate({ name, whatsapp, campus: e.target.value }));
            }
          }}
          onBlur={() => handleBlur("campus")}
          placeholder="e.g. IIT Delhi / Main Campus"
          aria-required="true"
          aria-invalid={touched.campus && !!errors.campus}
          aria-describedby={touched.campus && errors.campus ? campusErrorId : undefined}
          disabled={isLoading}
        />
        {touched.campus && errors.campus && (
          <span className="field-error-msg" id={campusErrorId} role="alert">
            {errors.campus}
          </span>
        )}
      </div>

      {/* Submit Button */}
      <button className="submit-btn login-btn" type="submit" disabled={isLoading}>
        {isLoading ? (
          <span className="btn-loading-wrap">
            <span className="spinner-dot"></span> Signing in...
          </span>
        ) : (
          "Continue to Lost & Found →"
        )}
      </button>
    </form>
  );
}
