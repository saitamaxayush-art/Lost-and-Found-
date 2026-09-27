import { useEffect, useRef, useState, useCallback } from "react";
import { MONTHLY, REVIEWS } from "../../data/successData";

const EDITORIAL_STATS = [
  {
    value: 11375,
    caption: "Items reported across all campuses",
  },
  {
    value: 9412,
    caption: "Reunited with rightful owners",
  },
  {
    value: 89,
    suffix: "%",
    caption: "Successful return & match rate",
  },
];

function CountUp({ to, decimals = 0, suffix = "", active = false }) {
  const spanRef = useRef(null);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const format = (v) =>
      (decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString("en-US")) +
      suffix;

    if (reduce) {
      el.textContent = format(to);
      return;
    }

    if (!active) {
      el.textContent = format(0);
      return;
    }

    let raf = 0;
    const t0 = performance.now();
    const dur = 1400;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      // Smooth quartic ease-out for silky deceleration
      const eased = 1 - Math.pow(1 - k, 4);
      el.textContent = format(to * eased);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    return () => cancelAnimationFrame(raf);
  }, [active, to, decimals, suffix]);

  const initial = decimals ? (0).toFixed(decimals) : "0";
  return <span ref={spanRef}>{initial + suffix}</span>;
}

function Stars() {
  return (
    <span className="rv-stars" role="img" aria-label="5 out of 5 stars">
      {"★★★★★"}
    </span>
  );
}

