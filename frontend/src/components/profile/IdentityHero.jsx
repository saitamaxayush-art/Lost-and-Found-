import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTilt } from "../../hooks/useTilt";
import { useCountUp } from "../../hooks/useCountUp";
import Avatar from "../common/Avatar";
import ProgressRing from "./ProgressRing";
import Sparkline from "./Sparkline";
import HeroStars from "./HeroStars";
import { useApp } from "../../context/AppContext";

export default function IdentityHero({
  user,
  userPoints = 0,
  userRank = 1,
  reportsCount = 0,
  pointsLedger = [],
  onReportLost,
  onReportFound,
}) {
  const navigate = useNavigate();
  const heroRef = useTilt({ maxTilt: 2.2, perspective: 1200, damping: 0.075 });
  const [contactOpen, setContactOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const contactRef = useRef(null);

  const animatedPoints = useCountUp(userPoints, 700);
  const animatedRank = useCountUp(userRank, 650);
  const animatedReports = useCountUp(reportsCount, 650);

  const tier =
    userPoints >= 300
      ? "Campus Guardian"
      : userPoints >= 150
      ? "Gold Helper"
      : "Active Member";

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  useEffect(() => {
    if (!contactOpen) return;
    const onDown = (e) => {
      if (contactRef.current && !contactRef.current.contains(e.target)) {
        setContactOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [contactOpen]);

  return (
    <header className="pf-hero-card" ref={heroRef}>
      {/* Background Starfield & Nebula */}
      <HeroStars />

      {/* Specular highlight & Grain overlay */}
      <div className="pf-hero-specular" aria-hidden="true" />
      <div className="pf-hero-grain" aria-hidden="true" />

      <div className="pf-hero-content">
        {/* Left: 96px Avatar with Progress Ring + Name + Subtitle */}
        <div className="pf-hero-profile">
          <div
            className="pf-hero-avatar-wrap"
            onClick={() => navigate("/edit-profile")}
            title="Edit profile & photo"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate("/edit-profile")}
          >
            <ProgressRing points={userPoints} size={114} strokeWidth={3}>
              <Avatar
                name={user.name || "Student"}
                image={user.avatar || null}
                size={96}
                className="pf-hero-avatar"
              />
            </ProgressRing>
            <span className="pf-avatar-edit-badge" title="Edit Profile">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </span>
          </div>

          <div className="pf-hero-meta">
            <h1 className="pf-hero-name">{user.name || "Student"}</h1>

            <div className="pf-hero-subline">
              <span className="pf-hero-dept">
                {user.campus || user.department || "Main Campus"}
              </span>
              <span className="pf-meta-dot" aria-hidden="true">·</span>
              <span className="pf-hero-tier-badge">{tier}</span>

              <span className="pf-meta-dot" aria-hidden="true">·</span>
              {/* Contact popover trigger */}
              <div className="pf-contact-anchor" ref={contactRef}>
                <button
                  type="button"
                  className="pf-contact-btn"
                  onClick={() => setContactOpen((v) => !v)}
                  aria-expanded={contactOpen}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <span>Contact</span>
                </button>

                {contactOpen && (
                  <div className="pf-contact-popover" role="dialog" aria-label="Contact Details">
                    <div className="pf-contact-row">
                      <div className="pf-contact-info">
                        <span className="pf-contact-lbl">Email</span>
                        <span className="pf-contact-val">{user.email || "demo@student.edu"}</span>
                      </div>
                      <button
                        type="button"
                        className="pf-copy-btn"
                        onClick={() => handleCopy(user.email || "demo@student.edu", "email")}
                        title="Copy email"
                      >
                        {copiedKey === "email" ? "Copied" : "Copy"}
                      </button>
                    </div>

                    {user.whatsapp && (
                      <div className="pf-contact-row">
                        <div className="pf-contact-info">
                          <span className="pf-contact-lbl">WhatsApp</span>
                          <span className="pf-contact-val">{user.whatsapp}</span>
                        </div>
                        <button
                          type="button"
                          className="pf-copy-btn"
                          onClick={() => handleCopy(user.whatsapp, "phone")}
                          title="Copy phone"
                        >
                          {copiedKey === "phone" ? "Copied" : "Copy"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Three Stats with Dividers & Sparkline + Actions */}
        <div className="pf-hero-right">
          <div className="pf-hero-stats">
            <div className="pf-stat-block">
              <span className="pf-stat-number">{animatedPoints}</span>
              <span className="pf-stat-label">Points</span>
              <div className="pf-stat-sparkline-row">
                <Sparkline pointsLedger={pointsLedger} width={92} height={20} />
              </div>
            </div>

            <div className="pf-stat-divider" aria-hidden="true" />

            <div className="pf-stat-block">
              <span className="pf-stat-number">#{animatedRank}</span>
              <span className="pf-stat-label">Rank</span>
            </div>

            <div className="pf-stat-divider" aria-hidden="true" />

            <div className="pf-stat-block">
              <span className="pf-stat-number">{animatedReports}</span>
              <span className="pf-stat-label">Reports</span>
            </div>
          </div>

          <div className="pf-hero-actions">
            <button
              type="button"
              className="pf-btn-edit-profile"
              onClick={() => navigate("/edit-profile")}
              title="Edit profile & campus information"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span>Edit profile</span>
            </button>
            <button
              type="button"
              className="pf-btn-report-lost"
              onClick={onReportLost}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Report lost</span>
            </button>
            <button
              type="button"
              className="pf-btn-report-found"
              onClick={onReportFound}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Report found</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
