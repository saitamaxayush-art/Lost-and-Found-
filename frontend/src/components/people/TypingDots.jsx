import React from "react";

export default function TypingDots() {
  return (
    <div className="pp-typing-indicator" aria-label="Participant is typing">
      <div className="pp-typing-bubble">
        <span className="pp-typing-dot" style={{ animationDelay: "0ms" }} />
        <span className="pp-typing-dot" style={{ animationDelay: "160ms" }} />
        <span className="pp-typing-dot" style={{ animationDelay: "320ms" }} />
      </div>
    </div>
  );
}
