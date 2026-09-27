import { useApp } from "../../context/AppContext";
import { STATUSES } from "../../data/mockItems";
import Modal from "./Modal";

// Public board: never show a full phone number.
const mask = (v = "") => (/^\+?\d{10,14}$/.test(v) ? `${v.slice(0, v.length - 10)} ••••• ${v.slice(-5)}`.trim() : v);

export default function ItemModal({ itemId, onClose, requireLogin }) {
  const { items, updateItemStatus } = useApp();
  const item = items.find((i) => i.id === itemId);
  if (!item) return null;

  const idx = STATUSES.indexOf(item.status);
  const next = STATUSES[idx + 1];

  return (
    <Modal onClose={onClose} labelledBy="im-title" size="lg">
      <div className="im-layout">
        <div className="im-media">
          {item.image ? <img src={item.image} alt={item.description} /> : <span>No photo was added for this report</span>}
        </div>

        <div className="im-body">
          <span className={`sr-tag sr-${item.type}`}>{item.type === "lost" ? "Lost" : "Found"}</span>
          <h2 id="im-title">{item.description}</h2>

          <dl className="im-dl">
            <dt>Category</dt>
            <dd>{item.category}</dd>
            <dt>Date {item.type}</dt>
            <dd>{item.date}</dd>
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

          {next ? (
            <button
              type="button"
              className="lf-submit"
              onClick={() => requireLogin(() => updateItemStatus(item.id, next))}
            >
              Mark as {next}
            </button>
          ) : (
            <p className="im-done">This item has been returned to its owner.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
