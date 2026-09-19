import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import FilterBar from "../components/FilterBar";
import ItemCard from "../components/ItemCard";

export default function Home() {
  const { items } = useApp();
  const [filters, setFilters] = useState({
    query: "",
    type: "all",
    category: "all",
    status: "all",
  });

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
        <div className="empty-state">No items match those filters yet. Try widening your search.</div>
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
