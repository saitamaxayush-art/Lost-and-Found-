import { useApp } from "../../context/AppContext";
import { STATUSES } from "../../data/mockItems";
import Modal from "./Modal";

// Public board: never show a full phone number.
const mask = (v = "") => (/^\+?\d{10,14}$/.test(v) ? `${v.slice(0, v.length - 10)} ••••• ${v.slice(-5)}`.trim() : v);

export default function ItemModal({ itemId, onClose, requireLogin }) {
  const { user, items, markItemMatched, requestMarkAsMatched, markItemReturned } = useApp();
  const item = items.find((i) => i.id === itemId);
  if (!item) return null;

  const isLost = item.type === "lost";
  const isReturned = item.status === "Returned" || item.isReturned;
  const isMatched = item.status === "Matched" || item.hasMatch;
  const userEmail = (user?.email || "").toLowerCase().trim();
  const isReporter =
    item.isUserItem ||
    (userEmail && (item.reporter || "").toLowerCase() === userEmail) ||
    (user?.name && (item.reporterName || "").toLowerCase() === user.name.toLowerCase());

  // Role resolution:
  // If lost item: reporter is owner.
  // If found item: reporter is finder.
  const isOwner = isLost ? isReporter : !isReporter;

  const idx = STATUSES.indexOf(item.status);

  return (
    <Modal onClose={onClose} labelledBy="im-title" size="lg">
      <div className="im-layout">
        <div className="im-media">
          {item.image ? <img src={item.image} alt={item.description} /> : <span>No photo was added for this report</span>}
        </div>

        <div className="im-body">
          <span className={`sr-tag sr-${item.type}`}>{isLost ? "Lost" : "Found"}</span>
          <h2 id="im-title">{item.description}</h2>

          <dl className="im-dl">
            <dt>Category</dt>
            <dd>{item.category}</dd>
            <dt>Date {item.type}</dt>
            <dd>{item.date}</dd>
            {(item.location || item.locationLost || item.locationFound) && (
              <>
                <dt>{isLost ? "Estimated Location" : "Location Found"}</dt>
                <dd>{item.location || (isLost ? item.locationLost : item.locationFound)}</dd>
              </>
            )}
            <dt>Reported by</dt>
            <dd>{mask(item.reporter)}</dd>
          </dl>

          <div className="im-track" aria-label={`Status: ${item.status}`}>
            {STATUSES.map((s, i) => (
              <div key={s} className={`im-step ${i <= idx ? "done" : ""}`}>
                <span>{i <= idx ? "✓" : i + 1}</span>
                {s}
              </div>
            ))}
          </div>

          {/* Action & Status depending on roles */}
          {isReturned ? (
            <p className="im-done">This item has been returned to its owner.</p>
          ) : isMatched ? (
            /* Item is Matched: ONLY the user who lost the item can mark as returned! Finder waits for owner. */
            isOwner ? (
              <button
                type="button"
                className="lf-submit"
                onClick={() =>
                  requireLogin(() => {
                    markItemReturned(item.id, item.reporterName || "Campus Finder");
                    onClose?.();
                  })
                }
              >
                Mark as Returned (+50 pts)
              </button>
            ) : (
              <div className="im-waiting-box">
                <strong>Waiting for the user who has lost the item to mark as returned</strong>
                <p>The owner must confirm handover receipt to mark as returned and close the report.</p>
              </div>
            )
          ) : (
            /* Item is Reported: Finder can mark as matched, owner can request mark as matched */
            isLost ? (
              isReporter ? (
                /* Lost item owner CANNOT mark as matched; can request mark as matched from finder */
                item.matchRequested ? (
                  <p className="im-pending-text">Match requested from finder — waiting for finder to mark as matched.</p>
                ) : (
                  <button
                    type="button"
                    className="lf-submit"
                    onClick={() =>
                      requireLogin(() => {
                        requestMarkAsMatched(item.id);
                      })
                    }
                  >
                    Request Mark as Matched
                  </button>
                )
              ) : (
                /* Non-owner who found this lost item can mark as matched! */
                <button
                  type="button"
                  className="lf-submit"
                  onClick={() =>
                    requireLogin(() => {
                      markItemMatched(item.id, user?.name || "Campus Student");
                    })
                  }
                >
                  I Found This (Mark as Matched)
                </button>
              )
            ) : (
              /* Found item: Finder has access to mark as matched; claimant/lost owner can request match */
              isReporter ? (
                <button
                  type="button"
                  className="lf-submit"
                  onClick={() =>
                    requireLogin(() => {
                      markItemMatched(item.id, "Verified Student");
                    })
                  }
                >
                  Mark as Matched
                </button>
              ) : item.matchRequested ? (
                <p className="im-pending-text">Match requested from finder — waiting for finder to mark as matched.</p>
              ) : (
                <button
                  type="button"
                  className="lf-submit"
                  onClick={() =>
                    requireLogin(() => {
                      requestMarkAsMatched(item.id, item.reporterName);
                    })
                  }
                >
                  Request Mark as Matched
                </button>
              )
            )
          )}
        </div>
      </div>
    </Modal>
  );
}
