import { useState } from "react";
import { CATEGORIES } from "../../data/mockItems";
import { useApp } from "../../context/AppContext";
import Modal from "./Modal";

export default function ReportModal({ type, onClose, onViewItem }) {
  const { addItem } = useApp();
  const verb = type === "lost" ? "lost" : "found";

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);

  function onImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
  }

  function submit(e) {
    e.preventDefault();
    if (!description.trim() || !date) return;
    setResult(addItem({ type, description: description.trim(), category, date, image }));
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
          <button type="button" className={match ? "lf-ghost" : "lf-submit"} onClick={() => onViewItem(item.id)}>
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
            <label htmlFor="rp-cat">Category</label>
            <select id="rp-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="lf-row">
            <label htmlFor="rp-date">Date {verb}</label>
            <input id="rp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
        </div>

        <div className="lf-row">
          <label htmlFor="rp-img">Photo (optional)</label>
          <label className="lf-drop" htmlFor="rp-img">
            {image ? "Photo selected — click to change" : "Click to upload a photo of the item"}
          </label>
          <input id="rp-img" type="file" accept="image/*" onChange={onImage} style={{ display: "none" }} />
          {image && <img className="lf-preview" src={image} alt="Preview" />}
        </div>

        <button className="lf-submit" type="submit">Submit {verb} report</button>
      </form>
    </Modal>
  );
}
