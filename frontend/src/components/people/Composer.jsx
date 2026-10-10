import React, { useRef, useEffect, useState } from "react";

export default function Composer({
  onSend,
  participantName = "Student",
  showSuggestions = false,
  suggestionChips = [
    "The description matches the item perfectly!",
    "Can we meet at the Central Library desk for handover?",
    "What time works best for you today?",
  ],
}) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  const canSend = Boolean(text.trim());

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const nextHeight = Math.min(el.scrollHeight, 120);
    el.style.height = `${Math.max(38, nextHeight)}px`;
  }, [text]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!canSend) return;
    onSend(text.trim());
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "38px";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChipClick = (chip) => {
    onSend(chip);
  };

  return (
    <div className="pp-composer-container">
      {/* Dynamic Suggestion Chips Row */}
      {showSuggestions && !text.trim() && (
        <div className="pp-suggestions-row" aria-label="Suggested quick replies">
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              className="pp-suggestion-chip"
              onClick={() => handleChipClick(chip)}
            >
              <span>{chip}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <form className="pp-composer-form" onSubmit={handleSubmit}>
        {/* Attach icon (visual only) */}
        <button
          type="button"
          className="pp-attach-btn"
          title="Attach image or file"
          aria-label="Attach file"
          onClick={() => {}}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>

        {/* Auto-growing Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${participantName}... (Enter to send)`}
          className="pp-composer-textarea"
          aria-label={`Message ${participantName}`}
        />

        {/* Morphing Send Button */}
        <button
          type="submit"
          disabled={!canSend}
          className={`pp-send-circle-btn ${canSend ? "is-active" : "is-disabled"}`}
          aria-label="Send message"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pp-send-arrow-icon"
            aria-hidden="true"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
}