// Generates smooth cubic bezier path through points
function getSplinePath(points) {
  if (!points || points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export default function HistorySection({ onMouseEnter, onMouseLeave, isHovered }) {
  const sectionRef = useRef(null);
  const panelRef = useRef(null);
  const svgRef = useRef(null);
  const reportedPathRef = useRef(null);
  const reunitedPathRef = useRef(null);

  const [isVisible, setIsVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [reportedLength, setReportedLength] = useState(650);
  const [reunitedLength, setReunitedLength] = useState(650);

  // Hover state for interactive chart
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // Observe reduced-motion preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    const handler = (e) => setReducedMotion(e.matches);
    if (mql.addEventListener) {
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }
  }, []);

  // Observe scroll into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -40px 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Compute exact path lengths for stroke animation
  useEffect(() => {
    const measure = () => {
      if (reportedPathRef.current) {
        try {
          const len = reportedPathRef.current.getTotalLength();
          if (len > 0) setReportedLength(Math.ceil(len));
        } catch (_) {}
      }
      if (reunitedPathRef.current) {
        try {
          const len = reunitedPathRef.current.getTotalLength();
          if (len > 0) setReunitedLength(Math.ceil(len));
        } catch (_) {}
      }
    };

    measure();
    const raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, []);

  // SVG Chart Geometry
  const svgWidth = 540;
  const svgHeight = 290;
  const pad = { top: 26, right: 24, bottom: 42, left: 46 };
  const plotW = svgWidth - pad.left - pad.right; // 470
  const plotH = svgHeight - pad.top - pad.bottom; // 222
  const baselineY = pad.top + plotH; // 248
  const maxY = 2100;

  const yTicks = [
    { val: 500, label: "500" },
    { val: 1000, label: "1k" },
    { val: 1500, label: "1.5k" },
    { val: 2000, label: "2k" },
  ];

  // Coordinates for each month
  const dataPoints = MONTHLY.map((m, i) => {
    const x = pad.left + (i / (MONTHLY.length - 1)) * plotW;
    const yRep = baselineY - (m.reported / maxY) * plotH;
    const yReu = baselineY - (m.reunited / maxY) * plotH;
    return { ...m, x, yRep, yReu, index: i };
  });

  const reportedPts = dataPoints.map((d) => ({ x: d.x, y: d.yRep }));
  const reunitedPts = dataPoints.map((d) => ({ x: d.x, y: d.yReu }));

  const reportedLinePath = getSplinePath(reportedPts);
  const reunitedLinePath = getSplinePath(reunitedPts);

  const reunitedAreaPath =
    reunitedPts.length > 0
      ? `${reunitedLinePath} L ${reunitedPts[reunitedPts.length - 1].x.toFixed(1)} ${baselineY.toFixed(1)} L ${reunitedPts[0].x.toFixed(1)} ${baselineY.toFixed(1)} Z`
      : "";

  // Pointer interaction
  const handlePointerMove = useCallback((e) => {
    if (!svgRef.current || !panelRef.current) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const panelRect = panelRef.current.getBoundingClientRect();

    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
    if (clientX === undefined) return;

    const relX = clientX - svgRect.left;
    const svgScaleX = svgWidth / svgRect.width;
    const svgX = relX * svgScaleX;

    // Find nearest point along X
    let closest = 0;
    let minDiff = Infinity;
    for (let i = 0; i < dataPoints.length; i++) {
      const diff = Math.abs(dataPoints[i].x - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        closest = i;
      }
    }

    setHoveredIdx(closest);

    // Keep tooltip positioned relative to the panel
    const rawX = clientX - panelRect.left;
    const rawY = clientY - panelRect.top;
    const clampedX = Math.max(65, Math.min(panelRect.width - 65, rawX));
    setCursorPos({ x: clampedX, y: rawY });
  }, [dataPoints, svgWidth]);

  const handlePointerLeave = useCallback(() => {
    setHoveredIdx(null);
  }, []);

  // Stroke draw-in animation styling
  const reportedStrokeStyle = reducedMotion
    ? { strokeDasharray: "none", strokeDashoffset: 0 }
    : {
        strokeDasharray: reportedLength || 650,
        strokeDashoffset: isVisible ? 0 : reportedLength || 650,
        transition: "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
      };

  const reunitedStrokeStyle = reducedMotion
    ? { strokeDasharray: "none", strokeDashoffset: 0 }
    : {
        strokeDasharray: reunitedLength || 650,
        strokeDashoffset: isVisible ? 0 : reunitedLength || 650,
        transition: "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
      };

  const areaStyle = reducedMotion
    ? { opacity: 0.18 }
    : {
        opacity: isVisible ? 0.18 : 0,
        transition: "opacity 1.2s ease 0.25s",
      };

  return (
    <section
      id="history"
      className={`lp-section lp-history ${isHovered ? "is-hovered" : ""}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="lp-wrap">
        {/* Editorial Split Layout */}
        <div className="hs-split" ref={sectionRef}>
          {/* Left Column: Narrative + Stats */}
          <div className="hs-narrative-col">
            <span className="hs-eyebrow">History</span>
            <h2 className="hs-headline">Thousands of things have found their way home.</h2>
            <p className="hs-story">
              FindBack started as a WhatsApp group between students tired of unclaimed water bottles, ID cards and
              umbrellas piling up at the notice board. It grew into a proper lost &amp; found board, and then into the
              matching system you see today.
            </p>

            {/* 3 Stat rows stacked vertically */}
            <div className="hs-stat-stack" role="list">
              {EDITORIAL_STATS.map((stat, i) => (
                <div
                  key={stat.caption}
                  className={`hs-stat-row ${isVisible ? "in" : ""}`}
                  style={{ "--delay": `${i * 150}ms` }}
                  role="listitem"
                >
                  <div className="hs-stat-divider" aria-hidden="true" />
                  <div className="hs-stat-content">
                    <span className="hs-stat-number">
                      <CountUp
                        to={stat.value}
                        decimals={stat.decimals || 0}
                        suffix={stat.suffix || ""}
                        active={isVisible}
                      />
                    </span>
                    <span className="hs-stat-caption">{stat.caption}</span>
                  </div>
                  {i === EDITORIAL_STATS.length - 1 && (
                    <div
                      className="hs-stat-divider hs-stat-divider-bottom"
                      style={{ "--delay": `${(i + 1) * 150}ms` }}
                      aria-hidden="true"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Chart Panel */}
          <div className="hs-chart-col">
            <div className={`hs-chart-panel ${isVisible ? "in" : ""}`} ref={panelRef}>
              <div className="hs-chart-header">
                <div className="hs-chart-title-wrap">
                  <span className="hs-chart-eyebrow">Monthly Resolution</span>
                  <h3 className="hs-chart-title">Activity Growth</h3>
                </div>
                <div className="hs-chart-legend" aria-hidden="true">
                  <div className="hs-legend-item">
                    <span className="hs-legend-dot hs-dot-reported" />
                    <span>Reported</span>
                  </div>
                  <div className="hs-legend-item">
                    <span className="hs-legend-dot hs-dot-reunited" />
                    <span>Reunited</span>
                  </div>
                </div>
              </div>

              {/* Custom SVG Area / Line Chart */}
              <div
                className="hs-chart-canvas-wrap"
                onMouseMove={handlePointerMove}
                onMouseLeave={handlePointerLeave}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerLeave}
              >
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="hs-chart-svg"
                  role="img"
                  aria-label="Area and line chart showing reported and reunited items over 8 months"
                >
                  <defs>
                    <linearGradient id="hsGoldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f5c542" stopOpacity="0.85" />
                      <stop offset="50%" stopColor="#d9822b" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#d9822b" stopOpacity="0.04" />
                    </linearGradient>
                  </defs>

                  {/* Y Axis Gridlines and Labels */}
                  {yTicks.map((t) => {
                    const y = baselineY - (t.val / maxY) * plotH;
                    return (
                      <g key={t.val} className="hs-grid-row">
                        <line
                          x1={pad.left}
                          y1={y}
                          x2={svgWidth - pad.right}
                          y2={y}
                          stroke="rgba(74, 52, 32, 0.09)"
                          strokeWidth="1"
                          strokeDasharray="3 4"
                        />
                        <text
                          x={pad.left - 9}
                          y={y + 3.5}
                          textAnchor="end"
                          fill="#7a5a3a"
                          fontSize="10.5"
                          fontFamily="Inter, sans-serif"
                          fontWeight="500"
                        >
                          {t.label}
                        </text>
                      </g>
                    );
                  })}

                  {/* Baseline zero line */}
                  <line
                    x1={pad.left}
                    y1={baselineY}
                    x2={svgWidth - pad.right}
                    y2={baselineY}
                    stroke="rgba(74, 52, 32, 0.16)"
                    strokeWidth="1"
                  />

                  {/* X Axis Month Labels */}
                  {dataPoints.map((d) => (
                    <text
                      key={d.m}
                      x={d.x}
                      y={baselineY + 22}
                      textAnchor="middle"
                      fill={hoveredIdx === d.index ? "#4a3420" : "#7a5a3a"}
                      fontSize="11.5"
                      fontFamily="Inter, sans-serif"
                      fontWeight={hoveredIdx === d.index ? "700" : "600"}
                      style={{ transition: "fill 0.2s ease, font-weight 0.2s ease" }}
                    >
                      {d.m}
                    </text>
                  ))}

                  {/* Reunited Gold Area Fill (under reunited curve) */}
                  <path
                    d={reunitedAreaPath}
                    fill="url(#hsGoldGradient)"
                    style={areaStyle}
                  />

                  {/* Reunited Line (Amber) */}
                  <path
                    ref={reunitedPathRef}
                    d={reunitedLinePath}
                    fill="none"
                    stroke="#d9822b"
                    strokeWidth="2.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={reunitedStrokeStyle}
                  />

                  {/* Reported Line (Dark Ink, no fill) */}
                  <path
                    ref={reportedPathRef}
                    d={reportedLinePath}
                    fill="none"
                    stroke="#4a3420"
                    strokeWidth="2.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={reportedStrokeStyle}
                  />

                  {/* Interactive highlighted dots & indicator on hover */}
                  {hoveredIdx !== null && dataPoints[hoveredIdx] && (
                    <g className="hs-chart-highlights" pointerEvents="none">
                      {/* Vertical hairline crosshair */}
                      <line
                        x1={dataPoints[hoveredIdx].x}
                        y1={pad.top}
                        x2={dataPoints[hoveredIdx].x}
                        y2={baselineY}
                        stroke="rgba(74, 52, 32, 0.24)"
                        strokeWidth="1.2"
                        strokeDasharray="3 3"
                      />
                      {/* Highlighted dot on Reunited series */}
                      <circle
                        cx={dataPoints[hoveredIdx].x}
                        cy={dataPoints[hoveredIdx].yReu}
                        r="5.5"
                        fill="#d9822b"
                        stroke="#fff8ef"
                        strokeWidth="2.5"
                      />
                      {/* Highlighted dot on Reported series */}
                      <circle
                        cx={dataPoints[hoveredIdx].x}
                        cy={dataPoints[hoveredIdx].yRep}
                        r="5.5"
                        fill="#4a3420"
                        stroke="#fff8ef"
                        strokeWidth="2.5"
                      />
                    </g>
                  )}
                </svg>

                {/* Small dark tooltip pill following cursor */}
                {hoveredIdx !== null && dataPoints[hoveredIdx] && (
                  <div
                    className="hs-tooltip-pill"
                    style={{
                      left: cursorPos.x,
                      top: cursorPos.y,
                    }}
                    role="tooltip"
                  >
                    <span className="hs-tp-month">{dataPoints[hoveredIdx].m}</span>
                    <div className="hs-tp-row">
                      <span className="hs-tp-dot hs-tp-dot-reported" />
                      <span className="hs-tp-label">Reported:</span>
                      <span className="hs-tp-val">
                        {dataPoints[hoveredIdx].reported.toLocaleString("en-US")}
                      </span>
                    </div>
                    <div className="hs-tp-row">
                      <span className="hs-tp-dot hs-tp-dot-reunited" />
                      <span className="hs-tp-label">Reunited:</span>
                      <span className="hs-tp-val">
                        {dataPoints[hoveredIdx].reunited.toLocaleString("en-US")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Kind Words (Reviews) Section */}
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
                <span className="rv-avatar" style={{ background: r.color }} aria-hidden="true">
                  {r.name[0]}
                </span>
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
