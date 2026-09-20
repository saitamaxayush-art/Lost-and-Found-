import { useEffect, useRef, useState } from "react";
import { MONTHLY, REVIEWS, STATS } from "../../data/successData";

function CountUp({ to, decimals = 0, suffix = "" }) {
  const ref = useRef(null);
  const [val, setVal] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      setVal(to);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const dur = 1400;
        const step = (now) => {
          const k = Math.min(1, (now - t0) / dur);
          setVal(to * (1 - Math.pow(1 - k, 3)));
          if (k < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to]);

  const text = decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString("en-IN");
  return (
    <span ref={ref}>
      {text}
      {suffix}
    </span>
  );
}

function Stars() {
  return (
    <span className="rv-stars" role="img" aria-label="5 out of 5 stars">
      {"★★★★★"}
    </span>
  );
}

export default function HistorySection() {
  const max = Math.max(...MONTHLY.map((m) => m.reported));

  return (
    <section id="history" className="lp-section lp-history">
      <div className="lp-wrap">
        <div className="lp-head reveal">
          <span className="lp-eyebrow">History</span>
          <h2>Thousands of things have found their way home.</h2>
          <p>
            FindBack started as a WhatsApp group between students tired of unclaimed water bottles, ID cards and
            umbrellas piling up at the notice board. It grew into a proper lost &amp; found board, and then into the
            matching system you see today.
          </p>
        </div>

        <div className="hs-stats">
          {STATS.map((s, i) => (
            <div className="hs-stat reveal" style={{ "--d": `${i * 80}ms` }} key={s.label}>
              <strong>
                <CountUp to={s.value} decimals={s.decimals} suffix={s.suffix} />
              </strong>
              <span className="hs-label">{s.label}</span>
              <small>{s.note}</small>
            </div>
          ))}
        </div>

        <div className="hs-chart reveal">
          <div className="hs-chart-head">
            <h3>Reported vs. reunited</h3>
            <div className="hs-legend">
              <span><i className="a" /> Reported</span>
              <span><i className="b" /> Reunited</span>
            </div>
          </div>
          <div className="hs-bars" role="img" aria-label="Bar chart of items reported and reunited per month over the last eight months, both rising steadily">
            {MONTHLY.map((m, i) => (
              <div className="hs-col" key={m.m} style={{ "--d": `${i * 70}ms` }}>
                <div className="hs-pair">
                  <div className="hs-bar a" style={{ "--h": m.reported / max }} title={`${m.reported} reported`} />
                  <div className="hs-bar b" style={{ "--h": m.reunited / max }} title={`${m.reunited} reunited`} />
                </div>
                <span>{m.m}</span>
              </div>
            ))}
          </div>
        </div>

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
