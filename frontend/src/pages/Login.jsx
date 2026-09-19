import { useLocation, useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/browse";

  return (
    <div className="page">
      <div className="auth-wrap">
        <h1>Log in to FindBack</h1>
        <p>
          Demo sign-in for the hackathon prototype: your name, WhatsApp number and campus are
          stored only in this browser. Swap this for real authentication when the backend is ready.
        </p>
        <LoginForm onSuccess={() => navigate(redirectTo, { replace: true })} />
      </div>
    </div>
  );
}
