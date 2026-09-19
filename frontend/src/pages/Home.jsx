import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import ItemCard from "../components/ItemCard";

export default function Home() {
  const { items } = useApp();
  const navigate = useNavigate();
  const [heroQuery, setHeroQuery] = useState("");
  const [activeFaq, setActiveFaq] = useState(null);

  function handleHeroSearch(e) {
    e.preventDefault();
    if (heroQuery.trim()) {
      navigate(`/browse?q=${encodeURIComponent(heroQuery.trim())}`);
    } else {
      navigate("/browse");
    }
  }

  function toggleFaq(index) {
    setActiveFaq((prev) => (prev === index ? null : index));
  }

  // Pick 3 recent items for the spotlight preview
  const recentItems = items.slice(0, 3);

  const faqs = [
    {
      q: "What should I do if I find someone's lost item on campus?",
      a: "Click 'Report Found' to log the item with a photo, description, and where you found it. Then hand it over to the nearest campus security or administration desk so the owner can collect it safely.",
    },
    {
      q: "How does the smart matching system work?",
      a: "FindBack analyzes descriptions, categories, and keywords across lost and found reports. When matching keywords (such as brand, color, or model) are detected, an alert is triggered in the notification bell with a link to the match.",
    },
    {
      q: "How do I prove that a found item is actually mine?",
      a: "When you go to the Lost & Found desk to collect your item, provide identifying details not visible in public photos (such as phone lock screen wallpapers, internal markings, serial numbers, or backpack contents).",
    },
    {
      q: "Can I update the status of my report once an item is returned?",
      a: "Yes! On each item's detail page, you can advance the status from 'Reported' to 'Matched' and finally to 'Returned' once the item has been recovered.",
    },
    {
      q: "Is this portal free for all campus students and faculty?",
      a: "Yes, FindBack is completely free and designed exclusively for the campus community to make item recovery fast, transparent, and collaborative.",
    },
  ];

  return (
    <div className="home-container">
      {/* 1. HERO SECTION */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">🎓 Campus Lost &amp; Found Portal</div>
          <h1 className="hero-title">
            Find what you've <em>lost</em>.<br />
            Return what you've <em>found</em>.
          </h1>
          <p className="hero-subtitle">
            The intelligent campus recovery platform. Instant automated matching, verified student
            handovers, and real-time status tracking across every department.
          </p>

          {/* Quick Search Pill */}
          <form className="hero-search-pill" onSubmit={handleHeroSearch}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="What did you lose? (e.g. blue bottle, AirPods, keys, ID card...)"
              value={heroQuery}
              onChange={(e) => setHeroQuery(e.target.value)}
              className="hero-search-input"
            />
            <button type="submit" className="hero-search-btn">
              Search Items <span>→</span>
            </button>
          </form>

          {/* Quick Action CTAs */}
          <div className="hero-actions">
            <Link to="/report-lost" className="btn-hero-primary">
              <span className="btn-icon">📍</span> Report a Lost Item
            </Link>
            <Link to="/report-found" className="btn-hero-secondary">
              <span className="btn-icon">🎁</span> Report a Found Item
            </Link>
            <Link to="/browse" className="btn-hero-ghost">
              Browse Directory <span>→</span>
            </Link>
          </div>

          {/* Key Metrics Bar */}
          <div className="hero-metrics">
            <div className="metric-item">
              <span className="metric-num">95%+</span>
              <span className="metric-label">Match Resolution</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-item">
              <span className="metric-num">Instant</span>
              <span className="metric-label">Keyword Cross-Match</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-item">
              <span className="metric-num">100%</span>
              <span className="metric-label">Campus Coverage</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-item">
              <span className="metric-num">Verified</span>
              <span className="metric-label">Desk Custody Handover</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS (HOW YOU GET IT BACK) */}
      <section className="steps-section" id="how-it-works">
        <div className="section-header">
          <span className="section-tag">System Process</span>
          <h2>How you get it <em>back</em>.</h2>
          <p>A transparent, 3-step lifecycle designed to reunite students with their belongings.</p>
        </div>

        <div className="steps-grid">
          {/* STEP 1 */}
          <div className="step-card">
            <div className="step-header">
              <span className="step-number">(1)</span>
              <h3>Items get logged &amp; photographed</h3>
            </div>
            <p className="step-desc">
              Left behind in a lecture hall, cafeteria, lab, or library? Whoever finds it logs the
              item with photo previews, category, and precise drop-off location.
            </p>
            <div className="step-visual">
              <div className="mockup-card">
                <div className="mockup-tag found">FOUND ITEM</div>
                <div className="mockup-title">Sony Noise Cancelling Headphones</div>
                <div className="mockup-meta">
                  <span>📍 Central Library, 2nd Floor</span>
                  <span>⏱️ Logged 10m ago</span>
                </div>
                <div className="mockup-status-bar">
                  <span className="status-pill reported">Status: Reported</span>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="step-card featured-step">
            <div className="step-header">
              <span className="step-number">(2)</span>
              <h3>Automated smart cross-matching</h3>
            </div>
            <p className="step-desc">
              Our matching engine scans newly reported lost items against all logged found items.
              When keywords and categories match, an instant alert triggers in the notification
              bell.
            </p>
            <div className="step-visual">
              <div className="mockup-match-box">
                <div className="match-alert-badge">
                  <span className="bell-ring">🔔</span>
                  <strong>High Probability Match Detected!</strong>
                </div>
                <div className="match-comparison">
                  <div className="match-side">
                    <span className="side-label">Your Lost Report</span>
                    <span className="side-val">"Black Sony XM4 headphones left near study desks"</span>
                  </div>
                  <span className="match-arrow">⇄</span>
                  <div className="match-side">
                    <span className="side-label">Found Log</span>
                    <span className="side-val">"Sony Noise Cancelling Headphones at Central Library"</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="step-card">
            <div className="step-header">
              <span className="step-number">(3)</span>
              <h3>Verify, track status &amp; collect</h3>
            </div>
            <p className="step-desc">
              Watch your item move from <em>Reported</em> to <em>Matched</em> to <em>Returned</em>.
              Show your student ID and claim code at the campus Lost &amp; Found desk to safely collect it.
            </p>
            <div className="step-visual">
              <div className="mockup-tracker">
                <div className="tracker-steps">
                  <div className="t-step done">
                    <div className="t-circle">✓</div>
                    <span>Reported</span>
                  </div>
                  <div className="t-line active"></div>
                  <div className="t-step done">
                    <div className="t-circle">✓</div>
                    <span>Matched</span>
                  </div>
                  <div className="t-line active"></div>
                  <div className="t-step done highlight">
                    <div className="t-circle">🎉</div>
                    <span>Returned</span>
                  </div>
                </div>
                <div className="tracker-desk-note">Desk Reference #FB-2026-904</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE FEATURES GRID */}
      <section className="features-section">
        <div className="section-header">
          <span className="section-tag">Platform Highlights</span>
          <h2>Features built for <em>campus efficiency</em>.</h2>
          <p>Everything you need to report, locate, and claim misplaced belongings without stress.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Smart Keyword Matching</h3>
            <p>
              Automated correlation detects similarity in descriptions and categories between lost
              and found reports immediately.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📸</div>
            <h3>Instant Image Previews</h3>
            <p>
              Upload real photographs directly from your phone for visual confirmation, avoiding
              mistaken identity.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>3-Stage Status Tracking</h3>
            <p>
              Clear real-time tracking through <code>Reported → Matched → Returned</code> so
              everyone stays in the loop.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔔</div>
            <h3>Notification Bell Alerts</h3>
            <p>
              Navbar alert counter rings whenever an opposite-type report shares keywords with
              something you posted.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Verified Campus Handover</h3>
            <p>
              Prevents unauthorized claims with mandatory campus authentication and physical desk
              verification.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔎</div>
            <h3>Deep Search &amp; Filtering</h3>
            <p>
              Search by item category, keyword, report type, or current status with lightning-fast
              client-side filtering.
            </p>
          </div>
        </div>
      </section>

      {/* 4. RECENT ACTIVITY SPOTLIGHT */}
      <section className="spotlight-section">
        <div className="spotlight-header">
          <div>
            <span className="section-tag">Live Feed</span>
            <h2>Recent campus reports</h2>
            <p>Latest items logged across campus departments.</p>
          </div>
          <Link to="/browse" className="btn-outline">
            View All Reports ({items.length}) <span>→</span>
          </Link>
        </div>

        <div className="spotlight-grid">
          {recentItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* 5. INTERACTIVE FAQ ACCORDION */}
      <section className="faq-section" id="faqs">
        <div className="section-header">
          <span className="section-tag">Have Questions?</span>
          <h2>Frequently asked <em>questions</em>.</h2>
          <p>Everything you need to know about navigating the campus lost &amp; found system.</p>
        </div>

        <div className="faq-container">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={index}
                className={`faq-item ${isOpen ? "open" : ""}`}
                onClick={() => toggleFaq(index)}
              >
                <div className="faq-question">
                  <span>{faq.q}</span>
                  <span className="faq-toggle-icon">{isOpen ? "−" : "+"}</span>
                </div>
                {isOpen && (
                  <div className="faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section className="cta-banner-section">
        <div className="cta-banner">
          <h2>Lost something around campus today?</h2>
          <p>
            Don't wait hoping it turns up. Submit a report now and let our automated system notify
            you the second it is handed in.
          </p>
          <div className="cta-buttons">
            <Link to="/report-lost" className="btn-cta-lost">
              Report Lost Item <span>→</span>
            </Link>
            <Link to="/report-found" className="btn-cta-found">
              Report Found Item <span>→</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
