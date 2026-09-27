import { useEffect, useRef, useState } from "react";
import "../../styles/hero.css";

function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export default function HeroSection({ goTo, isHovered, onMouseEnter, onMouseLeave }) {
  const statRef = useRef(null);
  const [hasAnimatedStats, setHasAnimatedStats] = useState(false);
  const [stat1, setStat1] = useState(0);
  const [stat2, setStat2] = useState(0);
  const [stat3, setStat3] = useState(0);
  const [isScrolledPast, setIsScrolledPast] = useState(false);

  // Scroll indicator fade-out when scrolled past 10% of viewport
  useEffect(() => {
    const handleScroll = () => {
      const threshold = window.innerHeight * 0.1;
      setIsScrolledPast(window.scrollY > threshold);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Easing count-up animation when stats scroll into view
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setStat1(11375);
      setStat2(68);
      setStat3(2.4);
      setHasAnimatedStats(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimatedStats) {
          setHasAnimatedStats(true);

          const duration = 1850;
          let startTime = null;

          const animate = (time) => {
            if (!startTime) startTime = time;
            const elapsed = time - startTime;
            const progress = Math.min(1, elapsed / duration);
            const eased = easeOutExpo(progress);

            setStat1(Math.round(eased * 11375));
            setStat2(Math.round(eased * 68));
            setStat3(Number((eased * 2.4).toFixed(1)));

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.2 }
    );

    if (statRef.current) {
      observer.observe(statRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimatedStats]);

  return (
    <section
      id="top"
      className={`hero-editorial-section ${isHovered ? "is-hovered" : ""}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-label="Campus Lost and Found Hero"
    >
      {/* Subtle print paper grain overlay */}
      <div className="hero-grain-overlay" aria-hidden="true" />

      {/* Two-Column Editorial Layout */}
      <div className="hero-editorial-container">
        {/* Left Column: Copy, CTAs, and Stats */}
        <div className="hero-copy-col">
          <div className="hero-kicker-tag">
            <span className="hero-kicker-dot" />
            <span>Campus Lost &amp; Found</span>
          </div>

          <h1 className="hero-headline">
            Everything lost finds its way <em>back</em> home.
          </h1>

          <p className="hero-subhead">
            Report what you have lost or found, and let smart matching quietly do the searching.
          </p>

          <div className="hero-actions-row">
            <button
              type="button"
              className="hero-primary-btn"
              onClick={() => goTo?.("search")}
            >
              Search a lost item
            </button>

            <button
              type="button"
              className="hero-ghost-link"
              onClick={() => goTo?.("how-it-works")}
            >
              See how it works
            </button>
          </div>

          {/* Stat Row Directly Below CTAs */}
          <div ref={statRef} className="hero-stats-row">
            <div className="hero-stat-col">
              <span className="hero-stat-value">
                {stat1.toLocaleString()}
              </span>
              <span className="hero-stat-label">items reported</span>
            </div>

            <div className="hero-stat-col">
              <span className="hero-stat-value">
                {stat2}%
              </span>
              <span className="hero-stat-label">success rate</span>
            </div>

            <div className="hero-stat-col">
              <span className="hero-stat-value">
                {stat3.toFixed(1)} days
              </span>
              <span className="hero-stat-label">avg. to match</span>
            </div>
          </div>
        </div>

        {/* Right Column: Overlapping Real Object Photographs */}
        <div className="hero-visual-col" aria-hidden="true">
          <div className="hero-cards-cluster">
            {/* Top Photo: Distressed Leather Wallet with Key Fob (-6deg) */}
            <div className="hero-photo-frame hero-photo-wallet">
              <img
                src="/hero/wallet.jpg"
                alt="Distressed black leather bifold wallet with brass key fob"
                loading="eager"
                decoding="async"
              />
            </div>

            {/* Floating Match Chip 1 */}
            <div className="hero-match-chip hero-chip-wallet">
              <span className="hero-chip-dot is-amber" />
              <span>Black wallet · matched today</span>
            </div>

            {/* Bottom Photo: Canvas Cotton Tote with Notebook & Glasses (+4deg) */}
            <div className="hero-photo-frame hero-photo-tote">
              <img
                src="/hero/tote.jpg"
                alt="Natural canvas cotton tote bag with leather notebook and glasses"
                loading="eager"
                decoding="async"
              />
            </div>

            {/* Floating Match Chip 2 */}
            <div className="hero-match-chip hero-chip-tote">
              <span className="hero-chip-dot is-green" />
              <span>Canvas tote · returned</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Center Scroll Indicator (Fades out past 10% scroll) */}
      <button
        type="button"
        className={`hero-scroll-indicator ${isScrolledPast ? "is-hidden" : ""}`}
        onClick={() => goTo?.("search")}
        aria-label="Scroll down to search board"
      >
        <span className="hero-scroll-label">Scroll</span>
        <div className="hero-scroll-line-wrap" />
      </button>
    </section>
  );
}
