import { CATEGORIES, STATUSES } from "../data/mockItems";

export default function FilterBar({ filters, onChange }) {
  function set(key, value) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="filter-bar">
      <input
        type="text"
        placeholder="Search by keyword (e.g. wallet, bottle, ID card)..."
        value={filters.query}
        onChange={(e) => set("query", e.target.value)}
      />
      <select value={filters.type} onChange={(e) => set("type", e.target.value)}>
        <option value="all">All types</option>
        <option value="lost">Lost</option>
        <option value="found">Found</option>
      </select>
      <select value={filters.category} onChange={(e) => set("category", e.target.value)}>
        <option value="all">All categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select value={filters.status} onChange={(e) => set("status", e.target.value)}>
        <option value="all">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
