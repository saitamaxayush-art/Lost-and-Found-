import { useState } from "react";
import api from "../../api/client";
import { CATEGORIES, STATUSES } from "../../data/mockItems";
import SearchDissolveLoader from "./SearchDissolveLoader";
import ThemeDropdown, { CATEGORY_ICONS, STATUS_ICONS } from "./ThemeDropdown";
import { sound } from "../../utils/sound";

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
  // Use matchedWords from backend item if available, otherwise tokens
  const highlightTokens = item.matchedWords && item.matchedWords.length > 0
    ? item.matchedWords
    : tokens;

  // Calculate total query words from matchedWords and matchPercent
  let matchInfo = null;
  if (item.matchedWords && item.matchedWords.length > 0 && typeof item.matchPercent === "number") {
    const totalWords = item.matchPercent > 0
      ? Math.max(item.matchedWords.length, Math.round((item.matchedWords.length * 100) / item.matchPercent))
      : item.matchedWords.length;
    matchInfo = `Matches ${item.matchedWords.length} of ${totalWords} words`;
  }

  return (
    <button
      type="button"
      className="sr-card"
      onClick={() => {
        sound.playUiClick();
        onOpen(item.id);
      }}
    >
      <div className="sr-card-media">
        {item.image ? <img src={item.image} alt="" /> : <span>No photo added</span>}
      </div>
      <div className="sr-card-body">
        <div className="sr-card-top">
          <span className={`sr-tag sr-${item.type}`}>{item.type === "lost" ? "Lost" : "Found"}</span>
          <span className={`sr-status sr-st-${(item.status || "").toLowerCase()}`}>{item.status}</span>
        </div>
        <h3>{highlightText(item.description, highlightTokens)}</h3>
        {matchInfo && (
          <div className="sr-match-line" style={{ fontSize: "12px", fontWeight: 600, color: "var(--peach-accent-dark, #b86214)" }}>
            {matchInfo}
          </div>
        )}
        <div className="sr-meta">
          <span>{highlightText(item.category, highlightTokens)}</span>
          <span>{item.date}</span>
          {(item.location || item.locationLost || item.locationFound) && (
            <span className="sr-loc-badge" title={item.location || item.locationLost || item.locationFound}>
              📍 {item.location || item.locationLost || item.locationFound}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function SearchSection({ onOpenItem, onReport, onMouseEnter, onMouseLeave, isHovered }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("found");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [showAll, setShowAll] = useState(false);

  // Managed search execution state (triggered only on search button click or Enter)
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeQuery, setActiveQuery] = useState("");
  const [results, setResults] = useState([]);

  const activeTokens = activeQuery ? activeQuery.toLowerCase().split(/\s+/).filter(Boolean) : [];

  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    sound.playUiClick();
    const trimmed = query.trim();

    setIsSearching(true);
    setShowAll(false);

    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    if (type && type !== "all") params.set("type", type);
    if (category && category !== "all") params.set("category", category);
    if (status && status !== "all") params.set("status", status.toLowerCase());

    // Keep the existing 1100 ms SearchDissolveLoader animation: start the request immediately
    // and remove the loader only when BOTH the timer and the request have finished.
    const timerPromise = new Promise((resolve) => setTimeout(resolve, 1100));
    const fetchPromise = api.get(`/items/search?${params.toString()}`);

    try {
      const [, data] = await Promise.all([timerPromise, fetchPromise]);
      setResults(Array.isArray(data) ? data : []);
      setActiveQuery(trimmed);
      setHasSearched(true);
    } catch (err) {
      console.error("Search request failed:", err);
      setResults([]);
      setActiveQuery(trimmed);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setActiveQuery("");
    setResults([]);
    setIsSearching(false);
    setShowAll(false);
    setHasSearched(false);
  };

  const resetAllFilters = () => {
    sound.playUiClick();
    setQuery("");
    setActiveQuery("");
    setType("found");
    setCategory("all");
    setStatus("all");
    setResults([]);
    setIsSearching(false);
    setShowAll(false);
    setHasSearched(false);
  };

  const visible = showAll ? results : results.slice(0, PAGE);
  const filtersOn = query.trim() !== "" || type !== "found" || category !== "all" || status !== "all";

  return (
    <section
      id="search"
      className={`lp-section lp-search ${isHovered ? "is-hovered" : ""}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="lp-wrap">
        <div className="lp-head reveal">
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
              onClick={() => {
                sound.playUiClick();
                onReport("lost");
              }}
            >
              Report a lost item
            </button>
            <button
              type="button"
              className="lp-btn-secondary sm"
              onClick={() => {
                sound.playUiClick();
                onReport("found");
              }}
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
              {results.length} {results.length === 1 ? "item" : "items"} found{activeQuery ? ` for "${activeQuery}"` : ""}
            </p>

            {results.length === 0 ? (
              <div className="sr-empty">
                <div className="sr-empty-icon" aria-hidden="true">
                  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h3>No matching items found</h3>
                <p>
                  {activeQuery ? (
                    <>We couldn't find any reports matching "<strong>{activeQuery}</strong>". Try using broader keywords or report it below so our campus community can keep a lookout.</>
                  ) : (
                    <>We couldn't find any reports matching your filters. Try selecting different options or report it below so our campus community can keep a lookout.</>
                  )}
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
