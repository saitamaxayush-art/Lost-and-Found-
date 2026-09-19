import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import ReportLost from "./pages/ReportLost";
import ReportFound from "./pages/ReportFound";
import ItemDetail from "./pages/ItemDetail";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
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

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="brand-mark">FB</span>
            <strong>FindBack</strong>
            <p>Campus Lost &amp; Found Portal. Helping students and faculty recover what matters.</p>
          </div>
          <div className="footer-links">
            <a href="/">Home</a>
            <a href="/browse">Browse Items</a>
            <a href="/#how-it-works">How It Works</a>
            <a href="/#faqs">FAQs</a>
            <a href="/report-lost">Report Lost</a>
            <a href="/report-found">Report Found</a>
          </div>
        </div>
        <div className="footer-bottom">
          FindBack — Student &amp; Campus Lost &amp; Found Management Solution
        </div>
      </footer>
    </div>
  );
}
