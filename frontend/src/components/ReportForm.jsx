import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATEGORIES } from "../data/mockItems";
import { useApp } from "../context/AppContext";

// Shared by ReportLost.jsx and ReportFound.jsx — `type` is "lost" or "found".
export default function ReportForm({ type }) {
  const { addItem } = useApp();
  const navigate = useNavigate();

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState("");
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!description.trim() || !date) return;

    setSubmitting(true);
    const { match } = addItem({
      type,
      description: description.trim(),
      category,
      date,
      image,
    });
    setSubmitting(false);

    if (match) {
      navigate(`/item/${match.id}`);
    } else {
      navigate("/browse");
    }
  }

  const verb = type === "lost" ? "lost" : "found";

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <div className="form-row">
        <label htmlFor="description">Item description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={`Describe the item you ${verb} — color, brand, any identifying marks...`}
          required
        />
      </div>

      <div className="two-col">
        <div className="form-row">
          <label htmlFor="category">Category</label>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="date">Date {verb}</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <label htmlFor="image">Photo (optional)</label>
        <label className="image-drop" htmlFor="image">
          {image ? "Photo selected — click to change" : "Click to upload a photo of the item"}
        </label>
        <input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={{ display: "none" }}
        />
        {image && <img className="image-preview" src={image} alt="Preview" />}
      </div>

      <button className="submit-btn" type="submit" disabled={submitting}>
        {submitting ? "Submitting..." : `Submit ${type === "lost" ? "lost" : "found"} report`}
      </button>

      <p className="form-note">
        We'll automatically check this against existing reports and notify you if we find a
        likely match.
      </p>
    </form>
  );
}
