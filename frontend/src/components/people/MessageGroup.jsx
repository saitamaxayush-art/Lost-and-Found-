import React from "react";
import Avatar from "../common/Avatar";

export default function MessageGroup({
  group,
  isOwn = false,
  participantName = "Student",
  participantAvatar = null,
}) {
  const { messages, sender } = group;
  const lastIdx = messages.length - 1;
  const lastMsg = messages[lastIdx];

  return (
    <div className={`pp-msg-group ${isOwn ? "is-own-group" : "is-other-group"}`}>
      {/* Show avatar for other person */}
      {!isOwn && (
        <div className="pp-group-avatar-col" aria-hidden="true">
          <Avatar
            name={participantName}
            image={participantAvatar}
            size={28}
            className="pp-msg-avatar"
          />
        </div>
      )}

      <div className="pp-group-bubbles-col">
        {messages.map((msg, i) => {
          const isFirst = i === 0;
          const isLast = i === lastIdx;
          const isSingle = messages.length === 1;

          let bubbleClass = "pp-bubble";
          if (isSingle) {
            bubbleClass += " is-single";
          } else if (isFirst) {
            bubbleClass += " is-first";
          } else if (isLast) {
            bubbleClass += " is-last";
          } else {
            bubbleClass += " is-middle";
          }

          return (
            <div key={msg.id || i} className="pp-bubble-row">
              <div
                className={`${bubbleClass} ${isOwn ? "is-own" : "is-other"}`}
                title={msg.time}
              >
                <p className="pp-bubble-text">{msg.text}</p>
                <span className="pp-bubble-hover-time">{msg.time}</span>
              </div>
            </div>
          );
        })}

        {/* Footer time & seen tick under last bubble */}
        <div className="pp-group-footer">
          <span className="pp-group-time">{lastMsg?.time}</span>
          {isOwn && (
            <span className="pp-seen-tick" title="Delivered & Seen">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="18 6 7 17 2 12" />
                <polyline points="22 10 15 17" />
              </svg>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
