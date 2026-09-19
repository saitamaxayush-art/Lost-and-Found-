import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import FilterBar from "../components/FilterBar";
import ItemCard from "../components/ItemCard";

export default function Browse() {
  const { items } = useApp();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [filters, setFilters] = useState({
    query: initialQuery,
    type: "all",
    category: "all",
    status: "all",
  });

  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) {
      setFilters((prev) => ({ ...prev, query: q }));
    }
  }, [searchParams]);

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => (filters.type === "all" ? true : item.type === filters.type))
      .filter((item) => (filters.category === "all" ? true : item.category === filters.category))
      .filter((item) => (filters.status === "all" ? true : item.status === filters.status))
      .filter((item) =>
        filters.query.trim()
          ? item.description.toLowerCase().includes(filters.query.trim().toLowerCase())
          : true
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [items, filters]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Browse reported items</h1>
        <p>Search and filter everything reported lost or found across campus.</p>
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      {filteredItems.length === 0 ? (
        <div className="empty-state">
          <h3>No items found</h3>
          <p style={{ marginTop: "0.5rem" }}>
            No items match those filters yet. Try widening your search keywords or resetting filters.
          </p>
        </div>
      ) : (
        <div className="item-grid">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
