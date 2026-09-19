import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const redirectTo = location.state?.from || "/";

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    login(name.trim(), email.trim());
    navigate(redirectTo, { replace: true });
  }

  return (
    <div className="page">
      <div className="auth-wrap">
        <h1>Log in to FindBack</h1>
        <p>
          This is a demo login for the hackathon prototype — any name and email works, nothing
          is sent anywhere. Swap this for real authentication when the backend is ready.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aditi Sharma"
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="email">College email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. aditi@college.edu"
              required
            />
          </div>
          <button className="submit-btn" type="submit">
            Log in
          </button>
        </form>
      </div>
    </div>
  );
}
