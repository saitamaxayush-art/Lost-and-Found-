import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import "../../styles/howItWorks.css";

const STEPS = [
  {
    number: "01",
    title: "Log what went missing",
    description: "Submit a concise report with the date, last seen campus location, and unique identifying marks.",
    image: "/steps/step1-keys.jpg",
    alt: "Brass key ring with leather fob resting on walnut desk",
  },
  {
    number: "02",
    title: "Someone secures the item",
    description: "A finder snaps an authentic photograph and logs the exact spot where the item was safely recovered.",
    image: "/steps/step2-wallet.jpg",
    alt: "Full-grain saddle leather wallet on dark linen surface",
  },
  {
    number: "03",
    title: "Smart matching connects the dots",
    description: "Our matching engine flags identical attributes across reports and instantly notifies both parties.",
    image: "/steps/step3-glasses.jpg",
    alt: "Tortoiseshell acetate spectacles beside an open journal",
  },
  {
    number: "04",
    title: "Reunited and verified",
    description: "Confirm ownership with our campus desk and claim your property back home without friction.",
    image: "/steps/step4-watch.jpg",
    alt: "Mechanical wristwatch with olive canvas strap in leather tray",
  },
];

const CARD_WIDTH = 380;
const CARD_GAP = 56;
const CARD_PITCH = CARD_WIDTH + CARD_GAP; // 436px
const THREAD_WIDTH = CARD_PITCH * (STEPS.length - 1); // 1308px

