import { useEffect, useRef, useState } from "react";

const SvgIcon = ({ children }) => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "block", flexShrink: 0 }}
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const CATEGORY_ICONS = {
  all: (
    <SvgIcon>
      <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
      <circle cx="12" cy="12" r="3" />
    </SvgIcon>
  ),
  Electronics: (
    <SvgIcon>
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <line x1="2" y1="20" x2="22" y2="20" />
      <line x1="12" y1="17" x2="12" y2="20" />
    </SvgIcon>
  ),
  Stationery: (
    <SvgIcon>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </SvgIcon>
  ),
  Clothing: (
    <SvgIcon>
      <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
    </SvgIcon>
  ),
  "ID Cards": (
    <SvgIcon>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="9" cy="10" r="2" />
      <line x1="15" y1="8" x2="17" y2="8" />
      <line x1="15" y1="12" x2="17" y2="12" />
      <line x1="7" y1="16" x2="17" y2="16" />
    </SvgIcon>
  ),
  Accessories: (
    <SvgIcon>
      <path d="M6 20h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
      <path d="M9 6a3 3 0 0 1 6 0" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </SvgIcon>
  ),
  Books: (
    <SvgIcon>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </SvgIcon>
  ),
  Other: (
    <SvgIcon>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </SvgIcon>
  ),
};

export const STATUS_ICONS = {
  all: (
    <SvgIcon>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </SvgIcon>
  ),
  Reported: (
    <SvgIcon>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </SvgIcon>
  ),
  Matched: (
    <SvgIcon>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </SvgIcon>
  ),
  Returned: (
    <SvgIcon>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </SvgIcon>
  ),
};

/**
 * On-theme glassmorphism custom dropdown with smooth animations,
 * icons, keyboard navigation, and full accessibility.
 */
export default function ThemeDropdown({
  value,
  onChange,
  options = [],
  placeholder = "Select option",
  ariaLabel,
  id,
  icons = {},
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  // Normalize options to { value, label, icon }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "string") {
      return {
        value: opt,
        label: opt,
        icon: icons[opt] || null,
      };
    }
    return {
      value: opt.value,
      label: opt.label,
      icon: opt.icon || icons[opt.value] || null,
    };
  });

  const selectedOpt = normalizedOptions.find((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
        const idx = normalizedOptions.findIndex((o) => o.value === value);
        setHighlightedIndex(idx >= 0 ? idx : 0);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % normalizedOptions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + normalizedOptions.length) % normalizedOptions.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < normalizedOptions.length) {
        onChange(normalizedOptions[highlightedIndex].value);
        setIsOpen(false);
      }
    } else if (e.key === "Tab") {
      setIsOpen(false);
    }
  };

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  const isFiltered = value && value !== "all";

  return (
    <div
      ref={containerRef}
      className={`theme-dropdown-root ${className} ${isOpen ? "is-open" : ""} ${isFiltered ? "is-filtered" : ""}`}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        id={id}
        className="theme-dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || placeholder}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="theme-dropdown-label-wrap">
          {selectedOpt?.icon && (
            <span className="theme-dropdown-icon" aria-hidden="true">
              {selectedOpt.icon}
            </span>
          )}
          <span className="theme-dropdown-label">
            {selectedOpt ? selectedOpt.label : placeholder}
          </span>
        </span>
        <svg
          className="theme-dropdown-chevron"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2.5 4.5L6 8L9.5 4.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="theme-dropdown-panel" role="listbox" ref={listRef} aria-label={ariaLabel || placeholder}>
          <div className="theme-dropdown-options-scroll">
            {normalizedOptions.map((opt, index) => {
              const isSelected = opt.value === value;
              const isHighlighted = index === highlightedIndex;

              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  className={`theme-dropdown-option ${isSelected ? "is-selected" : ""} ${
                    isHighlighted ? "is-highlighted" : ""
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(opt.value);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(opt.value);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span className="theme-dropdown-option-left">
                    {opt.icon && (
                      <span className="theme-dropdown-option-icon" aria-hidden="true">
                        {opt.icon}
                      </span>
                    )}
                    <span className="theme-dropdown-option-text">{opt.label}</span>
                  </span>
                  {isSelected && (
                    <svg
                      className="theme-dropdown-check"
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M2.5 7.5L5.5 10.5L11.5 3.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
