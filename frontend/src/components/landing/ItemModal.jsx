import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import api from "../../api/client";
import Modal from "./Modal";

const STATUSES = ["Reported", "Matched", "Returned"];

export default function ItemModal({ itemId, onClose, requireLogin }) {
  const { user } = useApp();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestingChat, setRequestingChat] = useState(false);
  const [chatError, setChatError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!itemId) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    api
      .get(`/items/${itemId}`)
      .then((data) => {
        if (isMounted) {
          setItem(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to load item");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [itemId, user?.id]);

  const handleRequestChat = () => {
    const doRequest = async () => {
      setRequestingChat(true);
      setChatError("");
      try {
        const conv = await api.post("/conversations", { foundItemId: item.id });
        onClose?.();
        navigate(`/people?chat=${conv.id}`);
      } catch (err) {
        setChatError(err.message || "Failed to start conversation");
      } finally {
        setRequestingChat(false);
      }
    };

    if (requireLogin) {
      requireLogin(doRequest);
    } else {
      doRequest();
    }
  };

  if (loading) {
    return (
      <Modal onClose={onClose} labelledBy="im-title" size="lg">
        <div style={{ padding: "40px", textAlign: "center", color: "var(--peach-ink-soft)" }}>
          Loading item details…
        </div>
      </Modal>
    );
  }

  if (error || !item) {
    return (
      <Modal onClose={onClose} labelledBy="im-title" size="lg">
        <div style={{ padding: "40px", textAlign: "center", color: "var(--peach-ink-soft)" }}>
          {error || "Item not found."}
        </div>
      </Modal>
    );
  }

  const isLost = item.type === "lost";
  const currentStatusLower = (item.status || "reported").toLowerCase();
  const idx = STATUSES.map((s) => s.toLowerCase()).indexOf(currentStatusLower);

  return (
    <Modal onClose={onClose} labelledBy="im-title" size="lg">
      <div className="im-layout">
        <div className="im-media">
          {item.image ? (
            <img src={item.image} alt={item.description} />
          ) : (
            <span>No photo was added for this report</span>
          )}
        </div>

        <div className="im-body">
          <span className={`sr-tag sr-${item.type}`}>{isLost ? "Lost" : "Found"}</span>
          <h2 id="im-title">{item.description}</h2>

          <dl className="im-dl">
            <dt>Category</dt>
            <dd>{item.category}</dd>
            <dt>Date {item.type}</dt>
            <dd>{item.date}</dd>
            {item.location && (
              <>
                <dt>{isLost ? "Estimated Location" : "Location Found"}</dt>
                <dd>{item.location}</dd>
              </>
            )}
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
          {currentStatusLower === "returned" ? (
            <p className="im-done">This item has been returned to its owner.</p>
          ) : item.isMine ? (
            <p className="im-pending-text">This is your report.</p>
          ) : item.type === "found" ? (
            <>
              <button
                type="button"
                className="lf-submit"
                onClick={handleRequestChat}
                disabled={requestingChat}
              >
                {requestingChat ? "Connecting…" : "Request to chat with the finder"}
              </button>
              {chatError && (
                <div className="lf-otp-error" role="alert" style={{ marginTop: "12px" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{chatError}</span>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
