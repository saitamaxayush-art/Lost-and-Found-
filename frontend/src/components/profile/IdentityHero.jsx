import React, { useState, useRef, useEffect } from "react";
import { useTilt } from "../../hooks/useTilt";
import { useCountUp } from "../../hooks/useCountUp";
import Avatar from "../common/Avatar";
import ProgressRing from "./ProgressRing";
import Sparkline from "./Sparkline";
import NotificationsPopover from "./NotificationsPopover";

export default function IdentityHero({
  user,
  userPoints = 0,
  userRank = 1,
  reportsCount = 0,
  pointsLedger = [],
  notifications = [],
  onDismissNotifications,
  onReportLost,
  onReportFound,
}) {
  const heroRef = useTilt({ maxTilt: 3, perspective: 1200 });
  const [notifOpen, setNotifOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const contactRef = useRef(null);

  const animatedPoints = useCountUp(userPoints, 650);
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
      {/* Specular highlight & Grain overlay */}
      <div className="pf-hero-specular" aria-hidden="true" />
      <div className="pf-hero-grain" aria-hidden="true" />

      {/* Top right notification bell button */}
      <div className="pf-hero-top-actions">
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="pf-bell-btn"
            aria-label="View notifications"
            onClick={() => setNotifOpen((prev) => !prev)}
            aria-expanded={notifOpen}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
            {notifications.length > 0 && (
              <span className="pf-bell-badge">{notifications.length}</span>
            )}
          </button>

          <NotificationsPopover
            notifications={notifications}
            isOpen={notifOpen}
            onClose={() => setNotifOpen(false)}
            onClearAll={() => {
              onDismissNotifications?.();
              setNotifOpen(false);
            }}
          />
        </div>
      </div>

      <div className="pf-hero-content">
        {/* Left: 96px Avatar with Progress Ring + Name + Subtitle */}
        <div className="pf-hero-profile">
          <ProgressRing points={userPoints} size={114} strokeWidth={3}>
            <Avatar
              name={user.name || "Student"}
              image={user.avatar || null}
              size={96}
              className="pf-hero-avatar"
            />
          </ProgressRing>

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
