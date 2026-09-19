import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";

export default function ItemCard({ item }) {
  return (
    <Link to={`/item/${item.id}`} className="item-card">
      <div className="item-card-media">
        {item.image ? <img src={item.image} alt={item.description} /> : "No photo added"}
      </div>
      <div className="item-card-body">
        <div className="item-card-top">
          <span className={`type-tag ${item.type}`}>
            {item.type === "lost" ? "Lost" : "Found"}
          </span>
          <StatusBadge status={item.status} />
        </div>
        <h3>{item.description}</h3>
        <div className="item-meta">
          <span>{item.category}</span>
          <span>{item.date}</span>
        </div>
      </div>
    </Link>
  );
}
