import { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import { CATEGORIES, STATUSES } from "../../data/mockItems";

const PAGE = 6;

export function ItemCard({ item, onOpen }) {
  return (
    <button type="button" className="sr-card" onClick={() => onOpen(item.id)}>
      <div className="sr-card-media">
        {item.image ? <img src={item.image} alt="" /> : <span>No photo added</span>}
      </div>
      <div className="sr-card-body">
        <div className="sr-card-top">
          <span className={`sr-tag sr-${item.type}`}>{item.type === "lost" ? "Lost" : "Found"}</span>
          <span className={`sr-status sr-st-${item.status.toLowerCase()}`}>{item.status}</span>
        </div>
        <h3>{item.description}</h3>
        <div className="sr-meta">
          <span>{item.category}</span>
          <span>{item.date}</span>
        </div>
      </div>
    </button>
  );
}

export default function SearchSection({ onOpenItem, onReport }) {
  const { items } = useApp();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [showAll, setShowAll] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((i) => (type === "all" ? true : i.type === type))
      .filter((i) => (category === "all" ? true : i.category === category))
      .filter((i) => (status === "all" ? true : i.status === status))
      .filter((i) => (q ? `${i.description} ${i.category}`.toLowerCase().includes(q) : true))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [items, query, type, category, status]);

  const visible = showAll ? results : results.slice(0, PAGE);
  const filtersOn = query || type !== "all" || category !== "all" || status !== "all";

  const reset = () => {
    setQuery("");
    setType("all");
    setCategory("all");
    setStatus("all");
  };

  return (
    <section id="search" className="lp-section lp-search">
      <div className="lp-wrap">
        <div className="lp-head reveal">
          <span className="lp-eyebrow">Search a Lost Item</span>
          <h2>Look through everything reported on campus.</h2>
          <p>Type what you lost — colour, brand, where you last had it — or browse what people have handed in.</p>
        </div>

        <div className="sr-panel reveal">
          <label className="sr-search">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <span className="sr-sr">Search reported items</span>
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowAll(false);
              }}
              placeholder="e.g. black wallet, blue bottle, ID card…"
            />
          </label>

          <div className="sr-filters">
            <div className="sr-seg" role="group" aria-label="Type">
              {[
                ["all", "All"],
                ["lost", "Lost"],
                ["found", "Found"],
              ].map(([v, l]) => (
                <button key={v} type="button" className={type === v ? "on" : ""} aria-pressed={type === v} onClick={() => setType(v)}>
                  {l}
                </button>
              ))}
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
              <option value="all">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {filtersOn && (
              <button type="button" className="sr-reset" onClick={reset}>Clear</button>
            )}
          </div>

          <div className="sr-report">
            <span>Can't find it?</span>
            <button type="button" className="lp-btn-primary sm" onClick={() => onReport("lost")}>Report a lost item</button>
            <button type="button" className="lp-btn-secondary sm" onClick={() => onReport("found")}>I found something</button>
          </div>
        </div>

        <p className="sr-count" aria-live="polite">
          {results.length} {results.length === 1 ? "item" : "items"}
          {filtersOn ? " match your search" : " reported"}
        </p>

        {results.length === 0 ? (
          <div className="sr-empty">
            Nothing matches that yet. Try fewer words, or report it so we can watch for a match.
          </div>
        ) : (
          <div className="sr-grid">
            {visible.map((item) => (
              <ItemCard key={item.id} item={item} onOpen={onOpenItem} />
            ))}
          </div>
        )}

        {results.length > PAGE && (
          <div className="sr-more">
            <button type="button" className="lp-btn-secondary sm" onClick={() => setShowAll((s) => !s)}>
              {showAll ? "Show fewer" : `Show all ${results.length} items`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
