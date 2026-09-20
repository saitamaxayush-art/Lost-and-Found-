import { Navigate, Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";

// The landing page IS the whole product: search, reporting, how it works,
// history and contact all live on this one page.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
