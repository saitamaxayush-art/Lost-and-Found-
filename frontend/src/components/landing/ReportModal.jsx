import { useEffect, useState } from "react";
import { CATEGORIES } from "../../data/mockItems";
import { useApp } from "../../context/AppContext";
import api from "../../api/client";
import Modal from "./Modal";
import ThemeDropdown, { CATEGORY_ICONS } from "./ThemeDropdown";

export default function ReportModal({ type, onClose, onViewItem, onViewReport, requireLogin }) {
  const { user } = useApp();
  const verb = type === "lost" ? "lost" : "found";

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function onImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function performSubmit() {
    if (!description.trim() || !date) return;
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("description", description.trim());
      formData.append("category", category);
      formData.append("location", location.trim());
      formData.append("date", date);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await api.upload("/items", formData);
      const match = res.possibleMatches?.[0] || null;
      setResult({ item: res.item, match });
    } catch (err) {
      setError(err.message || "Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function submit(e) {
    e.preventDefault();
    if (!user && requireLogin) {
      requireLogin(performSubmit);
      return;
    }
    performSubmit();
  }

  if (result) {
    const { item, match } = result;
    return (
      <Modal onClose={onClose} labelledBy="rp-title" size="sm">
        <div className="lf-done" role="status">
          <div className="lf-check" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </div>
          <h3 id="rp-title">Your {verb} report is on the board.</h3>
          <p>
            {match
              ? "Good news — it looks similar to a report already on the board. We've added a possible match to your notifications."
              : "We'll keep checking new reports and notify you as soon as we find a likely match."}
          </p>
          {match && (
            <button type="button" className="lf-submit" onClick={() => onViewItem(match.id)}>
              View the possible match
            </button>
          )}
          <button
            type="button"
            className={match ? "lf-ghost" : "lf-submit"}
            onClick={() => {
              if (onViewReport) {
                onViewReport(item.id);
              } else {
                onViewItem(item.id, { isMyReport: true });
              }
            }}
          >
            View my report
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} labelledBy="rp-title" size="md">
      <h2 id="rp-title">Report a {verb} item</h2>
      <p className="lm-sub">Add as much detail as you can — it helps us match it faster.</p>

      <form onSubmit={submit}>
        <div className="lf-row">
          <label htmlFor="rp-desc">Item description</label>
          <textarea
            id="rp-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={`Describe the item you ${verb} — colour, brand, identifying marks…`}
            required
          />
        </div>

        <div className="lf-two">
          <div className="lf-row">
            <label id="rp-cat-label">Category</label>
            <ThemeDropdown
              id="rp-cat"
              value={category}
              onChange={setCategory}
              options={CATEGORIES.map((c) => ({
                value: c,
                label: c,
                icon: CATEGORY_ICONS[c],
              }))}
              placeholder="Select category"
              ariaLabel="Select category"
              icons={CATEGORY_ICONS}
              className="lf-dropdown-theme"
            />
          </div>
          <div className="lf-row">
            <label htmlFor="rp-date">Date {verb}</label>
            <input id="rp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
        </div>

        {/* Estimated / Known Location Section */}
        <div className="lf-row">
          <label htmlFor="rp-location">
            {type === "lost" ? "Where do you think you lost it? (Estimated location)" : "Where was the item found?"}
          </label>
          <input
            id="rp-location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={
              type === "lost"
                ? "e.g. Central Library 2nd floor, CS Lab 301, Canteen, Near Sports Complex…"
                : "e.g. Bench near Canteen, Seminar Hall B entrance, Basketball Court…"
            }
            required
          />
          <div className="lf-quick-spots">
            <span className="lf-quick-spots-label">Quick select:</span>
            {["Central Library", "CS Lab 301", "Campus Canteen", "Sports Ground", "Seminar Hall", "Hostel Block"].map((spot) => (
              <button
                key={spot}
                type="button"
                className={`lf-spot-chip ${location === spot ? "is-active" : ""}`}
                onClick={() => setLocation(spot)}
              >
                {spot}
              </button>
            ))}
          </div>
        </div>

        <div className="lf-row">
          <label htmlFor="rp-img">Photo (optional)</label>
          <label className="lf-drop" htmlFor="rp-img">
            {imageFile ? "Photo selected — click to change" : "Click to upload a photo of the item"}
          </label>
          <input id="rp-img" type="file" accept="image/*" onChange={onImage} style={{ display: "none" }} />
          {previewUrl && <img className="lf-preview" src={previewUrl} alt="Preview" />}
        </div>

        {error && (
          <div className="lf-otp-error" role="alert" style={{ marginBottom: "1rem" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <button className="lf-submit" type="submit" disabled={loading}>
          {loading ? "Submitting report…" : `Submit ${verb} report`}
        </button>
      </form>
    </Modal>
  );
}
