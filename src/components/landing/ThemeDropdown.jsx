import { useEffect, useRef, useState } from "react";

export const CATEGORY_ICONS = {
  all: "✨",
  Electronics: "💻",
  Stationery: "✏️",
  Clothing: "👕",
  "ID Cards": "🪪",
  Accessories: "🎒",
  Books: "📚",
  Other: "📦",
};

export const STATUS_ICONS = {
  all: "📋",
  Reported: "📌",
  Matched: "⚡",
  Returned: "✅",
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
                  onClick={() => handleSelect(opt.value)}
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
