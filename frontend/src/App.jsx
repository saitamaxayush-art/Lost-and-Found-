import { Routes, Route } from "react-router-dom";
import { useApp } from "./context/AppContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import ReportLost from "./pages/ReportLost";
import ReportFound from "./pages/ReportFound";
import ItemDetail from "./pages/ItemDetail";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import HistoryModal from "./components/modals/HistoryModal";
import ContactModal from "./components/modals/ContactModal";
import HowItWorksModal from "./components/landing/HowItWorksModal";
import LoginModal from "./components/landing/LoginModal";

export default function App() {
  const { activeModal, closeModal } = useApp();

  return (
    <div className="app-shell">
      {/* Top Navigation Bar with History, Contact us, How it works */}
      <Navbar />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Home />} />
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
      </main>

      {/* Global Modals triggered from Navbar, Hero CTAs, or Footer */}
      <HistoryModal
        open={activeModal === "history"}
        onClose={closeModal}
      />

      <ContactModal
        open={activeModal === "contact"}
        onClose={closeModal}
      />

      <HowItWorksModal
        open={activeModal === "howItWorks"}
        onClose={closeModal}
      />

      <LoginModal
        open={activeModal === "login"}
        onClose={closeModal}
        onSuccess={closeModal}
      />
    </div>
  );
}
