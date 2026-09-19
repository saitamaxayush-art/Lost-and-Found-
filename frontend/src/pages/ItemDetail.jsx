import { Link, useNavigate, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { STATUSES } from "../data/mockItems";
import StatusBadge from "../components/StatusBadge";

export default function ItemDetail() {
  const { id } = useParams();
  const { items, updateItemStatus, user } = useApp();
  const navigate = useNavigate();

  const item = items.find((it) => it.id === id);

  if (!item) {
    return (
      <div className="page">
        <div className="empty-state">
          This item doesn't exist (or was removed).{" "}
          <Link to="/browse" className="link-btn">
            Back to browse
          </Link>
        </div>
      </div>
    );
  }

  const currentIndex = STATUSES.indexOf(item.status);
  const canAdvance = currentIndex < STATUSES.length - 1;

  function handleAdvance() {
    if (!user) {
      navigate("/login", { state: { from: `/item/${item.id}` } });
      return;
    }
    const nextStatus = STATUSES[currentIndex + 1];
    updateItemStatus(item.id, nextStatus);
  }

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/browse" className="link-btn">
          ← Back to browse
        </Link>
      </div>

      <div className="detail-layout">
        <div>
          <div className="detail-media">
            {item.image ? (
              <img src={item.image} alt={item.description} />
            ) : (
              "No photo was added for this report"
            )}
          </div>
        </div>

        <div className="detail-panel">
          <span className={`type-tag ${item.type}`}>{item.type === "lost" ? "Lost" : "Found"}</span>
          <h1 style={{ fontSize: "1.3rem", marginTop: "0.7rem" }}>{item.description}</h1>

          <dl>
            <dt>Category</dt>
            <dd>{item.category}</dd>
            <dt>Date {item.type}</dt>
            <dd>{item.date}</dd>
            <dt>Reported by</dt>
            <dd>{item.reporter}</dd>
            <dt>Current status</dt>
            <dd>
              <StatusBadge status={item.status} />
            </dd>
          </dl>

          <div className="status-tracker">
            {STATUSES.map((status, i) => (
              <div key={status} className={`status-step ${i <= currentIndex ? "done" : ""}`}>
                <div className="status-line" />
                <div className="dot">{i + 1}</div>
                <div className="label">{status}</div>
              </div>
            ))}
          </div>

          {canAdvance ? (
            <button className="advance-btn" onClick={handleAdvance}>
              Mark as {STATUSES[currentIndex + 1]}
            </button>
          ) : (
            <p className="form-note">This item has completed its journey. 🎉</p>
          )}
          {!user && canAdvance && (
            <p className="form-note">You'll need to log in to update the status.</p>
          )}
        </div>
      </div>
    </div>
  );
}
