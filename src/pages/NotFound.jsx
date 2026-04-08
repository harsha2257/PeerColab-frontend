import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="auth-page">
      <div className="card" style={{ maxWidth: "400px", width: "100%", textAlign: "center" }}>
        <h1 style={{ marginBottom: "12px" }}>404</h1>
        <p style={{ marginBottom: "20px" }}>Page not found</p>
        <Link to="/auth" className="primary-btn" style={{ display: "inline-block", textDecoration: "none" }}>
          Go to Login
        </Link>
      </div>
    </div>
  );
}