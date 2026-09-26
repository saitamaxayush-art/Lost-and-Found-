import { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import { CATEGORIES, STATUSES } from "../../data/mockItems";
import SearchDissolveLoader from "./SearchDissolveLoader";
import ThemeDropdown, { CATEGORY_ICONS, STATUS_ICONS } from "./ThemeDropdown";

const PAGE = 6;

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Wraps every occurrence of any search token inside `text` in a <mark>,
// so matched words are visibly highlighted on-theme.
function highlightText(text, tokens) {
  if (!tokens || !tokens.length) return text;
  const pattern = tokens
    .map(escapeRegExp)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .join("|");
  if (!pattern) return text;
  const re = new RegExp(`(${pattern})`, "gi");
  const parts = String(text).split(re);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="sr-hl">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function ItemCard({ item, onOpen, tokens = [] }) {
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
        <h3>{highlightText(item.description, tokens)}</h3>
        <div className="sr-meta">
          <span>{highlightText(item.category, tokens)}</span>
          <span>{item.date}</span>
        </div>
      </div>
    </button>
  );
}

export default function SearchSection({ onOpenItem, onReport, onMouseEnter, onMouseLeave, isHovered }) {
  const { items } = useApp();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [showAll, setShowAll] = useState(false);

  // Managed search execution state (triggered only on search button click or Enter)
  const [isSearching, setIsSearching] = useState(false);
  const [activeQuery, setActiveQuery] = useState("");
  const [activeTokens, setActiveTokens] = useState([]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();

    if (!trimmed) {
      setActiveQuery("");
      setActiveTokens([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setShowAll(false);

    // Let the smooth floating oval bubble animation play for a satisfying duration
    const SEARCH_DURATION = 1100;
    setTimeout(() => {
      setActiveQuery(trimmed);
      setActiveTokens(trimmed.toLowerCase().split(/\s+/).filter(Boolean));
      setIsSearching(false);
    }, SEARCH_DURATION);
  };

  const handleClear = () => {
    setQuery("");
    setActiveQuery("");
    setActiveTokens([]);
    setIsSearching(false);
    setShowAll(false);
  };

  const resetAllFilters = () => {
    setQuery("");
    setActiveQuery("");
    setActiveTokens([]);
    setIsSearching(false);
    setType("all");
    setCategory("all");
    setStatus("all");
    setShowAll(false);
  };

  // Only display search results when an explicit search has occurred
  const hasSearched = activeQuery.length > 0 || isSearching;

  const results = useMemo(() => {
    if (!activeTokens.length) return [];
    return items
      .filter((i) => (type === "all" ? true : i.type === type))
      .filter((i) => (category === "all" ? true : i.category === category))
      .filter((i) => (status === "all" ? true : i.status === status))
      .filter((i) => {
        const haystack = `${i.description} ${i.category} ${i.type} ${i.status}`.toLowerCase();
        return activeTokens.every((t) => haystack.includes(t));
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [items, activeTokens, type, category, status]);

  const visible = showAll ? results : results.slice(0, PAGE);
  const filtersOn = query.trim() !== "" || type !== "all" || category !== "all" || status !== "all";

  return (
    <section
      id="search"
      className={`lp-section lp-search ${isHovered ? "is-hovered" : ""}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="lp-wrap">
        <div className="lp-head reveal">
          <span className="lp-eyebrow">Search a Lost Item</span>
          <h2>Look through everything reported on campus.</h2>
          <p>Type what you lost — colour, brand, where you last had it — or browse what people have handed in.</p>
        </div>

        <div className="sr-panel reveal">
          {/* Integrated search bar with explicit Search button */}
          <form className="sr-search" onSubmit={handleSearchSubmit}>
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              className="sr-search-icon"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>

            <span className="sr-sr">Search reported items</span>
            <input
              id="search-input"
              type="text"
              name="lostfound-search-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe it — e.g. black leather wallet, AirPods near library, blue bottle…"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-lpignore="true"
              data-1p-ignore="true"
            />

            {query && (
              <button
                type="button"
                className="sr-input-clear"
                onClick={handleClear}
                aria-label="Clear search text"
              >
                ✕
              </button>
            )}

            <button type="submit" className="sr-search-submit-btn">
              <span>Search</span>
            </button>
          </form>

          <div className="sr-filters">
            <div className="sr-seg" role="group" aria-label="Type">
              {[
                ["all", "All"],
                ["lost", "Lost"],
                ["found", "Found"],
              ].map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  className={type === v ? "on" : ""}
                  aria-pressed={type === v}
                  onClick={() => setType(v)}
                >
                  {l}
                </button>
              ))}
            </div>

            <ThemeDropdown
              value={category}
              onChange={setCategory}
              options={[
                { value: "all", label: "All categories", icon: CATEGORY_ICONS.all },
                ...CATEGORIES.map((c) => ({
                  value: c,
                  label: c,
                  icon: CATEGORY_ICONS[c],
                })),
              ]}
              placeholder="All categories"
              ariaLabel="Category filter"
              icons={CATEGORY_ICONS}
              className="sr-theme-select-category"
            />

            <ThemeDropdown
              value={status}
              onChange={setStatus}
              options={[
                { value: "all", label: "All statuses", icon: STATUS_ICONS.all },
                ...STATUSES.map((s) => ({
                  value: s,
                  label: s,
                  icon: STATUS_ICONS[s],
                })),
              ]}
              placeholder="All statuses"
              ariaLabel="Status filter"
              icons={STATUS_ICONS}
              className="sr-theme-select-status"
            />

            {filtersOn && (
              <button type="button" className="sr-reset" onClick={resetAllFilters}>
                Clear
              </button>
            )}
          </div>

          <div className="sr-report">
            <span>Can't find it?</span>
            <button
              type="button"
              className="lp-btn-primary sm"
              onClick={() => onReport("lost")}
            >
              Report a lost item
            </button>
            <button
              type="button"
              className="lp-btn-secondary sm"
              onClick={() => onReport("found")}
            >
              I found something
            </button>
          </div>
        </div>

        {/* Search Results / Loading State:
            Only rendered when the user has clicked Search */}
        {isSearching ? (
          <div className="sr-loader-slot">
            <SearchDissolveLoader query={query.trim()} />
          </div>
        ) : hasSearched ? (
          <div className="sr-results-container">
            <p className="sr-count" aria-live="polite">
              {results.length} {results.length === 1 ? "item" : "items"} found for "{activeQuery}"
            </p>

            {results.length === 0 ? (
              <div className="sr-empty">
                <div className="sr-empty-icon" aria-hidden="true">
                  🔍
                </div>
                <h3>No matching items found</h3>
                <p>
                  We couldn't find any reports matching "<strong>{activeQuery}</strong>". Try using broader keywords or report it below so our campus community can keep a lookout.
                </p>
                <div className="sr-empty-actions">
                  <button
                    type="button"
                    className="lp-btn-primary sm"
                    onClick={() => onReport("lost")}
                  >
                    Report it as lost
                  </button>
                  <button type="button" className="lp-btn-secondary sm" onClick={resetAllFilters}>
                    Clear search
                  </button>
                </div>
              </div>
            ) : (
              <div className="sr-grid">
                {visible.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onOpen={onOpenItem}
                    tokens={activeTokens}
                  />
                ))}
              </div>
            )}

            {results.length > PAGE && (
              <div className="sr-more">
                <button
                  type="button"
                  className="lp-btn-secondary sm"
                  onClick={() => setShowAll((s) => !s)}
                >
                  {showAll ? "Show fewer" : `Show all ${results.length} items`}
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
