import { useEffect, useMemo, useRef, useState } from "react";
import { EDITORIAL_STATS, MONTHLY, REVIEWS } from "../../data/successData";

function CountUp({ to, decimals = 0, suffix = "", active = false }) {
  const spanRef = useRef(null);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const format = (v) =>
      (decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString("en-US")) + suffix;

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
    const dur = 1350;
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

  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const initial = reduce
    ? (decimals ? to.toFixed(decimals) : Math.round(to).toLocaleString("en-US")) + suffix
    : (decimals ? (0).toFixed(decimals) : "0") + suffix;

  return <span ref={spanRef}>{initial}</span>;
}

function Stars() {
  return (
    <span className="rv-stars" role="img" aria-label="5 out of 5 stars">
      {"★★★★★"}
    </span>
  );
}

// Cubic bezier smoothing for hand-rolled SVG line & area paths
function getSmoothPath(points, tension = 0.18) {
  if (!points || points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;

    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function getAreaPath(points, baselineY, tension = 0.18) {
  if (!points || points.length === 0) return "";
  const linePath = getSmoothPath(points, tension);
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath} L ${last.x.toFixed(1)} ${baselineY.toFixed(1)} L ${first.x.toFixed(1)} ${baselineY.toFixed(1)} Z`;
}

export default function HistorySection({ onMouseEnter, onMouseLeave, isHovered }) {
  const splitRef = useRef(null);
  const chartBoxRef = useRef(null);
  const svgRef = useRef(null);

  const [inView, setInView] = useState(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Intersection observer for triggering coordinated scroll animations every time user enters/leaves
  useEffect(() => {
    const el = splitRef.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  // SVG Chart geometry
  const chartConfig = useMemo(() => {
    const width = 540;
    const height = 280;
    const padL = 46;
    const padR = 24;
    const padT = 24;
    const padB = 44;
    const yBase = height - padB;
    const plotW = width - padL - padR;
    const plotH = yBase - padT;
    const yMax = 2200;

    const ticks = [500, 1000, 1500, 2000];

    const reportedPts = MONTHLY.map((m, i) => ({
      x: padL + (i / (MONTHLY.length - 1)) * plotW,
      y: yBase - (m.reported / yMax) * plotH,
      val: m.reported,
      m: m.m,
    }));

    const reunitedPts = MONTHLY.map((m, i) => ({
      x: padL + (i / (MONTHLY.length - 1)) * plotW,
      y: yBase - (m.reunited / yMax) * plotH,
      val: m.reunited,
      m: m.m,
    }));

    return {
      width,
      height,
      padL,
      padR,
      padT,
      padB,
      yBase,
      plotW,
      plotH,
      yMax,
      ticks,
      reportedPts,
      reunitedPts,
      reportedLinePath: getSmoothPath(reportedPts),
      reunitedLinePath: getSmoothPath(reunitedPts),
      reunitedAreaPath: getAreaPath(reunitedPts, yBase),
    };
  }, []);

  // Pointer hover tracking on chart
  const handlePointerMove = (e) => {
    const chartBox = chartBoxRef.current;
    const svg = svgRef.current;
    if (!chartBox || !svg) return;

    const rect = svg.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
    if (clientX === undefined) return;

    const localX = ((clientX - rect.left) / rect.width) * chartConfig.width;

    let nearest = 0;
    let minDist = Infinity;
    chartConfig.reportedPts.forEach((pt, i) => {
      const dist = Math.abs(pt.x - localX);
      if (dist < minDist) {
        minDist = dist;
        nearest = i;
      }
    });

    setHoveredIdx(nearest);

    const boxRect = chartBox.getBoundingClientRect();
    setTooltipPos({
      x: clientX - boxRect.left,
      y: clientY - boxRect.top,
    });
  };

  const handlePointerLeave = () => {
    setHoveredIdx(null);
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
        <div className="hs-editorial-split" ref={splitRef}>
          {/* Left Column: Narrative + Stats */}
          <div className="hs-editorial-left">
            <div className="hs-narrative-block">
              <span className="lp-eyebrow">History</span>
              <h2 className="hs-headline">Thousands of things have found their way home.</h2>
              <p className="hs-origin-story">
                FindBack started as a student-run WhatsApp circle tired of unclaimed ID cards, keys,
                and water bottles crowding campus notice boards. Today, it has grown into an
                intuitive, campus-wide recovery system reconnecting students and faculty with the
                belongings they thought were gone for good.
              </p>
            </div>

            {/* 3 Vertically Stacked Stat Rows with Top Hairline Dividers */}
            <div className="hs-stats-stack" role="region" aria-label="FindBack historical metrics">
              {EDITORIAL_STATS.map((stat, i) => (
                <div className="hs-stat-row" key={i}>
                  <div
                    className={`hs-hairline-divider ${inView ? "is-drawn" : ""}`}
                    style={{ "--stagger": `${i * 150}ms` }}
                    aria-hidden="true"
                  />
                  <div className="hs-stat-content">
                    <span className="hs-stat-number">
                      <CountUp
                        to={stat.value}
                        decimals={stat.decimals || 0}
                        suffix={stat.suffix || ""}
                        active={inView}
                      />
                    </span>
                    <span className="hs-stat-caption">{stat.caption}</span>
                  </div>
                </div>
              ))}
              <div
                className={`hs-hairline-divider ${inView ? "is-drawn" : ""}`}
                style={{ "--stagger": `${EDITORIAL_STATS.length * 150}ms` }}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Right Column: Custom Area/Line Chart Panel */}
          <div className="hs-editorial-right">
            <div
              className={`hs-chart-panel ${inView ? "is-drawn" : ""}`}
              ref={chartBoxRef}
              onMouseMove={handlePointerMove}
              onMouseLeave={handlePointerLeave}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerLeave}
            >
              {/* Panel Header: Subtitle & Legend */}
              <div className="hs-panel-header">
                <div className="hs-panel-titles">
                  <span className="hs-panel-kicker">8-Month Trajectory</span>
                  <h3 className="hs-panel-headline">Reported vs. Reunited</h3>
                </div>
                <div className="hs-chart-legend" role="list" aria-label="Chart series legend">
                  <div className="hs-legend-item" role="listitem">
                    <span className="hs-legend-dot reported" aria-hidden="true" />
                    <span>Reported</span>
                  </div>
                  <div className="hs-legend-item" role="listitem">
                    <span className="hs-legend-dot reunited" aria-hidden="true" />
                    <span>Reunited</span>
                  </div>
                </div>
              </div>

              {/* Chart SVG Canvas */}
              <div className="hs-chart-svg-wrap">
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${chartConfig.width} ${chartConfig.height}`}
                  className="hs-chart-svg"
                  preserveAspectRatio="xMidYMid meet"
                  role="img"
                  aria-label="Area and line chart showing reported and reunited items across eight months"
                >
                  <defs>
                    {/* Soft gold gradient fill under Reunited series (avg opacity ~0.18) */}
                    <linearGradient id="hsGoldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f5c542" stopOpacity="0.32" />
                      <stop offset="65%" stopColor="#f5c542" stopOpacity="0.14" />
                      <stop offset="100%" stopColor="#fbe9d3" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Subtle Grid Ticks */}
                  <g className="hs-grid-lines" aria-hidden="true">
                    {chartConfig.ticks.map((t) => {
                      const y =
                        chartConfig.yBase - (t / chartConfig.yMax) * chartConfig.plotH;
                      return (
                        <g key={t}>
                          <line
                            x1={chartConfig.padL}
                            y1={y}
                            x2={chartConfig.width - chartConfig.padR}
                            y2={y}
                            className="hs-grid-line"
                          />
                          <text
                            x={chartConfig.padL - 10}
                            y={y + 3.5}
                            textAnchor="end"
                            className="hs-axis-tick-text"
                          >
                            {t.toLocaleString("en-US")}
                          </text>
                        </g>
                      );
                    })}
                    {/* Baseline */}
                    <line
                      x1={chartConfig.padL}
                      y1={chartConfig.yBase}
                      x2={chartConfig.width - chartConfig.padR}
                      y2={chartConfig.yBase}
                      className="hs-axis-baseline"
                    />
                  </g>

                  {/* X-axis Month Labels */}
                  <g className="hs-axis-x" aria-hidden="true">
                    {chartConfig.reportedPts.map((pt, i) => (
                      <text
                        key={i}
                        x={pt.x}
                        y={chartConfig.yBase + 22}
                        textAnchor="middle"
                        className={`hs-axis-month ${hoveredIdx === i ? "is-hovered" : ""}`}
                      >
                        {pt.m}
                      </text>
                    ))}
                  </g>

                  {/* Reunited Soft Gold Gradient Area Fill */}
                  <path
                    d={chartConfig.reunitedAreaPath}
                    fill="url(#hsGoldGradient)"
                    className="hs-chart-area"
                  />

                  {/* Reunited Line (Amber) */}
                  <path
                    d={chartConfig.reunitedLinePath}
                    fill="none"
                    stroke="#d9822b"
                    strokeWidth="2.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={1000}
                    className="hs-chart-stroke hs-stroke-reunited"
                  />

                  {/* Reported Line (Dark Ink, No Fill) */}
                  <path
                    d={chartConfig.reportedLinePath}
                    fill="none"
                    stroke="#4a3420"
                    strokeWidth="2.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={1000}
                    className="hs-chart-stroke hs-stroke-reported"
                  />

                  {/* Interactive Highlight on Hover */}
                  {hoveredIdx !== null && (
                    <g className="hs-chart-hover-focus" pointerEvents="none" aria-hidden="true">
                      {/* Vertical Guideline */}
                      <line
                        x1={chartConfig.reportedPts[hoveredIdx].x}
                        y1={chartConfig.padT}
                        x2={chartConfig.reportedPts[hoveredIdx].x}
                        y2={chartConfig.yBase}
                        className="hs-hover-guide"
                      />

                      {/* Reunited Highlight Dot (Amber with Halo) */}
                      <circle
                        cx={chartConfig.reunitedPts[hoveredIdx].x}
                        cy={chartConfig.reunitedPts[hoveredIdx].y}
                        r="8"
                        fill="#d9822b"
                        opacity="0.22"
                      />
                      <circle
                        cx={chartConfig.reunitedPts[hoveredIdx].x}
                        cy={chartConfig.reunitedPts[hoveredIdx].y}
                        r="4.5"
                        fill="#d9822b"
                        stroke="#fff8ef"
                        strokeWidth="2.2"
                      />

                      {/* Reported Highlight Dot (Dark Ink with Halo) */}
                      <circle
                        cx={chartConfig.reportedPts[hoveredIdx].x}
                        cy={chartConfig.reportedPts[hoveredIdx].y}
                        r="8"
                        fill="#4a3420"
                        opacity="0.2"
                      />
                      <circle
                        cx={chartConfig.reportedPts[hoveredIdx].x}
                        cy={chartConfig.reportedPts[hoveredIdx].y}
                        r="4.5"
                        fill="#4a3420"
                        stroke="#fff8ef"
                        strokeWidth="2.2"
                      />
                    </g>
                  )}
                </svg>
              </div>

              {/* Cursor-following Tooltip Pill */}
              {hoveredIdx !== null && (
                <div
                  className="hs-tooltip-pill"
                  style={{
                    left: `${tooltipPos.x}px`,
                    top: `${tooltipPos.y}px`,
                  }}
                  role="tooltip"
                >
                  <div className="hs-tt-month">{MONTHLY[hoveredIdx].m} Overview</div>
                  <div className="hs-tt-metrics">
                    <div className="hs-tt-metric">
                      <span className="hs-tt-dot reported" />
                      <span className="hs-tt-label">Reported:</span>
                      <strong className="hs-tt-val">
                        {MONTHLY[hoveredIdx].reported.toLocaleString("en-US")}
                      </strong>
                    </div>
                    <div className="hs-tt-metric">
                      <span className="hs-tt-dot reunited" />
                      <span className="hs-tt-label">Reunited:</span>
                      <strong className="hs-tt-val">
                        {MONTHLY[hoveredIdx].reunited.toLocaleString("en-US")}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kind Words / Community Reviews */}
        <div className="lp-head rv-head reveal">
          <span className="lp-eyebrow">Kind Words</span>
          <h3>What people say about FindBack</h3>
        </div>

        <div className="rv-grid">
          {REVIEWS.map((r, i) => (
            <figure
              className="rv-card reveal"
              style={{ "--d": `${(i % 3) * 90}ms` }}
              key={r.name}
            >
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

