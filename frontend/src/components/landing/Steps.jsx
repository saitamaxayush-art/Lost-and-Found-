import { useEffect, useRef } from "react";
import { HERO_END, STEP_RANGES, boxMove, clamp, windowVis } from "./timeline";

/* ---------- small mock UIs (visual explanation of each step) ---------- */

function Field({ label, value, chevron }) {
  return (
    <div className="mock-field">
      <span className="mock-label">{label}</span>
      <span className="mock-value">
        {value}
        {chevron && <i className="mock-chev" />}
      </span>
    </div>
  );
}

function MockLost() {
  return (
    <div className="mock">
      <Field label="What did you lose?" value="Black wallet, lost after lecture" />
      <Field label="Category" value="Accessories" chevron />
      <Field label="Last seen" value="Library, second floor" />
      <div className="mock-row">
        <Field label="Date lost" value="Today" chevron />
        <span className="mock-btn">Report lost</span>
      </div>
    </div>
  );
}

function MockFound() {
  return (
    <div className="mock">
      <div className="mock-photo-row">
        <div className="mock-photo" aria-hidden="true">
          <span />
        </div>
        <div className="mock-col">
          <Field label="What did you find?" value="Black leather wallet" />
          <Field label="Found at" value="Canteen, near the counter" />
        </div>
      </div>
      <div className="mock-row">
        <Field label="Date found" value="Today" chevron />
        <span className="mock-btn">Report found</span>
      </div>
    </div>
  );
}

function MockMatch() {
  return (
    <div className="mock">
      <div className="mock-item">
        <span className="tag tag-lost">Lost</span>
        <span>Black wallet, Accessories</span>
      </div>
      <div className="mock-link" aria-hidden="true">
        <span />
        <b>Possible match</b>
        <span />
      </div>
      <div className="mock-item">
        <span className="tag tag-found">Found</span>
        <span>Black leather wallet, Accessories</span>
      </div>
    </div>
  );
}

function MockNotify() {
  return (
    <div className="mock">
      <div className="mock-note">
        <div className="mock-bell" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
          <em>1</em>
        </div>
        <div>
          <strong>Possible match</strong>
          <p>Your lost report looks similar to a found report already on the board.</p>
          <small>Just now</small>
        </div>
      </div>
    </div>
  );
}

function MockReturned() {
  const steps = ["Reported", "Matched", "Returned"];
  return (
    <div className="mock">
      <div className="mock-track" aria-hidden="true">
        {steps.map((s, i) => (
          <div key={s} className={`mock-step ${i < 2 ? "done" : "now"}`}>
            <span>{i < 2 ? "✓" : ""}</span>
            {s}
          </div>
        ))}
      </div>
      <div className="mock-item">
        <span className="tag tag-ok">Returned</span>
        <span>Black wallet is back with its owner</span>
      </div>
    </div>
  );
}

/* ---------- copy ---------- */

const STEPS = [
  {
    title: ["Report what you ", "lost"],
    body: "Lost your keys, wallet, or phone? Post a quick report with description and last seen spot. It takes under a minute.",
    Mock: MockLost,
  },
  {
    title: ["Report what you ", "found"],
    body: "Picked something up? Snap a photo and pinpoint where you found it, so the rightful owner can recognise it immediately.",
    Mock: MockFound,
  },
  {
    title: ["Smart matching in ", "real time"],
    body: "Our engine instantly flags potential matches across categories, descriptions, and locations — spotlighting the black wallet!",
    Mock: MockMatch,
  },
  {
    title: ["Reunited & ", "returned"],
    body: "The moment a likely match appears, the owner is notified, identity verified, and the item is safely returned!",
    Mock: MockReturned,
  },
];

function Title({ parts }) {
  return (
    <h2 className="lp-h2">
      {parts.map((t, i) => (i % 2 === 1 ? <span key={i} className="accent">{t}</span> : t))}
    </h2>
  );
}

/* ---------- component ---------- */

export default function Steps({ subscribe }) {
  const scrim = useRef(null);
  const hero = useRef(null);
  const panels = useRef([]);
  const pips = useRef([]);

  useEffect(() => {
    const setVis = (el, v, dir, travel = 22) => {
      if (!el) return;
      el.style.opacity = v.toFixed(3);
      el.style.visibility = v < 0.01 ? "hidden" : "visible";
      el.style.setProperty("--ty", `${(dir * -1 * (1 - v) * travel).toFixed(1)}px`);
    };

    return subscribe((p) => {
      // hero text: visible at the top, leaves upward
      const hv = 1 - clamp(p / HERO_END);
      setVis(hero.current, hv, -1, 36);

      STEP_RANGES.forEach((r, i) => {
        const { v, dir } = windowVis(p, r);
        setVis(panels.current[i], v, dir);
        const active = p >= r[0] && p < (STEP_RANGES[i + 1]?.[0] ?? r[1] + 0.02);
        pips.current[i]?.classList.toggle("on", active);
        pips.current[i]?.classList.toggle("past", p >= r[1]);
      });

      // dark scrim behind text while the box is parked on the side
      const m = boxMove(p);
      if (scrim.current) scrim.current.style.opacity = (m.out * (1 - m.back)).toFixed(3);
      const pipWrap = pips.current[0]?.parentElement;
      if (pipWrap) pipWrap.style.opacity = (m.out * (1 - m.back)).toFixed(3);
    });
  }, [subscribe]);

  return (
    <>
      <div className="lp-scrim" ref={scrim} aria-hidden="true" />

      <div className="lp-hero" ref={hero}>
        <h1 className="lp-h1">Everything lost on campus ends up in one box.</h1>
      </div>

      <div className="lp-panels">
        {STEPS.map(({ title, body, Mock }, i) => (
          <section key={i} className="lp-panel" ref={(el) => (panels.current[i] = el)} aria-label={`Step ${i + 1}`}>
            <span className="lp-count">({i + 1})</span>
            <Title parts={title} />
            <p className="lp-body">{body}</p>
            <Mock />
          </section>
        ))}
      </div>

      <div className="lp-pips" aria-hidden="true">
        {STEPS.map((_, i) => (
          <span key={i} ref={(el) => (pips.current[i] = el)} />
        ))}
      </div>
    </>
  );
}
