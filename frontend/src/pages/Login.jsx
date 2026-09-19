import { useLocation } from "react-router-dom";
import LoginForm from "../components/LoginForm";

export default function Login() {
  const location = useLocation();
  const redirectTo = location.state?.from || "/browse";

  return (
    <div className="page">
      <div className="auth-wrap">
        <h1>Log in to HYT</h1>
        <p>
          <strong>Have Your Thing</strong> — Enter your name and WhatsApp contact number to browse the campus board, report lost or found items, and receive instant match notifications.
        </p>
        <LoginForm initialRedirect={redirectTo} />
      </div>
    </div>
  );
}
