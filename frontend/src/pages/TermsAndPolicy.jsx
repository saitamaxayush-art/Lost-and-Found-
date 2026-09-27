import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/landing.css";
import "../styles/sections.css";

export default function TermsAndPolicy({ initialTab = "terms" }) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname.includes("privacy") || location.pathname.includes("policy")) {
      return "policy";
    }
    return initialTab;
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    if (location.pathname.includes("privacy") || location.pathname.includes("policy")) {
      setActiveTab("policy");
    } else {
      setActiveTab("terms");
    }
  }, [location.pathname]);

  return (
    <div className="lp-root lp-legal-page">
      {/* Top Header */}
      <header className="lp-legal-header">
        <div className="lp-legal-header-inner">
          <Link to="/" className="lp-legal-brand" aria-label="FindBack Home">
            <span className="lp-brand-dot" />
            <span className="lp-brand-text">FindBack</span>
          </Link>
          <Link to="/" className="lp-legal-back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Document Content */}
      <main className="lp-legal-container">
        <div className="lp-legal-card">
          <div className="lp-legal-hero">
            <span className="lp-eyebrow">Legal &amp; Compliance</span>
            <h1>Terms of Service &amp; Privacy Policy</h1>
            <p className="lp-legal-lead">
              Transparency, accountability, and student privacy are central to the FindBack campus portal.
              Please review the terms governing item reporting, verification, and our data protection policies.
            </p>

            {/* Tab Switcher */}
            <div className="lp-legal-tabs" role="tablist" aria-label="Legal sections">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "terms"}
                className={`lp-legal-tab ${activeTab === "terms" ? "is-active" : ""}`}
                onClick={() => setActiveTab("terms")}
              >
                Terms &amp; Conditions
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "policy"}
                className={`lp-legal-tab ${activeTab === "policy" ? "is-active" : ""}`}
                onClick={() => setActiveTab("policy")}
              >
                Privacy Policy
              </button>
            </div>
          </div>

          <div className="lp-legal-body">
            {activeTab === "terms" ? (
              <article className="lp-legal-content" tabIndex={0} aria-label="Terms and Conditions Document">
                <div className="lp-legal-meta">
                  <span>Last updated: September 2026</span>
                  <span>Effective: Fall Semester 2026</span>
                </div>

                <section className="lp-legal-section">
                  <h2>1. Acceptance of Terms</h2>
                  <p>
                    By accessing, browsing, or using FindBack (the "Platform"), you agree to be bound by these
                    Terms and Conditions and all applicable campus guidelines, university codes of conduct, and local
                    regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                  </p>
                </section>

                <section className="lp-legal-section">
                  <h2>2. Eligibility &amp; Campus Verification</h2>
                  <p>
                    FindBack is an official campus lost-and-found matching service intended for students, faculty,
                    staff, and authorized campus visitors. You agree that:
                  </p>
                  <ul>
                    <li>All information provided in lost or found reports is truthful, accurate, and up to date.</li>
                    <li>
                      You will not impersonate any other student, faculty member, or campus administrator when submitting
                      or claiming items.
                    </li>
                    <li>
                      Official university or institution photo identification (e.g. Student ID Card) may be requested
                      prior to the physical release of high-value items (such as laptops, phones, wallets, or jewelry).
                    </li>
                  </ul>
                </section>

                <section className="lp-legal-section">
                  <h2>3. Item Reporting &amp; Ownership Claims</h2>
                  <p>
                    When submitting an item to FindBack:
                  </p>
                  <ul>
                    <li>
                      <strong>Found Items:</strong> Finders must hand over items to designated campus collection points
                      (Library Helpdesk, Student Union, or Campus Security) within 48 hours of posting.
                    </li>
                    <li>
                      <strong>Ownership Verification:</strong> Claimants must furnish verifiable identifying details
                      (e.g., lock-screen wallpaper, serial numbers, unique scratches, or exact contents) before handoff.
                    </li>
                    <li>
                      <strong>False or Fraudulent Claims:</strong> Intentionally claiming property that does not belong to you
                      constitutes theft and will be referred immediately to Campus Security and the University Disciplinary Committee.
                    </li>
                  </ul>
                </section>

                <section className="lp-legal-section">
                  <h2>4. Unclaimed Property &amp; Retention</h2>
                  <p>
                    Items reported or deposited on campus are subject to the following standard holding schedules:
                  </p>
                  <ul>
                    <li><strong>Standard Items (clothing, books, water bottles):</strong> Held for a minimum of 45 days.</li>
                    <li><strong>Valuable Electronics &amp; Wallets:</strong> Held securely for up to 90 days.</li>
                    <li><strong>Official Government or Student IDs:</strong> Forwarded to the Registrar’s Office within 7 days.</li>
                    <li>
                      Unclaimed property after the maximum retention period will be responsibly donated to registered campus charities
                      or recycled according to university sustainability policies.
                    </li>
                  </ul>
                </section>

                <section className="lp-legal-section">
                  <h2>5. Limitation of Liability</h2>
                  <p>
                    FindBack provides an automated matching and notification platform to assist the community. While we take every
                    reasonable measure to facilitate safe returns, FindBack and its administrators are not liable for:
                  </p>
                  <ul>
                    <li>Any damage, loss, or deterioration of items prior to, during, or after physical retrieval.</li>
                    <li>Direct transactions or communications between independent users outside designated campus security desks.</li>
                  </ul>
                </section>

                <section className="lp-legal-section">
                  <h2>6. Contact &amp; Grievances</h2>
                  <p>
                    If you have questions regarding these Terms or wish to dispute an item claim, please contact the campus
                    Lost &amp; Found office at <a href="mailto:lostandfound@campus.edu">lostandfound@campus.edu</a> or visit
                    Room 102, Student Services Center.
                  </p>
                </section>
              </article>
            ) : (
              <article className="lp-legal-content" tabIndex={0} aria-label="Privacy Policy Document">
                <div className="lp-legal-meta">
                  <span>Last updated: September 2026</span>
                  <span>Compliance: Student Privacy &amp; Data Security</span>
                </div>

                <section className="lp-legal-section">
                  <h2>1. Information We Collect</h2>
                  <p>
                    We collect only the minimal information required to match lost items with their rightful owners:
                  </p>
                  <ul>
                    <li><strong>Report Details:</strong> Item title, category, description, date lost/found, and campus location.</li>
                    <li><strong>Contact Information:</strong> Student email address, name, and optional phone number for verification alerts.</li>
                    <li><strong>Photographs:</strong> Uploaded images of found property (which are checked to prevent public display of sensitive personal identity documents).</li>
                  </ul>
                </section>

                <section className="lp-legal-section">
                  <h2>2. How We Use Your Data</h2>
                  <p>
                    Your data is strictly utilized for the sole purpose of operating the campus lost-and-found system:
                  </p>
                  <ul>
                    <li>Running automated semantic matching algorithms to connect lost queries with found catalog entries.</li>
                    <li>Sending automated notification alerts when potential matches are identified.</li>
                    <li>Verifying ownership credentials prior to physical handoff at campus service points.</li>
                  </ul>
                </section>

                <section className="lp-legal-section">
                  <h2>3. Data Protection &amp; Confidentiality</h2>
                  <p>
                    We respect your privacy. Under no circumstances is personal student data sold, leased, or shared with third-party advertisers or external marketing organizations:
                  </p>
                  <ul>
                    <li>Phone numbers and sensitive contact details are masked and visible only to authorized desk administrators.</li>
                    <li>Sensitive identifiers (e.g. driver’s licenses, credit cards) are redacted from public listings.</li>
                    <li>All data transmitted through FindBack is encrypted using industry-standard TLS protocols.</li>
                  </ul>
                </section>

                <section className="lp-legal-section">
                  <h2>4. Data Retention &amp; Right to Erasure</h2>
                  <p>
                    Once an item is successfully marked as <em>Returned</em>, personal contact records associated with that
                    transaction are archived after 30 days and purged permanently after 90 days. Users may request expedited
                    deletion of their report history at any time by contacting our administrator.
                  </p>
                </section>

                <section className="lp-legal-section">
                  <h2>5. Privacy Officer Contact</h2>
                  <p>
                    For inquiries, data access requests, or privacy concerns, please contact our Campus Data Protection Officer
                    at <a href="mailto:privacy@campus.edu">privacy@campus.edu</a>.
                  </p>
                </section>
              </article>
            )}
          </div>
        </div>
      </main>

      {/* Legal Footer */}
      <footer className="lp-legal-foot">
        <div className="lp-wrap">
          <p>&copy; {new Date().getFullYear()} FindBack Campus Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