const HowItWorksSection = forwardRef(function HowItWorksSection(
  { subscribe, isHovered, onMouseEnter, onMouseLeave },
  forwardedRef
) {
  const localRef = useRef(null);
  useImperativeHandle(forwardedRef, () => localRef.current);

  const cardsTrackRef = useRef(null);
  const maskPathRef = useRef(null);
  const cardsRef = useRef([]);
  const nodesRef = useRef([]);
  const railBarsRef = useRef([]);
  const scrollPromptRef = useRef(null);

  useEffect(() => {
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = () => window.innerWidth <= 860;

    // Direct DOM update on every animation frame — zero React re-renders for true 60fps
    const applyProgress = (p) => {
      const clampedP = Math.min(1, Math.max(0, p));

      if (isReduced || isMobile()) {
        if (cardsTrackRef.current) cardsTrackRef.current.style.transform = "none";
        cardsRef.current.forEach((card) => {
          if (card) {
            card.classList.remove("is-active", "is-past", "is-upcoming");
            card.style.opacity = "1";
            card.style.transform = "none";
          }
        });
        railBarsRef.current.forEach((bar) => {
          if (bar) bar.style.width = "100%";
        });
        if (scrollPromptRef.current) scrollPromptRef.current.style.opacity = "0";
        return;
      }

      // 1. Horizontal translate of the cards track
      // Start with Card 0 centered: startX = (viewport / 2) - (CARD_WIDTH / 2)
      const viewportW = window.innerWidth;
      const startX = viewportW / 2 - CARD_WIDTH / 2;
      const currentX = startX - clampedP * THREAD_WIDTH;

      if (cardsTrackRef.current) {
        cardsTrackRef.current.style.transform = `translate3d(${currentX.toFixed(2)}px, 0, 0)`;
      }

      // 2. Dashed thread mask revealing the gold line in sync with scroll
      if (maskPathRef.current) {
        const offset = THREAD_WIDTH * (1 - clampedP);
        maskPathRef.current.style.strokeDashoffset = offset.toFixed(1);
      }

      // 3. Segmented progress rail filling left-to-right (4 equal quarters)
      railBarsRef.current.forEach((bar, idx) => {
        if (!bar) return;
        const segmentStart = idx * 0.25;
        const segP = Math.min(1, Math.max(0, (clampedP - segmentStart) / 0.25));
        bar.style.width = `${(segP * 100).toFixed(1)}%`;
      });

      // 4. Active card calculation and styling
      // Card idx is centered at clampedP = idx / 3
      const activeIdx = Math.min(STEPS.length - 1, Math.max(0, Math.round(clampedP * (STEPS.length - 1))));

      cardsRef.current.forEach((card, idx) => {
        if (!card) return;
        if (idx === activeIdx) {
          card.classList.add("is-active");
          card.classList.remove("is-past", "is-upcoming");
        } else if (idx < activeIdx) {
          card.classList.add("is-past");
          card.classList.remove("is-active", "is-upcoming");
        } else {
          card.classList.add("is-upcoming");
          card.classList.remove("is-active", "is-past");
        }
      });

      // 5. Thread nodes lighting up as progress arrives at their position
      nodesRef.current.forEach((node, idx) => {
        if (!node) return;
        const targetProgress = idx === 0 ? 0 : (idx / (STEPS.length - 1)) - 0.08;
        node.classList.toggle("is-lit", clampedP >= targetProgress);
      });

      // 6. Scroll prompt fades out at the final step
      if (scrollPromptRef.current) {
        const promptOpacity = clampedP > 0.88 ? 0 : 1;
        scrollPromptRef.current.style.opacity = promptOpacity.toString();
        scrollPromptRef.current.style.pointerEvents = promptOpacity === 0 ? "none" : "auto";
      }
    };

    // If parent passed a scroll subscriber (e.g., from useScrollProgress)
    let unsubscribe = null;
    if (subscribe) {
      unsubscribe = subscribe(applyProgress);
    } else {
      // Fallback internal scroll observer
      const onScroll = () => {
        const el = localRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const scrollDistance = Math.max(1, el.offsetHeight - window.innerHeight);
        const p = Math.min(1, Math.max(0, -rect.top / scrollDistance));
        applyProgress(p);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      unsubscribe = () => window.removeEventListener("scroll", onScroll);
    }

    const onResize = () => {
      // Re-trigger with current progress on resize
      if (localRef.current) {
        const rect = localRef.current.getBoundingClientRect();
        const scrollDistance = Math.max(1, localRef.current.offsetHeight - window.innerHeight);
        const p = Math.min(1, Math.max(0, -rect.top / scrollDistance));
        applyProgress(p);
      }
    };
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener("resize", onResize);
    };
  }, [subscribe]);

  return (
    <section
      id="how-it-works"
      ref={localRef}
      className={`hiw-section ${isHovered ? "is-hovered" : ""}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-label="How it works sequence"
    >
      {/* Pinned Sticky Viewport */}
      <div className="hiw-sticky-viewport">
        {/* Subtle radial atmosphere */}
        <div className="hiw-bg-glow" aria-hidden="true" />

        {/* Section Header */}
        <header className="hiw-header">
          <div className="hiw-header-meta">
            <div className="hiw-eyebrow">
              <span className="hiw-eyebrow-dot" />
              <span>How it Works</span>
            </div>
            <h2 className="hiw-headline">
              From missing to recovered, step by deliberate step.
            </h2>
          </div>

          {/* Segmented Progress Rail */}
          <div className="hiw-progress-rail" aria-hidden="true">
            {STEPS.map((step, idx) => (
              <div key={idx} className="hiw-rail-segment">
                <div className="hiw-rail-track">
                  <div
                    className="hiw-rail-bar"
                    ref={(el) => (railBarsRef.current[idx] = el)}
                  />
                </div>
                <span className="hiw-rail-label">{step.number}</span>
              </div>
            ))}
          </div>
        </header>

        {/* Cards Track with Dashed Thread Behind */}
        <div className="hiw-track-stage">
          <div className="hiw-track-inner" ref={cardsTrackRef}>
            {/* Dashed Horizontal Thread SVG Line (Midheight behind cards) */}
            <div className="hiw-thread-container" aria-hidden="true">
              <svg
                className="hiw-thread-svg"
                width={THREAD_WIDTH}
                height="44"
                viewBox={`0 0 ${THREAD_WIDTH} 44`}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <mask id="hiw-thread-mask">
                    <path
                      ref={maskPathRef}
                      d={`M 0 22 L ${THREAD_WIDTH} 22`}
                      stroke="white"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={THREAD_WIDTH}
                      strokeDashoffset={THREAD_WIDTH}
                    />
                  </mask>
                </defs>

                {/* Inactive muted base thread */}
                <line
                  x1="0"
                  y1="22"
                  x2={THREAD_WIDTH}
                  y2="22"
                  stroke="rgba(242, 233, 218, 0.12)"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                />

                {/* Animated golden thread (revealed via mask stroke-dashoffset) */}
                <line
                  x1="0"
                  y1="22"
                  x2={THREAD_WIDTH}
                  y2="22"
                  stroke="#f5c542"
                  strokeWidth="2.5"
                  strokeDasharray="6 6"
                  mask="url(#hiw-thread-mask)"
                />

                {/* Circular Nodes at Each Card Position */}
                {STEPS.map((_, idx) => {
                  const nodeX = idx * CARD_PITCH;
                  return (
                    <g
                      key={idx}
                      ref={(el) => (nodesRef.current[idx] = el)}
                      className={`hiw-thread-node ${idx === 0 ? "is-lit" : ""}`}
                      transform={`translate(${nodeX}, 22)`}
                    >
                      <circle r="9" className="hiw-node-ring" />
                      <circle r="4" className="hiw-node-core" />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* 4 Step Cards */}
            <div className="hiw-cards-list">
              {STEPS.map((step, idx) => (
                <article
                  key={idx}
                  ref={(el) => (cardsRef.current[idx] = el)}
                  className={`hiw-step-card ${idx === 0 ? "is-active" : "is-upcoming"}`}
                  aria-label={`Step ${step.number}: ${step.title}`}
                >
                  <div className="hiw-card-media">
                    <img
                      src={step.image}
                      alt={step.alt}
                      loading={idx <= 1 ? "eager" : "lazy"}
                      decoding="async"
                    />
                    <div className="hiw-card-media-scrim" />
                    <span className="hiw-card-step-badge">{step.number}</span>
                  </div>

                  <div className="hiw-card-body">
                    <span className="hiw-card-num-watermark">{step.number}</span>
                    <h3 className="hiw-card-title">{step.title}</h3>
                    <p className="hiw-card-desc">{step.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* Section Footer */}
        <footer className="hiw-footer">
          <div className="hiw-footer-hint">
            <span className="hiw-hint-bullet" />
            <span>Scroll to traverse the recovery journey</span>
          </div>

          <div
            ref={scrollPromptRef}
            className="hiw-scroll-prompt"
            aria-hidden="true"
          >
            <span>Keep scrolling</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 2V12M7 12L2.5 7.5M7 12L11.5 7.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </footer>
      </div>
    </section>
  );
});

export default HowItWorksSection;
