import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Browse from "./pages/Browse";
import ReportLost from "./pages/ReportLost";
import ReportFound from "./pages/ReportFound";
import ItemDetail from "./pages/ItemDetail";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

export default function App() {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <div className="app-shell">
      {/* On "/" render NO Navbar */}
      {!isLanding && <Navbar />}

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/item/:id" element={<ItemDetail />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/report-lost"
          element={
            <ProtectedRoute>
              <ReportLost />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report-found"
          element={
            <ProtectedRoute>
              <ReportFound />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* On "/" render NO footer */}
      {!isLanding && (
        <footer className="site-footer">
          <div className="footer-inner">
            <div className="footer-brand">
              <span className="brand-mark">FB</span>
              <strong>FindBack</strong>
              <p>Campus Lost &amp; Found Portal. Helping students and faculty recover what matters.</p>
            </div>
            <div className="footer-links">
              <a href="/">Story</a>
              <a href="/browse">Browse Board</a>
              <a href="/report-lost">Report Lost</a>
              <a href="/report-found">Report Found</a>
            </div>
          </div>
          <div className="footer-bottom">
            FindBack — Campus Lost &amp; Found Story &amp; Recovery Platform
          </div>
        </footer>
      )}
    </div>
  );
}
