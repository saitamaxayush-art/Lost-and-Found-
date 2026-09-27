import { useState } from "react";
import { Link } from "react-router-dom";

export default function ContactSection({ onMouseEnter, onMouseLeave, isHovered }) {
  const [sent, setSent] = useState(false);
  const [v, setV] = useState({ name: "", email: "", message: "" });
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  function submit(e) {
    e.preventDefault();
    // Mock only — wire this to a real endpoint later.
    setSent(true);
  }

  return (
    <section
      id="contact"
      className={`lp-section lp-contact ${isHovered ? "is-hovered" : ""}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="lp-wrap">
        <div className="lp-head reveal">
          <span className="lp-eyebrow">Get in Touch</span>
          <h2>Contact Us</h2>
          <p>Have a question, a bug to report, or an idea to make FindBack better? We'd love to hear it.</p>
        </div>

        <div className="ct-layout">
          <div className="ct-info reveal">
            <div className="lp-contact-card">
              <span className="lp-contact-label">Email</span>
              <a href="mailto:hello@findback.app">hello@findback.app</a>
            </div>
            <div className="lp-contact-card">
              <span className="lp-contact-label">Campus Desk</span>
              <span>Student Activities Office, Main Building</span>
            </div>
            <div className="lp-contact-card">
              <span className="lp-contact-label">Hours</span>
              <span>Mon – Sat, 9am – 6pm</span>
            </div>
          </div>

          <form className="ct-form reveal" onSubmit={submit}>
            {sent ? (
              <div className="ct-sent" role="status">
                <div className="lf-check" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </div>
                <h3>Message sent</h3>
                <p>Thanks{v.name ? `, ${v.name.split(" ")[0]}` : ""} — we'll get back to you soon.</p>
              </div>
            ) : (
              <>
                <div className="lf-row">
                  <label htmlFor="ct-name">Full name</label>
                  <input id="ct-name" value={v.name} onChange={set("name")} required autoComplete="name" />
                </div>
                <div className="lf-row">
                  <label htmlFor="ct-email">Email</label>
                  <input id="ct-email" type="email" value={v.email} onChange={set("email")} required autoComplete="email" />
                </div>
                <div className="lf-row">
                  <label htmlFor="ct-msg">Message</label>
                  <textarea id="ct-msg" rows={4} value={v.message} onChange={set("message")} required />
                </div>
                <button type="submit" className="lf-submit">Send message</button>
              </>
            )}
          </form>
        </div>

        <footer className="lp-footer">
          <div className="lp-footer-inner">
            <div className="lp-footer-brand">
              <strong>FindBack</strong> — Campus Lost &amp; Found Portal
            </div>
            <div className="lp-footer-links">
              <Link to="/terms" className="lp-footer-link" id="footer-terms-link">
                Terms &amp; Conditions
              </Link>
              <span className="lp-footer-sep" aria-hidden="true">•</span>
              <Link to="/privacy" className="lp-footer-link" id="footer-policy-link">
                Privacy Policy
              </Link>
            </div>
            <div className="lp-footer-copy">
              &copy; {new Date().getFullYear()} FindBack. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}
