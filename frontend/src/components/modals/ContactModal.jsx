import { useState } from "react";

export default function ContactModal({ open, onClose }) {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", query: "" });

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.query) return;
    setSent(true);
  }

  function handleReset() {
    setSent(false);
    setForm({ name: "", email: "", query: "" });
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Contact us">
      <div className="modal-sheet contact-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-tag">Help &amp; Support</span>
            <h2>Contact Campus Lost &amp; Found</h2>
            <p>Need urgent help identifying an item or visiting the physical desk?</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="contact-body">
          {/* Quick info grid */}
          <div className="contact-info-grid">
            <div className="contact-card">
              <div className="contact-icon">🏢</div>
              <div className="contact-text">
                <strong>Physical Collection Desk</strong>
                <p>Room 102, Student Services &amp; Security Central, Academic Block A</p>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-icon">⏰</div>
              <div className="contact-text">
                <strong>Desk Operating Hours</strong>
                <p>Monday – Saturday: 9:00 AM – 6:00 PM (Emergency lockup 24/7)</p>
              </div>
            </div>

            <div className="contact-card highlight">
              <div className="contact-icon">💬</div>
              <div className="contact-text">
                <strong>WhatsApp Campus Helpline</strong>
                <p>Instant item verification &amp; photo match assistance</p>
                <a
                  href="https://wa.me/919876543210?text=Hi%20FindBack%20Team%2C%20I%20need%20help%20with%20a%20lost%2Ffound%20item"
                  target="_blank"
                  rel="noreferrer"
                  className="whatsapp-btn"
                >
                  Chat on WhatsApp &rarr;
                </a>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-icon">✉️</div>
              <div className="contact-text">
                <strong>Email Address</strong>
                <p>lostfound@campus.edu &bull; security-desk@campus.edu</p>
              </div>
            </div>
          </div>

          {/* Quick query form */}
          <div className="contact-form-section">
            <h3>Send a Message to the Desk</h3>
            {sent ? (
              <div className="contact-sent-alert">
                <div className="sent-icon">✓</div>
                <h4>Message Received!</h4>
                <p>The campus help desk will review your inquiry and get back to you shortly.</p>
                <button className="primary-gold-btn" onClick={handleReset}>
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group-row">
                  <div className="form-group">
                    <label htmlFor="contact-name">Your Full Name</label>
                    <input
                      id="contact-name"
                      type="text"
                      placeholder="e.g. Aditi Sharma"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="contact-email">Email or WhatsApp Number</label>
                    <input
                      id="contact-email"
                      type="text"
                      placeholder="e.g. aditi@campus.edu"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="contact-msg">Item Details or Message</label>
                  <textarea
                    id="contact-msg"
                    rows="3"
                    placeholder="Describe the item you are inquiring about or need special assistance with..."
                    required
                    value={form.query}
                    onChange={(e) => setForm({ ...form, query: e.target.value })}
                  />
                </div>

                <button type="submit" className="primary-gold-btn">
                  Send Message to Desk
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
