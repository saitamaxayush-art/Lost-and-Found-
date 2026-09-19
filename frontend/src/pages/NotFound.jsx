import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="page">
      <div className="empty-state">
        <h2 style={{ marginBottom: "0.6rem" }}>Page not found</h2>
        <p style={{ marginBottom: "1rem" }}>The page you're looking for doesn't exist.</p>
        <Link to="/browse" className="link-btn">
          Back to browse
        </Link>
      </div>
    </div>
  );
}
