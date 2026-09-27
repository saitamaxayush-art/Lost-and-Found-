import { useEffect, useMemo, useRef, useState } from "react";
import { MONTHLY, REVIEWS } from "../../data/successData";

const STAT_ROWS = [
  {
    value: 11375,
    suffix: "",
    caption: "Items reported across all campuses",
  },
  {
    value: 9412,
    suffix: "",
    caption: "Reunited with rightful owners",
  },
  {
    value: 89,
    suffix: "%",
    caption: "Successful resolution rate",
  },
];

function CountUp({ to, decimals = 0, suffix = "", active = false, reducedMotion = false }) {
  const spanRef = useRef(null);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;
    const format = (v) =>
      (decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString("en-US")) + suffix;

    if (reducedMotion) {
      el.textContent = format(to);
      return;
    }

    if (!active) {
      el.textContent = format(0);
      return;
    }

    let raf = 0;
    const t0 = performance.now();
    const dur = 1350;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      // Smooth quartic ease-out for silky deceleration
      const eased = 1 - Math.pow(1 - k, 4);
      el.textContent = format(to * eased);
      if (k < 1) {
        raf = requestAnimationFrame(step);
      } else {
        el.textContent = format(to);
      }
    };
    raf = requestAnimationFrame(step);

    return () => cancelAnimationFrame(raf);
  }, [active, to, decimals, suffix, reducedMotion]);

  const initial = reducedMotion
    ? (decimals ? to.toFixed(decimals) : Math.round(to).toLocaleString("en-US")) + suffix
    : (decimals ? (0).toFixed(decimals) : "0") + suffix;

  return <span ref={spanRef}>{initial}</span>;
}

