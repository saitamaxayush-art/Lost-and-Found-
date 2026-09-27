import { Navigate, Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import TermsAndPolicy from "./pages/TermsAndPolicy";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/terms" element={<TermsAndPolicy initialTab="terms" />} />
      <Route path="/terms-and-conditions" element={<TermsAndPolicy initialTab="terms" />} />
      <Route path="/privacy" element={<TermsAndPolicy initialTab="policy" />} />
      <Route path="/privacy-policy" element={<TermsAndPolicy initialTab="policy" />} />
      <Route path="/policy" element={<TermsAndPolicy initialTab="policy" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
