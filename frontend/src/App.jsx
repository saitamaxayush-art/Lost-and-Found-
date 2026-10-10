import { Navigate, Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import Profile from "./pages/Profile";
import People from "./pages/People";
import EditProfile from "./pages/EditProfile";
import TermsAndPolicy from "./pages/TermsAndPolicy";
import CustomCursor from "./components/landing/CustomCursor";
import "./styles/cursor.css";

export default function App() {
  return (
    <>
      <CustomCursor />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/people" element={<People />} />
        <Route path="/terms" element={<TermsAndPolicy initialTab="terms" />} />
        <Route path="/terms-and-conditions" element={<TermsAndPolicy initialTab="terms" />} />
        <Route path="/privacy" element={<TermsAndPolicy initialTab="policy" />} />
        <Route path="/privacy-policy" element={<TermsAndPolicy initialTab="policy" />} />
        <Route path="/policy" element={<TermsAndPolicy initialTab="policy" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