function HistoryLineChart({ data = MONTHLY, active = false, reducedMotion = false }) {
  const containerRef = useRef(null);
  const reportedPathRef = useRef(null);
  const reunitedPathRef = useRef(null);
  const [reportedLen, setReportedLen] = useState(1200);
  const [reunitedLen, setReunitedLen] = useState(1200);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Dimensions & padding for SVG viewBox
  const vbW = 540;
  const vbH = 290;
  const padLeft = 44;
  const padRight = 24;
  const padTop = 26;
  const padBottom = 38;
  const chartW = vbW - padLeft - padRight;
  const chartH = vbH - padTop - padBottom;
  const baselineY = padTop + chartH;

  const yMax = 2200;
  const yTicks = [500, 1000, 1500, 2000];

  // Calculate points
  const { reportedPoints, reunitedPoints } = useMemo(() => {
    const rPts = [];
    const uPts = [];
    const count = data.length;

    data.forEach((d, i) => {
      const x = padLeft + (i / (count - 1)) * chartW;
      const yRep = padTop + (1 - d.reported / yMax) * chartH;
      const yReu = padTop + (1 - d.reunited / yMax) * chartH;
      rPts.push({ x, y: yRep });
      uPts.push({ x, y: yReu });
    });

    return { reportedPoints: rPts, reunitedPoints: uPts };
  }, [data, chartW, chartH, padLeft, padTop, yMax]);

  // Smooth spline generator (Catmull-Rom to Cubic Bezier)
  const createSmoothPath = (pts) => {
    if (!pts || pts.length === 0) return "";
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const reportedPathD = useMemo(() => createSmoothPath(reportedPoints), [reportedPoints]);
  const reunitedPathD = useMemo(() => createSmoothPath(reunitedPoints), [reunitedPoints]);

  const reunitedAreaD = useMemo(() => {
    if (reunitedPoints.length === 0) return "";
    const firstX = reunitedPoints[0].x.toFixed(1);
    const lastX = reunitedPoints[reunitedPoints.length - 1].x.toFixed(1);
    return `${reunitedPathD} L ${lastX} ${baselineY.toFixed(1)} L ${firstX} ${baselineY.toFixed(1)} Z`;
  }, [reunitedPathD, reunitedPoints, baselineY]);

  // Measure path length on mount for stroke dasharray
  useEffect(() => {
    if (reportedPathRef.current) {
      const l = reportedPathRef.current.getTotalLength();
      if (l > 0) setReportedLen(Math.ceil(l));
    }
    if (reunitedPathRef.current) {
      const l = reunitedPathRef.current.getTotalLength();
      if (l > 0) setReunitedLen(Math.ceil(l));
    }
  }, [reportedPathD, reunitedPathD]);

  // Mouse hover tracking
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;

    const svgRatio = (relX - (padLeft / vbW) * rect.width) / ((chartW / vbW) * rect.width);
    const nearest = Math.max(0, Math.min(data.length - 1, Math.round(svgRatio * (data.length - 1))));

    // Clamp tooltip position inside container bounds
    const tooltipClampedX = Math.max(130, Math.min(rect.width - 130, relX));
    const tooltipClampedY = Math.max(24, Math.min(rect.height - 10, relY));

    setHoverIndex(nearest);
    setMousePos({ x: tooltipClampedX, y: tooltipClampedY });
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const activePointRep = hoverIndex !== null ? reportedPoints[hoverIndex] : null;
  const activePointReu = hoverIndex !== null ? reunitedPoints[hoverIndex] : null;
  const hoveredItem = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div
      className="hs-chart-container"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="hs-chart-svg"
        role="img"
        aria-label="Area and line chart of reported and reunited items across 8 months"
      >
        <defs>
          {/* Soft gold gradient beneath Reunited line */}
          <linearGradient id="hs-reunited-gold-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5c542" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#d9822b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#d9822b" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Y Gridlines and Labels */}
        {yTicks.map((tick) => {
          const y = padTop + (1 - tick / yMax) * chartH;
          return (
            <g key={tick} className="hs-grid-group">
              <line
                x1={padLeft}
                y1={y}
                x2={vbW - padRight}
                y2={y}
                stroke="rgba(74, 52, 32, 0.08)"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={padLeft - 10}
                y={y + 3.5}
                textAnchor="end"
                fill="#7a5a3a"
                fontSize="10.5"
                fontFamily="Inter, sans-serif"
                fontWeight="500"
              >
                {tick >= 1000 ? `${tick / 1000}k` : tick}
              </text>
            </g>
          );
        })}

        {/* Baseline */}
        <line
          x1={padLeft}
          y1={baselineY}
          x2={vbW - padRight}
          y2={baselineY}
          stroke="rgba(74, 52, 32, 0.12)"
          strokeWidth="1"
        />

        {/* X Axis Labels */}
        {data.map((d, i) => {
          const x = padLeft + (i / (data.length - 1)) * chartW;
          return (
            <text
              key={d.m}
              x={x}
              y={baselineY + 20}
              textAnchor="middle"
              fill={hoverIndex === i ? "#4a3420" : "#7a5a3a"}
              fontSize="11.5"
              fontFamily="Inter, sans-serif"
              fontWeight={hoverIndex === i ? "700" : "500"}
              style={{ transition: "fill 0.2s ease, font-weight 0.2s ease" }}
            >
              {d.m}
            </text>
          );
        })}

        {/* Reunited Area (Soft Gold Gradient Fill, opacity ~0.18) */}
        <path
          d={reunitedAreaD}
          fill="url(#hs-reunited-gold-grad)"
          className="hs-area-reunited"
          style={{
            opacity: reducedMotion ? 0.18 : (active ? 0.18 : 0),
            transition: reducedMotion ? "none" : (active ? "opacity 1.2s ease 0.25s" : "opacity 0.25s ease"),
          }}
        />

        {/* Reunited Line (Amber) */}
        <path
          ref={reunitedPathRef}
          d={reunitedPathD}
          fill="none"
          stroke="#d9822b"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="hs-line-reunited"
          style={{
            strokeDasharray: reunitedLen,
            strokeDashoffset: reducedMotion ? 0 : (active ? 0 : reunitedLen),
            transition: reducedMotion ? "none" : (active ? "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.08s" : "stroke-dashoffset 0.25s ease"),
          }}
        />

        {/* Reported Line (Dark Ink, no fill) */}
        <path
          ref={reportedPathRef}
          d={reportedPathD}
          fill="none"
          stroke="#4a3420"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="hs-line-reported"
          style={{
            strokeDasharray: reportedLen,
            strokeDashoffset: reducedMotion ? 0 : (active ? 0 : reportedLen),
            transition: reducedMotion ? "none" : (active ? "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)" : "stroke-dashoffset 0.25s ease"),
          }}
        />

        {/* Hover Highlight elements */}
        {hoverIndex !== null && activePointRep && activePointReu && (
          <g className="hs-chart-hover-overlay" pointerEvents="none">
            {/* Vertical Guideline */}
            <line
              x1={activePointRep.x}
              y1={padTop}
              x2={activePointRep.x}
              y2={baselineY}
              stroke="rgba(74, 52, 32, 0.22)"
              strokeDasharray="3 3"
              strokeWidth="1"
            />

            {/* Reported highlighted dot */}
            <circle
              cx={activePointRep.x}
              cy={activePointRep.y}
              r="9"
              fill="rgba(74, 52, 32, 0.14)"
            />
            <circle
              cx={activePointRep.x}
              cy={activePointRep.y}
              r="5"
              fill="#4a3420"
              stroke="#fff8ef"
              strokeWidth="2.2"
            />

            {/* Reunited highlighted dot */}
            <circle
              cx={activePointReu.x}
              cy={activePointReu.y}
              r="9"
              fill="rgba(217, 130, 43, 0.2)"
            />
            <circle
              cx={activePointReu.x}
              cy={activePointReu.y}
              r="5"
              fill="#d9822b"
              stroke="#fff8ef"
              strokeWidth="2.2"
            />
          </g>
        )}
      </svg>

      {/* Floating Dark Tooltip Pill */}
      {hoverIndex !== null && hoveredItem && (
        <div
          className="hs-chart-tooltip-pill"
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y - 12}px`,
          }}
        >
          <span className="hs-tip-pill-month">{hoveredItem.m}</span>
          <span className="hs-tip-pill-sep">·</span>
          <span className="hs-tip-pill-val ink">
            <span className="hs-tip-dot ink-dot" />
            {hoveredItem.reported.toLocaleString("en-US")} reported
          </span>
          <span className="hs-tip-pill-sep">·</span>
          <span className="hs-tip-pill-val amber">
            <span className="hs-tip-dot amber-dot" />
            {hoveredItem.reunited.toLocaleString("en-US")} reunited
          </span>
        </div>
      )}
    </div>
  );
}

function Stars() {
  return (
    <span className="rv-stars" role="img" aria-label="5 out of 5 stars">
      {"★★★★★"}
    </span>
  );
}

export default function HistorySection({ onMouseEnter, onMouseLeave, isHovered }) {
  const sectionRef = useRef(null);
  const [sectionInView, setSectionInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          setSectionInView(e.isIntersecting);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -4% 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      id="history"
      className={`lp-section lp-history ${isHovered ? "is-hovered" : ""}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      ref={sectionRef}
    >
      <div className="lp-wrap">
        {/* Editorial Split Layout: Left = narrative + stats, Right = chart panel */}
        <div className={`hs-editorial ${sectionInView ? "in-view" : ""}`}>
          {/* Left Column */}
          <div className="hs-narrative">
            <span className="hs-eyebrow">History</span>
            <h2 className="hs-headline">Thousands of things have found their way home.</h2>
            <p className="hs-story">
              FindBack started as a quiet WhatsApp group between students tired of unclaimed
              water bottles, ID cards, and umbrellas piling up at campus notice boards. It grew
              into an organized campus lost &amp; found registry, and then evolved into the
              intelligent matching system you see today.
            </p>

            <div className="hs-stat-stack">
              {STAT_ROWS.map((stat, i) => (
                <div className="hs-stat-row" key={stat.caption} style={{ "--row-i": i }}>
                  <div className="hs-stat-divider" />
                  <div className="hs-stat-content">
                    <span className="hs-stat-num">
                      <CountUp
                        to={stat.value}
                        decimals={stat.decimals}
                        suffix={stat.suffix}
                        active={sectionInView}
                        reducedMotion={reducedMotion}
                      />
                    </span>
                    <span className="hs-stat-caption">{stat.caption}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Rounded panel (22px radius, background #fbe9d3) */}
          <div className="hs-chart-panel">
            <div className="hs-panel-header">
              <div className="hs-panel-title-wrap">
                <h3 className="hs-panel-title">Activity trends</h3>
                <span className="hs-panel-subtitle">Monthly volume over the last 8 months</span>
              </div>
              <div className="hs-legend" role="list">
                <div className="hs-legend-item" role="listitem">
                  <span className="hs-legend-dot reported" aria-hidden="true" />
                  <span className="hs-legend-label">Reported</span>
                </div>
                <div className="hs-legend-item" role="listitem">
                  <span className="hs-legend-dot reunited" aria-hidden="true" />
                  <span className="hs-legend-label">Reunited</span>
                </div>
              </div>
            </div>

            <HistoryLineChart
              data={MONTHLY}
              active={sectionInView}
              reducedMotion={reducedMotion}
            />
          </div>
        </div>

        {/* Kind Words / Reviews */}
        <div className="lp-head rv-head reveal">
          <span className="lp-eyebrow">Kind Words</span>
          <h3>What people say about FindBack</h3>
        </div>

        <div className="rv-grid">
          {REVIEWS.map((r, i) => (
            <figure className="rv-card reveal" style={{ "--d": `${(i % 3) * 90}ms` }} key={r.name}>
              <Stars />
              <blockquote>“{r.text}”</blockquote>
              <figcaption>
                <span className="rv-avatar" style={{ background: r.color }} aria-hidden="true">{r.name[0]}</span>
                <span>
                  <strong>{r.name}</strong>
                  <small>{r.role}</small>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
